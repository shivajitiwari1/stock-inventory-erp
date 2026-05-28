import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET() {
  try {
    const rows = await d1Query('SELECT * FROM supply_receipts ORDER BY createdAt DESC');
    const supplyReceipts = rows.map((r: any) => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
    }));
    return NextResponse.json(supplyReceipts);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();

    await d1Run(
      `INSERT INTO supply_receipts
        (id, supplierId, supplierName, warehouseId, warehouseName, dateTime, verifiedBy, totalAmount, gatePassNumber, items, receiptFile, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.supplierId,
        body.supplierName,
        body.warehouseId,
        body.warehouseName,
        body.dateTime,
        body.verifiedBy,
        Number(body.totalAmount),
        body.gatePassNumber || '',
        JSON.stringify(body.items || []),
        '',
        createdAt,
      ]
    );

    const newReceipt = {
      id,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      warehouseId: body.warehouseId,
      warehouseName: body.warehouseName,
      dateTime: body.dateTime,
      verifiedBy: body.verifiedBy,
      totalAmount: Number(body.totalAmount),
      gatePassNumber: body.gatePassNumber || '',
      items: body.items || [],
      receiptFile: '',
      createdAt,
    };

    // Record stock movement for each item received
    const items: any[] = body.items || [];
    for (const item of items) {
      if (item.productId && body.warehouseId) {
        const movId = Date.now().toString() + Math.random().toString(36).slice(2);
        await d1Run(
          `INSERT INTO stock_movements (id, productId, warehouseId, type, quantity, reason, reference, performedBy, notes, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [movId, item.productId, body.warehouseId, 'STOCK_IN', Number(item.quantity),
           'Supply Receipt', id, body.verifiedBy || null, body.supplierName || null, createdAt]
        );
      }
    }

    return NextResponse.json(newReceipt, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supply receipt' }, { status: 500 });
  }
}
