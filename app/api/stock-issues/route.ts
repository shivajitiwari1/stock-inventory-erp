import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('stockIssues.json');
    if (!data) return NextResponse.json({ error: 'Failed to read stock issues' }, { status: 500 });
    return NextResponse.json(data.stockIssues || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('stockIssues.json');
    if (!data || !Array.isArray(data.stockIssues)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    const newIssue = {
      id: generateId('SI'),
      productId: body.productId,
      productName: body.productName,
      quantity: Number(body.quantity),
      unit: body.unit || '',
      contractorId: body.contractorId,
      contractorName: body.contractorName,
      issueDate: body.issueDate,
      status: body.status || 'Issued',
      createdAt: new Date().toISOString(),
    };
    data.stockIssues.push(newIssue);
    writeJSON('stockIssues.json', data);
    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stock issue' }, { status: 500 });
  }
}
