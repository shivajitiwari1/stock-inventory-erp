import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('users.json');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('users.json');

    const newUser = {
      id: `U${Date.now()}`,
      name: body.name,
      email: body.email,
      password: body.password, // In a real app, this should be hashed
      role: body.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    data.users.push(newUser);
    writeJSON('users.json', data);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}