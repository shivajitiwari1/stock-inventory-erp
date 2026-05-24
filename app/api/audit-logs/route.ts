import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

function parseLog(row: any) {
  return {
    ...row,
    changes: row.changes ? JSON.parse(row.changes) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let sql = 'SELECT * FROM audit_logs';
    const params: any[] = [];
    const conditions: string[] = [];

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }

    if (userId) {
      conditions.push('userId = ?');
      params.push(userId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = await d1Query(sql, params);
    return NextResponse.json(rows.map(parseLog));
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
      `INSERT INTO audit_logs
         (id, action, entityType, entityId, userId, userName, changes, timestamp, ipAddress, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.action,
        body.entityType || null,
        body.entityId || null,
        body.userId || null,
        body.userName || null,
        body.changes !== undefined ? JSON.stringify(body.changes) : null,
        body.timestamp || now,
        body.ipAddress || null,
        body.details || null,
      ]
    );

    const [row] = await d1Query('SELECT * FROM audit_logs WHERE id = ?', [id]);
    return NextResponse.json(parseLog(row), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
