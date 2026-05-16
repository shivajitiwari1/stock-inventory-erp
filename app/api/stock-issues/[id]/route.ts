import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('stockIssues.json');
    const index = data.stockIssues.findIndex((s: any) => s.id === id);
    if (index === -1) return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    data.stockIssues[index] = {
      ...data.stockIssues[index],
      productId: body.productId,
      productName: body.productName,
      quantity: Number(body.quantity),
      unit: body.unit || '',
      contractorId: body.contractorId,
      contractorName: body.contractorName,
      issueDate: body.issueDate,
      status: body.status,
      updatedAt: new Date().toISOString(),
    };
    writeJSON('stockIssues.json', data);
    return NextResponse.json(data.stockIssues[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update stock issue' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('stockIssues.json');
    const index = data.stockIssues.findIndex((s: any) => s.id === id);
    if (index === -1) return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    data.stockIssues.splice(index, 1);
    writeJSON('stockIssues.json', data);
    return NextResponse.json({ message: 'Stock issue deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete stock issue' }, { status: 500 });
  }
}
