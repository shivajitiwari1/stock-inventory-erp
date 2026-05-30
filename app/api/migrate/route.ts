import { NextResponse } from 'next/server';
import { d1Run } from '@/lib/d1';

const MIGRATIONS = [
  "ALTER TABLE products ADD COLUMN supplierId TEXT DEFAULT ''",
  "ALTER TABLE products ADD COLUMN supplierName TEXT DEFAULT ''",
  "ALTER TABLE stock_issues ADD COLUMN returnedQty INTEGER DEFAULT 0",
  "ALTER TABLE stock_transfers ADD COLUMN productId TEXT DEFAULT ''",
];

export async function POST() {
  const results: { sql: string; status: string; error?: string }[] = [];
  for (const sql of MIGRATIONS) {
    try {
      await d1Run(sql, []);
      results.push({ sql, status: 'ok' });
    } catch (e: any) {
      results.push({ sql, status: 'skipped', error: e?.message });
    }
  }
  return NextResponse.json({ results });
}
