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

    await d1Run(
      `UPDATE stock_issues SET
         productId = ?, productName = ?, quantity = ?, unit = ?,
         warehouseId = ?, contractorId = ?, contractorName = ?,
         purpose = ?, issuedBy = ?, status = ?, notes = ?,
         issueDate = ?, updatedAt = ?
       WHERE id = ?`,
      [
        body.productId,
        body.productName,
        Number(body.quantity),
        body.unit || '',
        body.warehouseId || null,
        body.contractorId,
        body.contractorName,
        body.gatePass ?? body.purpose ?? null,
        body.issuedBy || null,
        body.status,
        body.notes || null,
        body.issueDate,
        now,
        id,
      ]
    );

    const [updated] = await d1Query('SELECT * FROM stock_issues WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error) {
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
