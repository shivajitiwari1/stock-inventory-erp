const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

async function d1Fetch(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;
  if (!data.success) {
    const msg = data.errors?.[0]?.message || 'D1 request failed';
    throw new Error(msg);
  }
  return data;
}

export async function d1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const data = await d1Fetch('/query', { sql, params });
  return (data.result?.[0]?.results || []) as T[];
}

export async function d1Run(sql: string, params: any[] = []): Promise<{ changes: number; last_row_id: number }> {
  const data = await d1Fetch('/query', { sql, params });
  return data.result?.[0]?.meta || { changes: 0, last_row_id: 0 };
}

export async function d1Batch(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
  await d1Fetch('/batch', {
    statements: statements.map((s) => ({ sql: s.sql, params: s.params || [] })),
  });
}
