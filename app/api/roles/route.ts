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

export async function GET() {
  try {
    const rows = await d1Query('SELECT * FROM roles ORDER BY createdAt ASC');
    return NextResponse.json(rows.map(parseRole));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const key = body.name
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    const existing = await d1Query('SELECT id FROM roles WHERE key = ?', [key]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
    }

    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const permissions = JSON.stringify(body.permissions || {});

    await d1Run(
      `INSERT INTO roles (id, name, key, description, isSystem, isAdmin, permissions, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, body.name, key, body.description || '', 0, 0, permissions, now, now]
    );

    const [row] = await d1Query('SELECT * FROM roles WHERE id = ?', [id]);
    return NextResponse.json(parseRole(row), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
