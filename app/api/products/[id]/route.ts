import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const rows = await d1Query<any>('SELECT * FROM products WHERE id = ?', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const existing = await d1Query<any>('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const current = existing[0];

    const name        = body.name        ?? current.name;
    const sku         = body.sku         ?? current.sku;
    const category    = body.category    ?? current.category;
    const description = body.description ?? current.description;
    const unitType    = body.unitType    ?? current.unitType;
    const price       = body.price       ?? current.price;
    const image       = body.image       ?? current.image;
    const minQuantity = body.minQuantity ?? current.minQuantity;

    await d1Run(
      `UPDATE products
       SET name = ?, sku = ?, category = ?, description = ?, unitType = ?, price = ?, image = ?, minQuantity = ?, updatedAt = ?
       WHERE id = ?`,
      [name, sku, category, description, unitType, price, image, minQuantity, now, id]
    );

    const updated = await d1Query<any>('SELECT * FROM products WHERE id = ?', [id]);
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const existing = await d1Query<any>('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete related records without CASCADE first
    await d1Run('DELETE FROM stock_issues WHERE productId = ?', [id]);
    await d1Run('DELETE FROM stock_movements WHERE productId = ?', [id]);
    await d1Run('DELETE FROM inventory WHERE productId = ?', [id]);
    await d1Run('DELETE FROM products WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
