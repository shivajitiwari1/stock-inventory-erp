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
        Number(body.quantity),
        body.gatePass || null,
        body.issuedBy || null,
        body.status || 'Issued',
        body.notes || null,
        body.issueDate,
        now,
        now,
      ]
    );

    const [row] = await d1Query('SELECT * FROM stock_issues WHERE id = ?', [id]);

    // Record stock movement
    if (body.productId && body.warehouseId) {
      const movId = Date.now().toString() + Math.random().toString(36).slice(2);
      await d1Run(
        `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [movId, body.productId, body.warehouseId, 'STOCK_OUT', Number(body.quantity),
         'Stock Issue', id, body.issuedBy || null, body.contractorName || null, now]
      );
    }

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stock issue' }, { status: 500 });
  }
}
