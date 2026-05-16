import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('supplyReceipts.json');
    if (!data) return NextResponse.json({ error: 'Failed to read supply receipts' }, { status: 500 });
    return NextResponse.json(data.supplyReceipts || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('supplyReceipts.json');
    if (!data || !Array.isArray(data.supplyReceipts)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    const newReceipt = {
      id: generateId('SR'),
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
      createdAt: new Date().toISOString(),
    };
    data.supplyReceipts.push(newReceipt);
    writeJSON('supplyReceipts.json', data);
    return NextResponse.json(newReceipt, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supply receipt' }, { status: 500 });
  }
}
