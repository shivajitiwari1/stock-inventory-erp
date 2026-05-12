import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const data = readJSON('suppliers.json');
    if (!data) {
      return NextResponse.json({ error: 'Failed to read suppliers' }, { status: 500 });
    }

    return NextResponse.json(data.suppliers || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('suppliers.json');

    if (!data || !Array.isArray(data.suppliers)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const newSupplier = {
      id: `SUP${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    data.suppliers.push(newSupplier);
    writeJSON('suppliers.json', data);

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    const data = readJSON('suppliers.json');
    const index = data.suppliers.findIndex((s: any) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    data.suppliers[index] = {
      ...data.suppliers[index],
      ...body,
    };

    writeJSON('suppliers.json', data);
    return NextResponse.json(data.suppliers[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}
