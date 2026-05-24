import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sql = 'SELECT * FROM stock_movements';
    const params: any[] = [];
    const conditions: string[] = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (productId) {
      conditions.push('productId = ?');
      params.push(productId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC LIMIT ?';
    params.push(limit);

    const rows = await d1Query(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    await d1Run(
      `INSERT INTO stock_movements
         (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.productId,
        body.warehouseId || null,
        body.type,
        Number(body.quantity),
        body.reason || null,
        body.reference || null,
        body.performedBy || null,
        body.notes || null,
        now,
      ]
    );

    const [row] = await d1Query('SELECT * FROM stock_movements WHERE id = ?', [id]);
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 });
  }
}
