import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

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
    const newStatus = body.status;
    const prevStatus = existing.status;
    const qty = Number(body.quantity ?? existing.quantity);
    const returnedQty = Number(body.returnedQty ?? 0);
    const productId = body.productId ?? existing.productId;
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

    // Update inventory only when status changes
    if (productId && warehouseId && newStatus !== prevStatus) {
      const movId = () => Date.now().toString() + Math.random().toString(36).slice(2);

      if (newStatus === 'Completed' && prevStatus !== 'Completed') {
        // Reduce inventory by full issued quantity
        await d1Run(
          `UPDATE inventory SET
             availableQuantity = MAX(0, availableQuantity - ?),
             totalQuantity = MAX(0, totalQuantity - ?),
             lastUpdated = ?
           WHERE productId = ? AND warehouseId = ?`,
          [qty, qty, now, productId, warehouseId]
        );
        await d1Run(
          `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
           VALUES (?, ?, ?, 'STOCK_OUT', ?, 'Stock Issue Completed', ?, ?, ?, ?)`,
          [movId(), productId, warehouseId, qty, id, body.issuedBy || null, body.contractorName || null, now]
        );
      } else if (newStatus === 'Partially Returned' && returnedQty > 0) {
        // Add returned quantity back to inventory
        await d1Run(
          `UPDATE inventory SET
             availableQuantity = availableQuantity + ?,
             totalQuantity = totalQuantity + ?,
             lastUpdated = ?
           WHERE productId = ? AND warehouseId = ?`,
          [returnedQty, returnedQty, now, productId, warehouseId]
        );
        await d1Run(
          `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
           VALUES (?, ?, ?, 'STOCK_IN', ?, 'Partial Return', ?, ?, ?, ?)`,
          [movId(), productId, warehouseId, returnedQty, id, body.issuedBy || null, body.contractorName || null, now]
        );
      } else if (newStatus === 'Fully Returned') {
        // Return entire quantity to inventory
        await d1Run(
          `UPDATE inventory SET
             availableQuantity = availableQuantity + ?,
             totalQuantity = totalQuantity + ?,
             lastUpdated = ?
           WHERE productId = ? AND warehouseId = ?`,
          [qty, qty, now, productId, warehouseId]
        );
        await d1Run(
          `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
           VALUES (?, ?, ?, 'STOCK_IN', ?, 'Full Return', ?, ?, ?, ?)`,
          [movId(), productId, warehouseId, qty, id, body.issuedBy || null, body.contractorName || null, now]
        );
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
    await d1Run('DELETE FROM stock_issues WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Stock issue deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete stock issue' }, { status: 500 });
  }
}
