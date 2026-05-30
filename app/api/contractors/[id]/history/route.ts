import { NextRequest, NextResponse } from 'next/server'
import { d1Query } from '@/lib/d1'

interface HistoryEvent {
  type: 'CREATED' | 'EDITED' | 'DELETED' | 'STOCK_ISSUED'
  label: string
  detail?: string
  changes?: Record<string, { from: string; to: string }> | null
  by?: string | null
  timestamp: string
}

export async function GET(_req: NextRequest, context: any) {
  const { id } = await context.params
  try {
    const [contractor] = await d1Query(
      'SELECT id, name, createdAt FROM contractors WHERE id = ?',
      [id]
    )
    if (!contractor) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const auditRows = await d1Query(
      `SELECT action, userName, changes, timestamp
       FROM audit_logs
       WHERE entityType = 'contractor' AND entityId = ?
       ORDER BY timestamp DESC`,
      [id]
    )

    const issueRows = await d1Query(
      `SELECT id, productName, quantity, unit, purpose, issuedBy, createdAt
       FROM stock_issues
       WHERE contractorId = ?
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
        by: null,
        timestamp: contractor.createdAt,
      })
    }

    for (const row of issueRows) {
      events.push({
        type: 'STOCK_ISSUED',
        label: `${row.productName ?? 'Unknown'} · ${row.quantity ?? 0} ${row.unit ?? ''}${row.purpose ? ' → ' + row.purpose : ''}`.trim(),
        detail: `Issue #${row.id}`,
        by: row.issuedBy || null,
        timestamp: row.createdAt,
      })
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return NextResponse.json(events)
  } catch (err) {
    console.error('[contractor history]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
