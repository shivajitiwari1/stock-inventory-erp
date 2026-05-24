import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const rows = await d1Query<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = rows[0];
    const passwordMatch = await verifyPassword(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await d1Run(
      'UPDATE users SET password = ?, updatedAt = ? WHERE id = ?',
      [newHash, new Date().toISOString(), userId]
    );

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
