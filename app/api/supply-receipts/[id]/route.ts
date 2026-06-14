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
    const dateTime = (body.dateTime || '').replace(/T(\d{2}:\d{2})$/, 'T$1:00');
    const oldWarehouseId: string = existing[0].warehouseId;
    const oldItems: any[] = JSON.parse(existing[0].items || '[]');
    const newItems: any[] = body.items || [];
    const newWarehouseId: string = body.warehouseId || oldWarehouseId;
    const now = new Date().toISOString();

    // Reverse old inventory contributions
    for (const item of oldItems) {
      if (!item.productId || !oldWarehouseId || !(Number(item.quantity) > 0)) continue;
      const qty = Number(item.quantity);
      await d1Run(
        'UPDATE inventory SET availableQuantity = GREATEST(0, availableQuantity - ?), totalQuantity = GREATEST(0, totalQuantity - ?), lastUpdated = ? WHERE productId = ? AND warehouseId = ?',
        [qty, qty, now, item.productId, oldWarehouseId]
      );
    }

    // Apply new inventory contributions
    for (const item of newItems) {
      if (!item.productId || !newWarehouseId || !(Number(item.quantity) > 0)) continue;
      const qty = Number(item.quantity);
      const [inv] = await d1Query('SELECT id FROM inventory WHERE productId = ? AND warehouseId = ?', [item.productId, newWarehouseId]);
      if (inv) {
        await d1Run(
          'UPDATE inventory SET availableQuantity = availableQuantity + ?, totalQuantity = totalQuantity + ?, lastUpdated = ? WHERE productId = ? AND warehouseId = ?',
          [qty, qty, now, item.productId, newWarehouseId]
        );
      } else {
        const invId = Date.now().toString() + Math.random().toString(36).slice(2);
        await d1Run(
          'INSERT INTO inventory (id, productId, warehouseId, availableQuantity, reservedQuantity, totalQuantity, damagedQuantity, lostQuantity, lastUpdated) VALUES (?, ?, ?, ?, 0, ?, 0, 0, ?)',
          [invId, item.productId, newWarehouseId, qty, qty, now]
        );
      }
    }

    await d1Run(
      `UPDATE supply_receipts SET
        supplierId = ?, supplierName = ?, warehouseId = ?, warehouseName = ?,
        dateTime = ?, verifiedBy = ?, totalAmount = ?, gatePassNumber = ?,
        items = ?, receiptFile = ?
       WHERE id = ?`,
      [
        body.supplierId || existing[0].supplierId,
        body.supplierName || existing[0].supplierName,
        newWarehouseId,
        body.warehouseName || existing[0].warehouseName,
        dateTime || existing[0].dateTime,
        body.verifiedBy ?? existing[0].verifiedBy ?? '',
        Number(body.totalAmount) || 0,
        body.gatePassNumber ?? existing[0].gatePassNumber ?? '',
        JSON.stringify(newItems),
        receiptFile,
        id,
      ]
    );

    const updated = {
      ...existing[0],
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      warehouseId: newWarehouseId,
      warehouseName: body.warehouseName,
      dateTime,
      verifiedBy: body.verifiedBy,
      totalAmount: Number(body.totalAmount),
      gatePassNumber: body.gatePassNumber || '',
      items: newItems,
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
