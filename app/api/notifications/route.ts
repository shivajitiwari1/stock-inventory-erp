import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('notifications.json');
    if (!data) return NextResponse.json({ error: 'Failed to read notifications' }, { status: 500 });
    return NextResponse.json(data.notifications || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('notifications.json');
    if (!data || !Array.isArray(data.notifications)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    const notification = {
      id: generateId('NOT'),
      title: body.title,
      message: body.message,
      type: body.type || 'info',
      targetUserId: body.targetUserId,
      targetUserName: body.targetUserName,
      createdBy: body.createdBy,
      createdByName: body.createdByName,
      createdAt: new Date().toISOString(),
      dismissedBy: [],
    };
    data.notifications.push(notification);
    writeJSON('notifications.json', data);
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
