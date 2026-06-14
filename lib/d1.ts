import { neon } from '@neondatabase/serverless';

// Convert SQLite-style ? placeholders to PostgreSQL $1, $2, ...
function toPositional(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Quote unquoted camelCase identifiers so PostgreSQL column names like
// createdAt, productId, unitType etc. are preserved correctly.
function quoteCamel(sql: string): string {
  // Matches identifiers starting with lowercase, containing at least one uppercase letter.
  // Negative look-behind/ahead prevents double-quoting already-quoted identifiers.
  return sql.replace(/(?<!")\b([a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*)\b(?!")/g, '"$1"');
}

function prepare(sql: string): string {
  return toPositional(quoteCamel(sql));
}

const NEON_URL =
  process.env.DATABASE_URL ??
  'postgresql://neondb_owner:npg_P60vmzusrwET@ep-muddy-paper-adyflik6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function getDb() {
  return neon(NEON_URL);
}

export async function d1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const rows = await getDb()(prepare(sql), params);
  return rows as unknown as T[];
}

export async function d1Run(sql: string, params: any[] = []): Promise<{ changes: number; last_row_id: number }> {
  await getDb()(prepare(sql), params);
  return { changes: 1, last_row_id: 0 };
}

export async function d1Batch(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
  const db = getDb();
  for (const stmt of statements) {
    await db(prepare(stmt.sql), stmt.params ?? []);
  }
}
