import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog, diffFields } from '@/lib/auditLog';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [supplier] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const [existing] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await d1Run(
      `UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, status = ? WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.email ?? existing.email,
        body.phone ?? existing.phone,
        body.address ?? existing.address,
        body.city ?? existing.city,
        body.country ?? existing.country,
        body.status ?? existing.status,
        id,
      ]
    );

    const [updated] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    const changes = diffFields(existing, body, ['name', 'email', 'phone', 'address', 'city', 'country', 'status']);
    if (changes) {
      await writeAuditLog({ action: 'UPDATE', entityType: 'supplier', entityId: id, changes });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM suppliers WHERE id = ?', [id]);
    await writeAuditLog({ action: 'DELETE', entityType: 'supplier', entityId: id, details: existing.name });
    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
