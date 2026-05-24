import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');
    const productId = searchParams.get('productId');

    const conditions: string[] = [];
    const params: any[] = [];

    if (warehouseId) {
      conditions.push('warehouseId = ?');
      params.push(warehouseId);
    }

    if (productId) {
      conditions.push('productId = ?');
      params.push(productId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM inventory ${where}`;

    const inventory = await d1Query<any>(sql, params);

    return NextResponse.json(inventory);
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
      productId,
      warehouseId,
      totalQuantity,
      availableQuantity,
      reservedQuantity,
      damagedQuantity,
      lostQuantity,
    } = body;

    await d1Run(
      `INSERT INTO inventory (id, productId, warehouseId, totalQuantity, availableQuantity, reservedQuantity, damagedQuantity, lostQuantity, lastUpdated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        productId,
        warehouseId,
        totalQuantity     ?? 0,
        availableQuantity ?? 0,
        reservedQuantity  ?? 0,
        damagedQuantity   ?? 0,
        lostQuantity      ?? 0,
        now,
      ]
    );

    const rows = await d1Query<any>('SELECT * FROM inventory WHERE id = ?', [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
  }
}
