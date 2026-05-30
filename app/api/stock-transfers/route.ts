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

/** Resolve productId by name if not already known */
async function resolveProductId(productId: string, productName: string): Promise<string> {
  if (productId) return productId;
  if (!productName) return '';
  const [prod] = await d1Query('SELECT id FROM products WHERE name = ? LIMIT 1', [productName]);
  return prod?.id ?? '';
}

/** Apply or reverse inventory for a completed transfer */
export async function applyInventory(
  productId: string,
  fromWhId: string,
  toWhId: string,
  qty: number,
  direction: 1 | -1,   // 1 = apply (COMPLETED), -1 = reverse
  ref: string,
  now: string
) {
  if (!productId || !fromWhId || !toWhId || qty <= 0) return;

  const movId = () => Date.now().toString() + Math.random().toString(36).slice(2);

  if (direction === 1) {
    // Deduct from source
    await d1Run(
      `UPDATE inventory SET availableQuantity = MAX(0, availableQuantity - ?), totalQuantity = MAX(0, totalQuantity - ?), lastUpdated = ? WHERE productId = ? AND warehouseId = ?`,
      [qty, qty, now, productId, fromWhId]
    );
    // Add to destination (upsert)
    const [inv] = await d1Query('SELECT id FROM inventory WHERE productId = ? AND warehouseId = ?', [productId, toWhId]);
    if (inv) {
      await d1Run(
        `UPDATE inventory SET availableQuantity = availableQuantity + ?, totalQuantity = totalQuantity + ?, lastUpdated = ? WHERE productId = ? AND warehouseId = ?`,
        [qty, qty, now, productId, toWhId]
      );
    } else {
      const invId = movId();
      await d1Run(
        `INSERT INTO inventory (id, productId, warehouseId, totalQuantity, availableQuantity, reservedQuantity, damagedQuantity, lostQuantity, lastUpdated) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?)`,
        [invId, productId, toWhId, qty, qty, now]
      );
    }
    // Log movements
    await d1Run(
      `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt) VALUES (?, ?, ?, 'STOCK_OUT', ?, 'Stock Transfer', ?, null, ?, ?)`,
      [movId(), productId, fromWhId, qty, ref, `Transfer to ${toWhId}`, now]
    );
    await d1Run(
      `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt) VALUES (?, ?, ?, 'STOCK_IN', ?, 'Stock Transfer', ?, null, ?, ?)`,
      [movId(), productId, toWhId, qty, ref, `Transfer from ${fromWhId}`, now]
    );
  } else {
    // Reverse: restore source, remove from destination
    await d1Run(
      `UPDATE inventory SET availableQuantity = availableQuantity + ?, totalQuantity = totalQuantity + ?, lastUpdated = ? WHERE productId = ? AND warehouseId = ?`,
      [qty, qty, now, productId, fromWhId]
    );
    await d1Run(
      `UPDATE inventory SET availableQuantity = MAX(0, availableQuantity - ?), totalQuantity = MAX(0, totalQuantity - ?), lastUpdated = ? WHERE productId = ? AND warehouseId = ?`,
      [qty, qty, now, productId, toWhId]
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const date = new Date().toISOString();
    const status = body.status ?? 'PENDING';
    const qty = Number(body.quantity ?? 0);

    const productId = await resolveProductId(body.productId ?? '', body.productName ?? '');

    await d1Run(
      `INSERT INTO stock_transfers (id, fromWarehouseId, toWarehouseId, productName, productId, quantity, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, body.fromWarehouseId ?? null, body.toWarehouseId ?? null, body.productName ?? null, productId, qty, status, date]
    );

    // Apply inventory immediately if created as COMPLETED
    if (status === 'COMPLETED' && productId) {
      await applyInventory(productId, body.fromWarehouseId, body.toWarehouseId, qty, 1, id, date);
    }

    const [newTransfer] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json(newTransfer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
