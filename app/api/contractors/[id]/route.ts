import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('contractors.json');
    const index = data.contractors.findIndex((c: any) => c.id === id);
    if (index === -1) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    data.contractors[index] = {
      ...data.contractors[index],
      name: body.name,
      phone: body.phone,
      role: body.role,
      company: body.company || '',
      updatedAt: new Date().toISOString(),
    };
    writeJSON('contractors.json', data);
    return NextResponse.json(data.contractors[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('contractors.json');
    const index = data.contractors.findIndex((c: any) => c.id === id);
    if (index === -1) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    data.contractors.splice(index, 1);
    writeJSON('contractors.json', data);
    return NextResponse.json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
