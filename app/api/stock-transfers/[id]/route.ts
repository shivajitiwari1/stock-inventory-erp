import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [transfer] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }
    return NextResponse.json(transfer);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const [existing] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    await d1Run(
      `UPDATE stock_transfers SET fromWarehouseId = ?, toWarehouseId = ?, productName = ?, quantity = ?, status = ? WHERE id = ?`,
      [
        body.fromWarehouseId ?? existing.fromWarehouseId,
        body.toWarehouseId ?? existing.toWarehouseId,
        body.productName ?? existing.productName,
        body.quantity ?? existing.quantity,
        body.status ?? existing.status,
        id,
      ]
    );

    const [updated] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM stock_transfers WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM stock_transfers WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 });
  }
}
