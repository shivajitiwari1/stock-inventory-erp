import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

function parseRole(row: any) {
  return {
    ...row,
    permissions: row.permissions ? JSON.parse(row.permissions) : {},
    isSystem: row.isSystem === 1,
    isAdmin: row.isAdmin === 1,
  };
}

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [row] = await d1Query('SELECT * FROM roles WHERE id = ?', [id]);
    if (!row) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json(parseRole(row));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const [existing] = await d1Query('SELECT * FROM roles WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const name = body.name ?? existing.name;
    const description = body.description ?? existing.description;
    const permissions =
      body.permissions !== undefined
        ? JSON.stringify(body.permissions)
        : existing.permissions;

    await d1Run(
      `UPDATE roles SET name = ?, description = ?, permissions = ?, updatedAt = ? WHERE id = ?`,
      [name, description, permissions, now, id]
    );

    const [updated] = await d1Query('SELECT * FROM roles WHERE id = ?', [id]);
    return NextResponse.json(parseRole(updated));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [role] = await d1Query('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    if (role.isSystem === 1) {
      return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 403 });
    }
    await d1Run('DELETE FROM roles WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
