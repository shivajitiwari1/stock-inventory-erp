import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [transfer] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
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
    if (!existing) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    const newStatus    = body.status           ?? existing.status;
    const fromWhId     = body.fromWarehouseId  ?? existing.fromWarehouseId;
    const toWhId       = body.toWarehouseId    ?? existing.toWarehouseId;
    const productName  = body.productName      ?? existing.productName;
    const productId    = body.productId        ?? existing.productId ?? '';
    const qty          = Number(body.quantity  ?? existing.quantity);

    await d1Run(
      `UPDATE stock_transfers SET fromWarehouseId = ?, toWarehouseId = ?, productName = ?, productId = ?, quantity = ?, status = ? WHERE id = ?`,
      [fromWhId, toWhId, productName, productId, qty, newStatus, id]
    );

    // When status changes to COMPLETED: move stock between warehouses
    if (newStatus === 'COMPLETED' && existing.status !== 'COMPLETED') {
      const now = new Date().toISOString();
      const movId = () => Date.now().toString() + Math.random().toString(36).slice(2);

      // Resolve productId if not stored — look up by name
      let resolvedProductId = productId;
      if (!resolvedProductId && productName) {
        const [prod] = await d1Query('SELECT id FROM products WHERE name = ? LIMIT 1', [productName]);
        resolvedProductId = prod?.id || '';
      }

      if (resolvedProductId) {
        // Reduce stock at fromWarehouse
        await d1Run(
          `UPDATE inventory SET
             availableQuantity = MAX(0, availableQuantity - ?),
             totalQuantity = MAX(0, totalQuantity - ?),
             lastUpdated = ?
           WHERE productId = ? AND warehouseId = ?`,
          [qty, qty, now, resolvedProductId, fromWhId]
        );
        // Increase stock at toWarehouse (create record if missing)
        const [invRow] = await d1Query(
          'SELECT id FROM inventory WHERE productId = ? AND warehouseId = ?',
          [resolvedProductId, toWhId]
        );
        if (invRow) {
          await d1Run(
            `UPDATE inventory SET
               availableQuantity = availableQuantity + ?,
               totalQuantity = totalQuantity + ?,
               lastUpdated = ?
             WHERE productId = ? AND warehouseId = ?`,
            [qty, qty, now, resolvedProductId, toWhId]
          );
        } else {
          const invId = Date.now().toString() + Math.random().toString(36).slice(2);
          await d1Run(
            `INSERT INTO inventory (id, productId, warehouseId, totalQuantity, availableQuantity, reservedQuantity, damagedQuantity, lostQuantity, lastUpdated)
             VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?)`,
            [invId, resolvedProductId, toWhId, qty, qty, now]
          );
        }
        // Log movements
        await d1Run(
          `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
           VALUES (?, ?, ?, 'STOCK_OUT', ?, 'Stock Transfer', ?, null, ?, ?)`,
          [movId(), resolvedProductId, fromWhId, qty, id, `Transfer to warehouse ${toWhId}`, now]
        );
        await d1Run(
          `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
           VALUES (?, ?, ?, 'STOCK_IN', ?, 'Stock Transfer', ?, null, ?, ?)`,
          [movId(), resolvedProductId, toWhId, qty, id, `Transfer from warehouse ${fromWhId}`, now]
        );
      }
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
    if (!existing) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 });
  }
}
