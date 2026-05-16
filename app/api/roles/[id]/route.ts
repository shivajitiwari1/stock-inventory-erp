import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('roles.json');
    const index = data.roles.findIndex((r: any) => r.id === id);
    if (index === -1) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    data.roles[index] = {
      ...data.roles[index],
      name: body.name ?? data.roles[index].name,
      description: body.description ?? data.roles[index].description,
      permissions: body.permissions ?? data.roles[index].permissions,
      updatedAt: new Date().toISOString(),
    };
    writeJSON('roles.json', data);
    return NextResponse.json(data.roles[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('roles.json');
    const role = data.roles.find((r: any) => r.id === id);
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    if (role.isSystem) return NextResponse.json({ error: 'System roles cannot be deleted' }, { status: 403 });

    data.roles = data.roles.filter((r: any) => r.id !== id);
    writeJSON('roles.json', data);
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
