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

    const receiptFile = body.receiptFile ?? existing[0].receiptFile ?? '';

    // Ensure dateTime is stored as a plain ISO string (no trailing ':00' duplication)
    const dateTime = (body.dateTime || '').replace(/T(\d{2}:\d{2})$/, 'T$1:00');

    await d1Run(
      `UPDATE supply_receipts SET
        supplierId = ?, supplierName = ?, warehouseId = ?, warehouseName = ?,
        dateTime = ?, verifiedBy = ?, totalAmount = ?, gatePassNumber = ?,
        items = ?, receiptFile = ?
       WHERE id = ?`,
      [
        body.supplierId || existing[0].supplierId,
        body.supplierName || existing[0].supplierName,
        body.warehouseId || existing[0].warehouseId,
        body.warehouseName || existing[0].warehouseName,
        dateTime || existing[0].dateTime,
        body.verifiedBy ?? existing[0].verifiedBy ?? '',
        Number(body.totalAmount) || 0,
        body.gatePassNumber ?? existing[0].gatePassNumber ?? '',
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
      dateTime: dateTime,
      verifiedBy: body.verifiedBy,
      totalAmount: Number(body.totalAmount),
      gatePassNumber: body.gatePassNumber || '',
      items: body.items || [],
      receiptFile,
    };

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PUT supply-receipts error:', error?.message, error);
    return NextResponse.json(
      { error: 'Failed to update receipt', detail: error?.message || String(error) },
      { status: 500 }
    );
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
