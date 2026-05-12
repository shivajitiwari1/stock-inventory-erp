import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('inventory.json');
    const item = data.inventory.find((i: any) => i.id === id);
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('inventory.json');
    const index = data.inventory.findIndex((i: any) => i.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    data.inventory[index] = {
      ...data.inventory[index],
      ...body,
      lastUpdated: new Date().toISOString(),
    };

    writeJSON('inventory.json', data);
    return NextResponse.json(data.inventory[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('inventory.json');
    const index = data.inventory.findIndex((i: any) => i.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    data.inventory.splice(index, 1);
    writeJSON('inventory.json', data);
    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
