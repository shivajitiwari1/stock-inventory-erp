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

    data.warehouses[index] = { ...data.warehouses[index], ...body, updatedAt: new Date().toISOString() };
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

    data.warehouses.splice(index, 1);
    writeJSON('warehouses.json', data);
    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 });
  }
}
