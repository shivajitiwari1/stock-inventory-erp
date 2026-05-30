import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog, getAuditUser, getClientIp } from '@/lib/auditLog';

export async function GET() {
  try {
    const contractors = await d1Query('SELECT * FROM contractors ORDER BY createdAt DESC');
    return NextResponse.json(contractors);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    await d1Run(
      `INSERT INTO contractors (id, name, phone, role, company, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.phone ?? null,
        body.role ?? null,
        body.company ?? '',
        now,
        now,
      ]
    );

    const { userId, userName } = await getAuditUser(request);
    const ipAddress = getClientIp(request);
    await writeAuditLog({ action: 'CREATE', entityType: 'contractor', entityId: id, details: body.name, userId, userName, ipAddress });

    const [newContractor] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    return NextResponse.json(newContractor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
