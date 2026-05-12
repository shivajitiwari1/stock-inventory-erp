import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('stockTransfers.json');
    const index = data.transfers.findIndex((t: any) => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    data.transfers[index] = { ...data.transfers[index], ...body };
    writeJSON('stockTransfers.json', data);
    return NextResponse.json(data.transfers[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('stockTransfers.json');
    const index = data.transfers.findIndex((t: any) => t.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    data.transfers.splice(index, 1);
    writeJSON('stockTransfers.json', data);
    return NextResponse.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 });
  }
}
