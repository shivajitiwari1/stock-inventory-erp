import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('stockTransfers.json');
    if (!data) {
      return NextResponse.json({ error: 'Failed to read stock transfers' }, { status: 500 });
    }
    return NextResponse.json(data.transfers || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('stockTransfers.json');

    if (!data || !Array.isArray(data.transfers)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const newTransfer = {
      id: `TR${Date.now()}`,
      ...body,
      date: new Date().toISOString(),
    };

    data.transfers.push(newTransfer);
    writeJSON('stockTransfers.json', data);

    return NextResponse.json(newTransfer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
