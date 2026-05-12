import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const data = readJSON('auditLogs.json');
    if (!data) {
      return NextResponse.json({ error: 'Failed to read audit logs' }, { status: 500 });
    }

    let logs = data.auditLogs || [];

    if (action) {
      logs = logs.filter((l: any) => l.action === action);
    }

    if (userId) {
      logs = logs.filter((l: any) => l.userId === userId);
    }

    // Sort by timestamp descending and limit results
    logs = logs
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('auditLogs.json');

    if (!data || !Array.isArray(data.auditLogs)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const newLog = {
      id: `LOG${Date.now()}`,
      ...body,
      timestamp: new Date().toISOString(),
    };

    data.auditLogs.push(newLog);
    writeJSON('auditLogs.json', data);

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
