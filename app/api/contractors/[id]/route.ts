import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog, diffFields } from '@/lib/auditLog';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [contractor] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }
    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const [existing] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    await d1Run(
      `UPDATE contractors SET name = ?, phone = ?, role = ?, company = ?, updatedAt = ? WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.phone ?? existing.phone,
        body.role ?? existing.role,
        body.company ?? existing.company,
        new Date().toISOString(),
        id,
      ]
    );

    const changes = diffFields(existing, body, ['name', 'phone', 'role', 'company']);
    if (changes) {
      await writeAuditLog({ action: 'UPDATE', entityType: 'contractor', entityId: id, changes });
    }

    const [updated] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM contractors WHERE id = ?', [id]);
    await writeAuditLog({ action: 'DELETE', entityType: 'contractor', entityId: id, details: existing.name });

    return NextResponse.json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
