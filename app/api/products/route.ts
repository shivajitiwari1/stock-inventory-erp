import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(name LIKE ? OR sku LIKE ? OR description LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM products ${where} ORDER BY createdAt DESC`;

    const products = await d1Query<any>(sql, params);

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    const now = new Date().toISOString();

    const {
      name,
      sku,
      category,
      description,
      unitType,
      price,
      image,
      minQuantity,
    } = body;

    await d1Run(
      `INSERT INTO products (id, name, sku, category, description, unitType, price, image, minQuantity, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, sku, category, description ?? null, unitType ?? null, price ?? null, image ?? null, minQuantity ?? null, now, now]
    );

    const rows = await d1Query<any>('SELECT * FROM products WHERE id = ?', [id]);
    const newProduct = rows[0];

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
