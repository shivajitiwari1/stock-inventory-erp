import { NextRequest, NextResponse } from 'next/server'
import { d1Query } from '@/lib/d1'

interface HistoryEvent {
  type: 'CREATED' | 'EDITED' | 'DELETED' | 'SUPPLY_RECEIVED'
  label: string
  detail?: string
  changes?: Record<string, { from: string; to: string }> | null
  by?: string | null
  timestamp: string
}

export async function GET(_req: NextRequest, context: any) {
  const { id } = await context.params
  try {
    const [supplier] = await d1Query(
      'SELECT id, name, createdAt FROM suppliers WHERE id = ?',
      [id]
    )
    if (!supplier) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const auditRows = await d1Query(
      `SELECT action, userName, changes, timestamp
       FROM audit_logs
       WHERE entityType = 'supplier' AND entityId = ?
       ORDER BY timestamp DESC`,
      [id]
    )

    const receiptRows = await d1Query(
      `SELECT id, gatePassNumber, totalAmount, verifiedBy, createdAt
       FROM supply_receipts
       WHERE supplierId = ?
       ORDER BY createdAt DESC`,
      [id]
    )

    const events: HistoryEvent[] = []
    let hasCreateLog = false

    for (const row of auditRows) {
      if (row.action === 'CREATE') hasCreateLog = true
      events.push({
        type: row.action === 'CREATE' ? 'CREATED' : row.action === 'UPDATE' ? 'EDITED' : 'DELETED',
        label: row.action === 'CREATE' ? 'Record created' : row.action === 'UPDATE' ? 'Record edited' : 'Record deleted',
        changes: row.changes ? (() => { try { return JSON.parse(row.changes) } catch { return null } })() : null,
        by: row.userName || null,
        timestamp: row.timestamp,
      })
    }

    if (!hasCreateLog) {
      events.push({
        type: 'CREATED',
        label: 'Record created',
        by: 'Unknown',
        timestamp: supplier.createdAt,
      })
    }

    for (const row of receiptRows) {
      events.push({
        type: 'SUPPLY_RECEIVED',
        label: `Supply Receipt${row.gatePassNumber ? ' #' + row.gatePassNumber : ''}${row.totalAmount ? ' · ₹' + row.totalAmount : ''}`,
        detail: `Receipt #${row.id}`,
        by: row.verifiedBy || null,
        timestamp: row.createdAt,
      })
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return NextResponse.json(events)
  } catch (err) {
    console.error('[supplier history]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
