'use client'

import { useEffect, useState } from 'react'
import { FiX, FiClock } from 'react-icons/fi'

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
  if (isNaN(d.getTime())) return 'Unknown time'
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
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setEvents([])
    setFetchError(false)
    fetch(`/api/${entityType}s/${entityId}/history`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setFetchError(true); setLoading(false) })
  }, [entityType, entityId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      {/* Popup card */}
      <div
        className="flex flex-col w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#111c2d', border: '1px solid #1e3050', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e3050', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiClock size={16} style={{ color: '#a78bfa' }} />
            <div>
              <div style={{ color: '#a78bfa', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>ACTIVITY HISTORY</div>
              <div style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700 }}>{entityName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history panel"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px', borderRadius: 8, display: 'flex', alignItems: 'center' }}
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Event list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && (
            [0, 1, 2, 3].map(i => (
              <div key={i} style={{ height: 68, background: '#162032', borderRadius: 8, opacity: 0.4 + i * 0.1 }} />
            ))
          )}

          {!loading && fetchError && (
            <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
              Failed to load history.
            </div>
          )}

          {!loading && !fetchError && events.length === 0 && (
            <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
              No history found.
            </div>
          )}

          {!loading && !fetchError && events.map((ev, i) => {
            const meta = EVENT_META[ev.type]
            return (
              <div
                key={`${ev.timestamp}-${ev.type}-${i}`}
                style={{
                  background: '#162032',
                  borderRadius: 8,
                  padding: '12px 14px',
                  borderLeft: `3px solid ${meta.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ background: meta.bg, color: meta.text, padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                    {meta.label}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: 11 }}>{formatTs(ev.timestamp)}</span>
                </div>

                <div style={{ color: '#e5e7eb', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>{ev.label}</div>

                {ev.changes && Object.entries(ev.changes).map(([field, { from, to }]) => (
                  <div key={field} style={{ fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: '#9ca3af', textTransform: 'capitalize' }}>{field}: </span>
                    <span style={{ color: '#ef4444', textDecoration: 'line-through', marginRight: 6 }}>{from}</span>
                    <span style={{ color: '#34d399' }}>{to}</span>
                  </div>
                ))}

                {(ev.detail || ev.by) && (
                  <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
                    {[ev.detail, ev.by ? `by ${ev.by}` : null].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {!loading && !fetchError && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #1e3050', color: '#6b7280', fontSize: 11, textAlign: 'center', flexShrink: 0 }}>
            {events.length} event{events.length !== 1 ? 's' : ''} · newest first
          </div>
        )}
      </div>
    </div>
  )
}
