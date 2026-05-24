import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(_request: NextRequest) {
  try {
    const warehouses = await d1Query<any>('SELECT * FROM warehouses ORDER BY createdAt DESC', []);
    return NextResponse.json(warehouses);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    const now = new Date().toISOString();

    const {
      name,
      location,
      address,
      manager,
      capacity,
      currentUsage,
      status,
    } = body;

    await d1Run(
      `INSERT INTO warehouses (id, name, location, address, manager, capacity, currentUsage, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, location ?? null, address ?? null, manager ?? null, capacity ?? null, currentUsage ?? 0, status ?? 'ACTIVE', now, now]
    );

    const rows = await d1Query<any>('SELECT * FROM warehouses WHERE id = ?', [id]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Warehouse id is required' }, { status: 400 });
    }

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

    await d1Run(
      `UPDATE warehouses
       SET name = ?, location = ?, address = ?, manager = ?, capacity = ?, currentUsage = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [name, location, address, manager, capacity, currentUsage, status, now, id]
    );

    const updated = await d1Query<any>('SELECT * FROM warehouses WHERE id = ?', [id]);
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}
