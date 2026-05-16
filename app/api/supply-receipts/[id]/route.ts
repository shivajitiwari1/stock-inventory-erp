import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('supplyReceipts.json');
    const index = data.supplyReceipts.findIndex((r: any) => r.id === id);
    if (index === -1) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    data.supplyReceipts[index] = {
      ...data.supplyReceipts[index],
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      warehouseId: body.warehouseId,
      warehouseName: body.warehouseName,
      dateTime: body.dateTime,
      verifiedBy: body.verifiedBy,
      totalAmount: Number(body.totalAmount),
      gatePassNumber: body.gatePassNumber || '',
      items: body.items || [],
      receiptFile: body.receiptFile ?? data.supplyReceipts[index].receiptFile,
      updatedAt: new Date().toISOString(),
    };
    writeJSON('supplyReceipts.json', data);
    return NextResponse.json(data.supplyReceipts[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('supplyReceipts.json');
    const index = data.supplyReceipts.findIndex((r: any) => r.id === id);
    if (index === -1) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    data.supplyReceipts.splice(index, 1);
    writeJSON('supplyReceipts.json', data);
    return NextResponse.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
}
