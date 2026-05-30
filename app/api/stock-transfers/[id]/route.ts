import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { applyInventory } from '../route';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [transfer] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    return NextResponse.json(transfer);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const [existing] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    if (!existing) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });

    const newStatus   = body.status           ?? existing.status;
    const fromWhId    = body.fromWarehouseId  ?? existing.fromWarehouseId;
    const toWhId      = body.toWarehouseId    ?? existing.toWarehouseId;
    const productName = body.productName      ?? existing.productName;
    const qty         = Number(body.quantity  ?? existing.quantity);
    const now         = new Date().toISOString();

    // Resolve productId (prefer incoming, fall back to stored, then name lookup)
    let productId = body.productId ?? existing.productId ?? '';
    if (!productId && productName) {
      const [prod] = await d1Query('SELECT id FROM products WHERE name = ? LIMIT 1', [productName]);
      productId = prod?.id ?? '';
    }

    await d1Run(
      `UPDATE stock_transfers SET fromWarehouseId = ?, toWarehouseId = ?, productName = ?, productId = ?, quantity = ?, status = ? WHERE id = ?`,
      [fromWhId, toWhId, productName, productId, qty, newStatus, id]
    );

    const wasCompleted = existing.status === 'COMPLETED';
    const isCompleted  = newStatus === 'COMPLETED';

    if (wasCompleted) {
      // Reverse previous inventory effect (old warehouses, old qty, old productId)
      const oldProductId = existing.productId || productId;
      const oldQty = Number(existing.quantity);
      await applyInventory(oldProductId, existing.fromWarehouseId, existing.toWarehouseId, oldQty, -1, id, now);
    }

    if (isCompleted && productId) {
      // Apply inventory for new/current values
      await applyInventory(productId, fromWhId, toWhId, qty, 1, id, now);
    }

    const [updated] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT stock-transfers error:', error?.message);
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    if (!existing) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });

    // If the transfer was COMPLETED, reverse its inventory effect before deleting
    if (existing.status === 'COMPLETED' && existing.productId) {
      const now = new Date().toISOString();
      await applyInventory(existing.productId, existing.fromWarehouseId, existing.toWarehouseId, Number(existing.quantity), -1, id, now);
    }

    await d1Run('DELETE FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 });
  }
}
