import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('contractors.json');
    if (!data) return NextResponse.json({ error: 'Failed to read contractors' }, { status: 500 });
    return NextResponse.json(data.contractors || []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('contractors.json');
    if (!data || !Array.isArray(data.contractors)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    const newContractor = {
      id: generateId('CON'),
      name: body.name,
      phone: body.phone,
      role: body.role,
      company: body.company || '',
      createdAt: new Date().toISOString(),
    };
    data.contractors.push(newContractor);
    writeJSON('contractors.json', data);
    return NextResponse.json(newContractor, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
