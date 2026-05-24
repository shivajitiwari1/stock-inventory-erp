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

    await d1Run(
      `INSERT INTO stock_transfers (id, fromWarehouseId, toWarehouseId, productName, quantity, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.fromWarehouseId ?? null,
        body.toWarehouseId ?? null,
        body.productName ?? null,
        body.quantity ?? null,
        body.status ?? 'pending',
        date,
      ]
    );

    const [newTransfer] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json(newTransfer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
