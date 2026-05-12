import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const data = readJSON('stockMovements.json');
    if (!data) {
      return NextResponse.json({ error: 'Failed to read stock movements' }, { status: 500 });
    }

    let movements = data.stockMovements || [];

    if (type) {
      movements = movements.filter((m: any) => m.type === type);
    }

    if (productId) {
      movements = movements.filter((m: any) => m.productId === productId);
    }

    // Sort by timestamp descending and limit results
    movements = movements
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json(movements);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('stockMovements.json');

    if (!data || !Array.isArray(data.stockMovements)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const newMovement = {
      id: `SM${Date.now()}`,
      ...body,
      timestamp: new Date().toISOString(),
    };

    data.stockMovements.push(newMovement);
    writeJSON('stockMovements.json', data);

    return NextResponse.json(newMovement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 });
  }
}
