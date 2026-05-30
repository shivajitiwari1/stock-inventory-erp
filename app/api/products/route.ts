import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM products ${where} ORDER BY createdAt DESC`;

    const products = await d1Query<any>(sql, params);

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    const now = new Date().toISOString();

    const {
      name,
      description,
      unitType,
      price,
      image,
      minQuantity,
      warehouseId,
      supplierId,
      supplierName,
    } = body;

    // Auto-generate a unique SKU since we no longer collect it from the user
    const sku = 'SKU-' + id.slice(-8).toUpperCase();

    await d1Run(
      `INSERT INTO products (id, name, sku, category, description, unitType, price, image, minQuantity, supplierId, supplierName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, sku, '', description ?? null, unitType ?? null, price ?? null, image ?? null, minQuantity ?? null, supplierId ?? '', supplierName ?? '', now, now]
    );

    const rows = await d1Query<any>('SELECT * FROM products WHERE id = ?', [id]);
    const newProduct = rows[0];

    // Create inventory records: for selected warehouse only, or all active warehouses
    let warehouseIds: string[];
    if (warehouseId) {
      warehouseIds = [warehouseId];
    } else {
      const whs = await d1Query<any>(`SELECT id FROM warehouses WHERE status = 'ACTIVE'`);
      warehouseIds = whs.map((w: any) => w.id);
    }
    for (const whId of warehouseIds) {
      const invId = Date.now().toString() + Math.random().toString(36).slice(2);
      await d1Run(
        `INSERT OR IGNORE INTO inventory (id, productId, warehouseId, totalQuantity, availableQuantity, reservedQuantity, damagedQuantity, lostQuantity, lastUpdated)
         VALUES (?, ?, ?, 0, 0, 0, 0, 0, ?)`,
        [invId, id, whId, now]
      );
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
