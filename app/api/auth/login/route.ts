import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { d1Query } from '@/lib/d1';
import { verifyPassword } from '@/lib/auth';
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from '@/lib/session';

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

    // Issue a signed session cookie (httpOnly — inaccessible to JS)
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE_SECONDS,
      path: '/',
    });

    // Never return the password hash to the client
    const { password: _pw, ...safeUser } = user;
    if (typeof safeUser.permissions === 'string') {
      try { safeUser.permissions = JSON.parse(safeUser.permissions); } catch { safeUser.permissions = null; }
    }

    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
