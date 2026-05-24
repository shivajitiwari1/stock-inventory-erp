import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET() {
  try {
    const rows = await d1Query('SELECT * FROM notifications ORDER BY createdAt DESC');
    const notifications = rows.map((n: any) => ({
      ...n,
      dismissedBy: JSON.parse(n.dismissedBy ?? '[]'),
    }));
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    const dismissedBy = JSON.stringify([]);

    await d1Run(
      `INSERT INTO notifications (id, type, title, message, targetUserId, targetUserName, createdByName, dismissedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.type ?? 'info',
        body.title,
        body.message,
        body.targetUserId ?? null,
        body.targetUserName ?? null,
        body.createdByName ?? null,
        dismissedBy,
        createdAt,
      ]
    );

    const [row] = await d1Query('SELECT * FROM notifications WHERE id = ?', [id]);
    const notification = { ...row, dismissedBy: JSON.parse(row.dismissedBy ?? '[]') };
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
