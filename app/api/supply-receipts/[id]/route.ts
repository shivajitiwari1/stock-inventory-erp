import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const rows = await d1Query('SELECT * FROM supply_receipts WHERE id = ?', [id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    const receipt = { ...rows[0], items: JSON.parse(rows[0].items || '[]') };
    return NextResponse.json(receipt);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const existing = await d1Query('SELECT * FROM supply_receipts WHERE id = ?', [id]);
    if (existing.length === 0) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

    const receiptFile = body.receiptFile ?? existing[0].receiptFile;

    await d1Run(
      `UPDATE supply_receipts SET
        supplierId = ?, supplierName = ?, warehouseId = ?, warehouseName = ?,
        dateTime = ?, verifiedBy = ?, totalAmount = ?, gatePassNumber = ?,
        items = ?, receiptFile = ?
       WHERE id = ?`,
      [
        body.supplierId,
        body.supplierName,
        body.warehouseId,
        body.warehouseName,
        body.dateTime,
        body.verifiedBy,
        Number(body.totalAmount),
        body.gatePassNumber || '',
        JSON.stringify(body.items || []),
        receiptFile,
        id,
      ]
    );

    const updated = {
      ...existing[0],
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      warehouseId: body.warehouseId,
      warehouseName: body.warehouseName,
      dateTime: body.dateTime,
      verifiedBy: body.verifiedBy,
      totalAmount: Number(body.totalAmount),
      gatePassNumber: body.gatePassNumber || '',
      items: body.items || [],
      receiptFile,
    };

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const existing = await d1Query('SELECT id FROM supply_receipts WHERE id = ?', [id]);
    if (existing.length === 0) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

    await d1Run('DELETE FROM supply_receipts WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
}
