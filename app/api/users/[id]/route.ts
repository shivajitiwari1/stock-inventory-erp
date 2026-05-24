import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

function parseUser(row: any) {
  return {
    ...row,
    permissions: row.permissions ? JSON.parse(row.permissions) : {},
  };
}

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [row] = await d1Query('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(parseUser(row));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const [existing] = await d1Query('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const merged = { ...existing, ...body, updatedAt: now };

    await d1Run(
      `UPDATE users SET name = ?, email = ?, password = ?, role = ?, status = ?,
       lastLogin = ?, updatedAt = ?, permissions = ? WHERE id = ?`,
      [
        merged.name,
        merged.email,
        merged.password,
        merged.role,
        merged.status,
        merged.lastLogin,
        now,
        typeof merged.permissions === 'string'
          ? merged.permissions
          : JSON.stringify(merged.permissions || {}),
        id,
      ]
    );

    const [updated] = await d1Query('SELECT * FROM users WHERE id = ?', [id]);
    return NextResponse.json(parseUser(updated));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await d1Run('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
