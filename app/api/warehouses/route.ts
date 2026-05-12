import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const data = readJSON('warehouses.json');
    if (!data) {
      return NextResponse.json({ error: 'Failed to read warehouses' }, { status: 500 });
    }

    return NextResponse.json(data.warehouses || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('warehouses.json');

    if (!data || !Array.isArray(data.warehouses)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const newWarehouse = {
      id: `WH${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    data.warehouses.push(newWarehouse);
    writeJSON('warehouses.json', data);

    return NextResponse.json(newWarehouse, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    const data = readJSON('warehouses.json');
    const index = data.warehouses.findIndex((w: any) => w.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    data.warehouses[index] = {
      ...data.warehouses[index],
      ...body,
    };

    writeJSON('warehouses.json', data);
    return NextResponse.json(data.warehouses[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}
