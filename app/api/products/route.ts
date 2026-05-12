import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, appendToJSON, deleteFromJSON, generateId } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const data = readJSON('products.json');
    if (!data) {
      return NextResponse.json({ error: 'Failed to read products' }, { status: 500 });
    }

    let products = data.products || [];

    if (category) {
      products = products.filter((p: any) => p.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('products.json');

    if (!data || !Array.isArray(data.products)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const newProduct = {
      id: generateId('P'),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.products.push(newProduct);
    writeJSON('products.json', data);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
