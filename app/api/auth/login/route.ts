import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rows = await d1Query<any>(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Never return the password hash to the client
    const { password: _pw, ...safeUser } = user;
    // Parse permissions if stored as JSON string
    if (typeof safeUser.permissions === 'string') {
      try { safeUser.permissions = JSON.parse(safeUser.permissions); } catch { safeUser.permissions = null; }
    }

    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
