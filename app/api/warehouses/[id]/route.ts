import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const rows = await d1Query<any>('SELECT * FROM warehouses WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const existing = await d1Query<any>('SELECT * FROM warehouses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const current = existing[0];

    const name         = body.name         ?? current.name;
    const location     = body.location     ?? current.location;
    const address      = body.address      ?? current.address;
    const manager      = body.manager      ?? current.manager;
    const capacity     = body.capacity     ?? current.capacity;
    const currentUsage = body.currentUsage ?? current.currentUsage;
    const status       = body.status       ?? current.status;

    // When reactivating a warehouse, clear the archivedAt timestamp
    const archivedAt = body.status === 'ACTIVE' ? null : (body.archivedAt ?? current.archivedAt ?? null);

    await d1Run(
      `UPDATE warehouses
       SET name = ?, location = ?, address = ?, manager = ?, capacity = ?, currentUsage = ?, status = ?, archivedAt = ?, updatedAt = ?
       WHERE id = ?`,
      [name, location, address, manager, capacity, currentUsage, status, archivedAt, now, id]
    );

    const updated = await d1Query<any>('SELECT * FROM warehouses WHERE id = ?', [id]);
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const existing = await d1Query<any>('SELECT * FROM warehouses WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Soft-delete: archive the warehouse rather than hard-deleting it
    await d1Run(
      `UPDATE warehouses SET status = ?, archivedAt = ?, updatedAt = ? WHERE id = ?`,
      ['ARCHIVED', now, now, id]
    );

    const archived = await d1Query<any>('SELECT * FROM warehouses WHERE id = ?', [id]);
    return NextResponse.json(archived[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to archive warehouse' }, { status: 500 });
  }
}
