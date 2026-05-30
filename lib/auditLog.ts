import { NextRequest } from 'next/server'
import { d1Query, d1Run } from '@/lib/d1'

interface AuditEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: string
  entityId: string
  details?: string | null
  changes?: Record<string, { from: string; to: string }> | null
  userId?: string | null
  userName?: string | null
  ipAddress?: string | null
}

export function getClientIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? null
}

export async function getAuditUser(request: NextRequest): Promise<{ userId: string | null; userName: string | null }> {
  const userId = request.headers.get('x-user-id')
  if (!userId) return { userId: null, userName: null }
  try {
    const [user] = await d1Query<{ name: string }>('SELECT name FROM users WHERE id = ?', [userId])
    return { userId, userName: user?.name ?? null }
  } catch {
    return { userId, userName: null }
  }
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const id = `${Date.now()}${Math.random().toString(36).slice(2)}`
  try {
    await d1Run(
      `INSERT INTO audit_logs (id, action, entityType, entityId, userId, userName, changes, timestamp, ipAddress, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.userId ?? null,
        entry.userName ?? null,
        entry.changes ? JSON.stringify(entry.changes) : null,
        new Date().toISOString(),
        entry.ipAddress ?? null,
        entry.details ?? null,
      ]
    )
  } catch (err) {
    console.error('[auditLog] Failed to write audit entry:', err)
  }
}

export function diffFields(
  existing: Record<string, any>,
  body: Record<string, any>,
  fields: string[]
): Record<string, { from: string; to: string }> | null {
  const changes: Record<string, { from: string; to: string }> = {}
  for (const field of fields) {
    const oldVal = String(existing[field] ?? '')
    const newVal = body[field] !== undefined ? String(body[field]) : String(existing[field] ?? '')
    if (oldVal !== newVal) {
      changes[field] = { from: oldVal, to: newVal }
    }
  }
  return Object.keys(changes).length > 0 ? changes : null
}
