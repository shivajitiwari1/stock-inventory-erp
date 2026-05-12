import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('products.json');
    const product = data.products.find((p: any) => p.id === id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('products.json');
    const index = data.products.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    data.products[index] = {
      ...data.products[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    writeJSON('products.json', data);
    return NextResponse.json(data.products[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('products.json');
    const index = data.products.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    data.products.splice(index, 1);
    writeJSON('products.json', data);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
