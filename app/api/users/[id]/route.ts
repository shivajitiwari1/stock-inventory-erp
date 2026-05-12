import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('users.json');
    const user = data.users.find((u: any) => u.id === id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('users.json');
    const index = data.users.findIndex((u: any) => u.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    data.users[index] = {
      ...data.users[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    writeJSON('users.json', data);
    return NextResponse.json(data.users[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('users.json');
    const index = data.users.findIndex((u: any) => u.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    data.users.splice(index, 1);
    writeJSON('users.json', data);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
