import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { hashPassword } from '@/lib/auth';

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

    // If a new password is provided, validate and hash it; otherwise keep the existing hash
    let passwordHash = existing.password;
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      passwordHash = await hashPassword(body.newPassword);
    }

    const now = new Date().toISOString();

    await d1Run(
      `UPDATE users SET name = ?, email = ?, password = ?, role = ?, status = ?,
       lastLogin = ?, updatedAt = ?, permissions = ? WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.email ?? existing.email,
        passwordHash,
        body.role ?? existing.role,
        body.status ?? existing.status,
        existing.lastLogin,
        now,
        typeof body.permissions === 'string'
          ? body.permissions
          : JSON.stringify(body.permissions ?? (existing.permissions ? JSON.parse(existing.permissions) : {})),
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
