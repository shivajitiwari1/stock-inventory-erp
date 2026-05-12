import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');

    const data = readJSON('inventory.json');
    if (!data) {
      return NextResponse.json({ error: 'Failed to read inventory' }, { status: 500 });
    }

    let inventory = data.inventory || [];

    if (warehouseId) {
      inventory = inventory.filter((i: any) => i.warehouseId === warehouseId);
    }

    if (productId) {
      inventory = inventory.filter((i: any) => i.productId === productId);
    }

    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('inventory.json');

    if (!data || !Array.isArray(data.inventory)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const newInventory = {
      id: `INV${Date.now()}`,
      ...body,
      lastUpdated: new Date().toISOString(),
    };

    data.inventory.push(newInventory);
    writeJSON('inventory.json', data);

    return NextResponse.json(newInventory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
  }
}

