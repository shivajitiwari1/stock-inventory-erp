import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('roles.json');
    if (!data) return NextResponse.json({ error: 'Failed to read roles' }, { status: 500 });
    return NextResponse.json(data.roles || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('roles.json');
    if (!data || !Array.isArray(data.roles)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    // Generate key from name: "Site Manager" -> "SITE_MANAGER"
    const key = body.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

    if (data.roles.some((r: any) => r.key === key)) {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
    }

    const newRole = {
      id: generateId('ROLE'),
      name: body.name,
      key,
      description: body.description || '',
      isSystem: false,
      isAdmin: false,
      permissions: body.permissions || {},
    };

    data.roles.push(newRole);
    writeJSON('roles.json', data);
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
