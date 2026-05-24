import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { hashPassword } from '@/lib/auth';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Tmp@${result}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const rows = await d1Query<any>(
      'SELECT id, name, status FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This account is inactive. Contact your administrator.' }, { status: 403 });
    }

    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);

    await d1Run(
      'UPDATE users SET password = ?, updatedAt = ? WHERE id = ?',
      [hash, new Date().toISOString(), user.id]
    );

    return NextResponse.json({
      message: 'Password has been reset',
      tempPassword,
      name: user.name,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
