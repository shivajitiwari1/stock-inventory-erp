import { NextRequest, NextResponse } from 'next/server';
import { d1Query } from '@/lib/d1';

// The middleware already verified the JWT and injected x-user-id header
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await d1Query<any>('SELECT * FROM users WHERE id = ?', [userId]);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { password: _pw, ...safeUser } = rows[0];
  if (typeof safeUser.permissions === 'string') {
    try { safeUser.permissions = JSON.parse(safeUser.permissions); } catch { safeUser.permissions = null; }
  }

  return NextResponse.json(safeUser);
}
