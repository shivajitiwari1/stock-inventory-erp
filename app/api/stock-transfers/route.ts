import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET() {
  try {
    const transfers = await d1Query('SELECT * FROM stock_transfers ORDER BY date DESC');
    return NextResponse.json(transfers);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const date = new Date().toISOString();

    // Resolve productId from productName if not provided
    let productId = body.productId ?? '';
    if (!productId && body.productName) {
      const [prod] = await d1Query('SELECT id FROM products WHERE name = ? LIMIT 1', [body.productName]);
      productId = prod?.id ?? '';
    }

    await d1Run(
      `INSERT INTO stock_transfers (id, fromWarehouseId, toWarehouseId, productName, productId, quantity, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.fromWarehouseId ?? null,
        body.toWarehouseId ?? null,
        body.productName ?? null,
        productId,
        body.quantity ?? null,
        body.status ?? 'PENDING',
        date,
      ]
    );

    const [newTransfer] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json(newTransfer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
