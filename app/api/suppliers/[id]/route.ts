import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('suppliers.json');
    const supplier = data.suppliers.find((s: any) => s.id === id);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('suppliers.json');
    const index = data.suppliers.findIndex((s: any) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    data.suppliers[index] = { ...data.suppliers[index], ...body, updatedAt: new Date().toISOString() };
    writeJSON('suppliers.json', data);
    return NextResponse.json(data.suppliers[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('suppliers.json');
    const index = data.suppliers.findIndex((s: any) => s.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    data.suppliers.splice(index, 1);
    writeJSON('suppliers.json', data);
    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
