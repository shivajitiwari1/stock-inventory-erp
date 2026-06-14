import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { stockIssueNetOut } from '../route';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [row] = await d1Query('SELECT * FROM stock_issues WHERE id = ?', [id]);
    if (!row) {
      return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const [existing] = await d1Query('SELECT * FROM stock_issues WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const newStatus  = body.status ?? existing.status;
    const qty        = Number(body.quantity ?? existing.quantity);
    const returnedQty = Number(body.returnedQty ?? 0);
    const productId  = body.productId ?? existing.productId;
    const warehouseId = body.warehouseId ?? existing.warehouseId;

    await d1Run(
      `UPDATE stock_issues SET
         productId = ?, productName = ?, quantity = ?, unit = ?,
         warehouseId = ?, contractorId = ?, contractorName = ?,
         purpose = ?, issuedBy = ?, status = ?, notes = ?,
         issueDate = ?, returnedQty = ?, updatedAt = ?
       WHERE id = ?`,
      [
        productId,
        body.productName ?? existing.productName,
        qty,
        body.unit || existing.unit || '',
        warehouseId,
        body.contractorId ?? existing.contractorId,
        body.contractorName ?? existing.contractorName,
        body.gatePass ?? body.purpose ?? existing.purpose ?? null,
        body.issuedBy || existing.issuedBy || null,
        newStatus,
        body.notes || existing.notes || null,
        body.issueDate ?? existing.issueDate,
        returnedQty,
        now,
        id,
      ]
    );

    // Delta-based inventory sync:
    // Compare "net out" before and after to determine the inventory adjustment.
    // This handles status changes, qty changes, and returnedQty changes in one place.
    if (productId && warehouseId) {
      const oldNetOut = stockIssueNetOut(existing.status, Number(existing.quantity), Number(existing.returnedQty ?? 0));
      const newNetOut = stockIssueNetOut(newStatus, qty, returnedQty);
      const delta = newNetOut - oldNetOut;

      if (delta !== 0) {
        const movId = () => Date.now().toString() + Math.random().toString(36).slice(2);

        if (delta > 0) {
          // More items now out → deduct more from inventory
          await d1Run(
            `UPDATE inventory SET
               availableQuantity = GREATEST(0, availableQuantity - ?),
               totalQuantity = GREATEST(0, totalQuantity - ?),
               lastUpdated = ?
             WHERE productId = ? AND warehouseId = ?`,
            [delta, delta, now, productId, warehouseId]
          );
          await d1Run(
            `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
             VALUES (?, ?, ?, 'STOCK_OUT', ?, 'Stock Issue Update', ?, ?, ?, ?)`,
            [movId(), productId, warehouseId, delta, id, body.issuedBy || null, body.contractorName || null, now]
          );
        } else {
          // Items returned to inventory
          const addBack = -delta;
          await d1Run(
            `UPDATE inventory SET
               availableQuantity = availableQuantity + ?,
               totalQuantity = totalQuantity + ?,
               lastUpdated = ?
             WHERE productId = ? AND warehouseId = ?`,
            [addBack, addBack, now, productId, warehouseId]
          );
          await d1Run(
            `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
             VALUES (?, ?, ?, 'STOCK_IN', ?, 'Stock Return', ?, ?, ?, ?)`,
            [movId(), productId, warehouseId, addBack, id, body.issuedBy || null, body.contractorName || null, now]
          );
        }
      }
    }

    const [updated] = await d1Query('SELECT * FROM stock_issues WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT stock-issues error:', error?.message);
    return NextResponse.json({ error: 'Failed to update stock issue' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM stock_issues WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    }

    // Restore inventory: add back whatever was "out" for this issue
    const netOut = stockIssueNetOut(existing.status, Number(existing.quantity), Number(existing.returnedQty ?? 0));
    if (existing.productId && existing.warehouseId && netOut > 0) {
      const now = new Date().toISOString();
      await d1Run(
        `UPDATE inventory SET
           availableQuantity = availableQuantity + ?,
           totalQuantity = totalQuantity + ?,
           lastUpdated = ?
         WHERE productId = ? AND warehouseId = ?`,
        [netOut, netOut, now, existing.productId, existing.warehouseId]
      );
    }

    await d1Run('DELETE FROM stock_issues WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Stock issue deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete stock issue' }, { status: 500 });
  }
}
