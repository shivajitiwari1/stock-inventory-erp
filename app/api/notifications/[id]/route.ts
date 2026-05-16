import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

// PUT — dismiss a notification (adds userId to dismissedBy)
export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('notifications.json');
    const index = data.notifications.findIndex((n: any) => n.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userId = body.dismissUserId;
    if (userId && !data.notifications[index].dismissedBy.includes(userId)) {
      data.notifications[index].dismissedBy.push(userId);
    }
    writeJSON('notifications.json', data);
    return NextResponse.json(data.notifications[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE — admin removes notification entirely
export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('notifications.json');
    const index = data.notifications.findIndex((n: any) => n.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    data.notifications.splice(index, 1);
    writeJSON('notifications.json', data);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
