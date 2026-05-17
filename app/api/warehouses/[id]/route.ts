import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('warehouses.json');
    const warehouse = data.warehouses.find((w: any) => w.id === id);
    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }
    return NextResponse.json(warehouse);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('warehouses.json');
    const index = data.warehouses.findIndex((w: any) => w.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    const updated: any = { ...data.warehouses[index], ...body, updatedAt: new Date().toISOString() };
    if (body.status === 'ACTIVE') {
      delete updated.archivedAt;
    }
    data.warehouses[index] = updated;
    writeJSON('warehouses.json', data);
    return NextResponse.json(data.warehouses[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('warehouses.json');
    const index = data.warehouses.findIndex((w: any) => w.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    data.warehouses[index] = {
      ...data.warehouses[index],
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    };
    writeJSON('warehouses.json', data);
    return NextResponse.json(data.warehouses[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to archive warehouse' }, { status: 500 });
  }
}
