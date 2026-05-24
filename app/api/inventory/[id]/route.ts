import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const rows = await d1Query<any>('SELECT * FROM inventory WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
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

    const existing = await d1Query<any>('SELECT * FROM inventory WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const current = existing[0];

    const productId        = body.productId        ?? current.productId;
    const warehouseId      = body.warehouseId      ?? current.warehouseId;
    const totalQuantity    = body.totalQuantity     ?? current.totalQuantity;
    const availableQuantity = body.availableQuantity ?? current.availableQuantity;
    const reservedQuantity = body.reservedQuantity  ?? current.reservedQuantity;
    const damagedQuantity  = body.damagedQuantity   ?? current.damagedQuantity;
    const lostQuantity     = body.lostQuantity      ?? current.lostQuantity;

    await d1Run(
      `UPDATE inventory
       SET productId = ?, warehouseId = ?, totalQuantity = ?, availableQuantity = ?, reservedQuantity = ?, damagedQuantity = ?, lostQuantity = ?, lastUpdated = ?
       WHERE id = ?`,
      [productId, warehouseId, totalQuantity, availableQuantity, reservedQuantity, damagedQuantity, lostQuantity, now, id]
    );

    const updated = await d1Query<any>('SELECT * FROM inventory WHERE id = ?', [id]);
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const existing = await d1Query<any>('SELECT * FROM inventory WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM inventory WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
