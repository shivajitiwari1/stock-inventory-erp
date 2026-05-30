'use client'

import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'

interface HistoryEvent {
  type: 'CREATED' | 'EDITED' | 'DELETED' | 'STOCK_ISSUED' | 'SUPPLY_RECEIVED'
  label: string
  detail?: string
  changes?: Record<string, { from: string; to: string }> | null
  by?: string | null
  timestamp: string
}

interface HistoryPanelProps {
  entityType: 'contractor' | 'supplier'
  entityId: string
  entityName: string
  onClose: () => void
}

const EVENT_META: Record<
  HistoryEvent['type'],
  { border: string; bg: string; text: string; label: string }
> = {
  STOCK_ISSUED:    { border: '#6366f1', bg: 'rgba(99,102,241,0.13)', text: '#a78bfa', label: 'STOCK ISSUED' },
  SUPPLY_RECEIVED: { border: '#6366f1', bg: 'rgba(99,102,241,0.13)', text: '#a78bfa', label: 'SUPPLY RECEIVED' },
  EDITED:          { border: '#3b82f6', bg: 'rgba(59,130,246,0.13)', text: '#60a5fa', label: 'RECORD EDITED' },
  CREATED:         { border: '#10b981', bg: 'rgba(16,185,129,0.13)', text: '#34d399', label: 'CREATED' },
  DELETED:         { border: '#ef4444', bg: 'rgba(239,68,68,0.13)',  text: '#f87171', label: 'DELETED' },
}

function formatTs(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Today · ${time}`
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return `${date} · ${time}`
}

export default function HistoryPanel({ entityType, entityId, entityName, onClose }: HistoryPanelProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setEvents([])
    fetch(`/api/${entityType}s/${entityId}/history`)
      .then(r => r.json())
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [entityType, entityId])

  return (
    <>
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{ width: 340, background: '#111c2d', borderLeft: '1px solid #1e3050', boxShadow: '-4px 0 24px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e3050', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#a78bfa', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 3 }}>HISTORY</div>
            <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}>{entityName}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, marginTop: -2 }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Event list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && (
            <>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: 64, background: '#162032', borderRadius: 6, opacity: 0.5 }} />
              ))}
            </>
          )}

          {!loading && events.length === 0 && (
            <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', paddingTop: 32 }}>
              No history found.
            </div>
          )}

          {!loading && events.map((ev, i) => {
            const meta = EVENT_META[ev.type]
            return (
              <div
                key={i}
                style={{
                  background: '#162032',
                  borderRadius: 6,
                  padding: '10px 12px',
                  borderLeft: `3px solid ${meta.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ background: meta.bg, color: meta.text, padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                    {meta.label}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: 9 }}>{formatTs(ev.timestamp)}</span>
                </div>

                <div style={{ color: '#e5e7eb', fontSize: 11, marginBottom: 3 }}>{ev.label}</div>

                {ev.changes && Object.entries(ev.changes).map(([field, { from, to }]) => (
                  <div key={field} style={{ fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: '#9ca3af' }}>{field}: </span>
                    <span style={{ color: '#ef4444', textDecoration: 'line-through', marginRight: 4 }}>{from}</span>
                    <span style={{ color: '#34d399' }}>{to}</span>
                  </div>
                ))}

                {(ev.detail || ev.by) && (
                  <div style={{ color: '#6b7280', fontSize: 9, marginTop: 2 }}>
                    {[ev.detail, ev.by ? `by ${ev.by}` : null].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {!loading && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #1e3050', color: '#6b7280', fontSize: 10, textAlign: 'center' }}>
            {events.length} event{events.length !== 1 ? 's' : ''} · newest first
          </div>
        )}
      </div>
    </>
  )
}
