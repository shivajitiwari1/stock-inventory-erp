import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

// PUT — dismiss a notification (adds userId to dismissedBy)
export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const [existing] = await d1Query('SELECT * FROM notifications WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dismissedBy: string[] = JSON.parse(existing.dismissedBy ?? '[]');
    const userId = body.dismissUserId;
    if (userId && !dismissedBy.includes(userId)) {
      dismissedBy.push(userId);
    }

    await d1Run('UPDATE notifications SET dismissedBy = ? WHERE id = ?', [
      JSON.stringify(dismissedBy),
      id,
    ]);

    const [updated] = await d1Query('SELECT * FROM notifications WHERE id = ?', [id]);
    return NextResponse.json({ ...updated, dismissedBy: JSON.parse(updated.dismissedBy ?? '[]') });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE — admin removes notification entirely
export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM notifications WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM notifications WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
