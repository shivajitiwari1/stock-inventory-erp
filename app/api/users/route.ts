import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { hashPassword } from '@/lib/auth';

function parseUser(row: any) {
  return {
    ...row,
    permissions: row.permissions ? JSON.parse(row.permissions) : {},
  };
}

export async function GET() {
  try {
    const rows = await d1Query('SELECT * FROM users ORDER BY createdAt DESC');
    return NextResponse.json({ users: rows.map(parseUser) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.password || body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const permissions = JSON.stringify(body.permissions || {});
    const hashedPassword = await hashPassword(body.password);

    await d1Run(
      `INSERT INTO users (id, name, email, password, role, status, createdAt, lastLogin, updatedAt, permissions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, body.name, body.email, hashedPassword, body.role, body.status || 'ACTIVE', now, now, now, permissions]
    );

    const [row] = await d1Query('SELECT * FROM users WHERE id = ?', [id]);
    return NextResponse.json(parseUser(row), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
