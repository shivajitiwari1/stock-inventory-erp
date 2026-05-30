import { d1Run } from '@/lib/d1'

interface AuditEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: string
  entityId: string
  details?: string | null
  changes?: Record<string, { from: string; to: string }> | null
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const id = `${Date.now()}${Math.random().toString(36).slice(2)}`
  await d1Run(
    `INSERT INTO audit_logs (id, action, entityType, entityId, userId, userName, changes, timestamp, ipAddress, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.action,
      entry.entityType,
      entry.entityId,
      null,
      null,
      entry.changes ? JSON.stringify(entry.changes) : null,
      new Date().toISOString(),
      null,
      entry.details ?? null,
    ]
  )
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
