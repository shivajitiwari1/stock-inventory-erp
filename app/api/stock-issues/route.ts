import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET() {
  try {
    const rows = await d1Query('SELECT * FROM stock_issues ORDER BY createdAt DESC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const dateStr = now.slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const id = `MI-${dateStr}-${suffix}`;
    const qty = Number(body.quantity);
    const returnedQty = Number(body.returnedQty ?? 0);
    const status = body.status || 'Issued';

    await d1Run(
      `INSERT INTO stock_issues
         (id, productId, productName, unit, warehouseId, contractorId, contractorName,
          quantity, purpose, issuedBy, status, notes, issueDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.productId,
        body.productName,
        body.unit || '',
        body.warehouseId || null,
        body.contractorId,
        body.contractorName,
        qty,
        body.gatePass || null,
        body.issuedBy || null,
        status,
        body.notes || null,
        body.issueDate,
        now,
        now,
      ]
    );

    // Deduct inventory: items physically leave the warehouse on issue creation.
    // netOutQty = items that are "out" (not yet returned) based on initial status.
    const netOut = stockIssueNetOut(status, qty, returnedQty);
    if (body.productId && body.warehouseId && netOut > 0) {
      await d1Run(
        `UPDATE inventory SET
           availableQuantity = GREATEST(0, availableQuantity - ?),
           totalQuantity = GREATEST(0, totalQuantity - ?),
           lastUpdated = ?
         WHERE productId = ? AND warehouseId = ?`,
        [netOut, netOut, now, body.productId, body.warehouseId]
      );
      const movId = Date.now().toString() + Math.random().toString(36).slice(2);
      await d1Run(
        `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
         VALUES (?, ?, ?, 'STOCK_OUT', ?, 'Stock Issue', ?, ?, ?, ?)`,
        [movId, body.productId, body.warehouseId, netOut,
         id, body.issuedBy || null, body.contractorName || null, now]
      );
    }

    const [row] = await d1Query('SELECT * FROM stock_issues WHERE id = ?', [id]);
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stock issue' }, { status: 500 });
  }
}

/**
 * Net quantity "out" (deducted from inventory) for a given status.
 * Fully Returned = 0 (all back), Partially Returned = qty - returnedQty, others = full qty.
 */
export function stockIssueNetOut(status: string, qty: number, returnedQty: number): number {
  if (status === 'Fully Returned') return 0;
  if (status === 'Partially Returned') return Math.max(0, qty - returnedQty);
  return qty;
}
