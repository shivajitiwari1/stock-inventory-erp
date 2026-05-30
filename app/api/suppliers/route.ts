import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog, getAuditUser, getClientIp } from '@/lib/auditLog';

export async function GET() {
  try {
    const suppliers = await d1Query('SELECT * FROM suppliers ORDER BY createdAt DESC');
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();

    await d1Run(
      `INSERT INTO suppliers (id, name, email, phone, address, city, country, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.email ?? null,
        body.phone ?? null,
        body.address ?? null,
        body.city ?? null,
        body.country ?? null,
        body.status ?? 'active',
        createdAt,
      ]
    );

    const [newSupplier] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    const { userId, userName } = await getAuditUser(request);
    const ipAddress = getClientIp(request);
    await writeAuditLog({ action: 'CREATE', entityType: 'supplier', entityId: id, details: body.name, userId, userName, ipAddress });
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

