# Contractor & Supplier History Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a slide-out history panel to the Contractors and Suppliers pages, showing a combined timeline of record lifecycle events (create/edit/delete) and transactions (stock issues / supply receipts).

**Architecture:** A shared `HistoryPanel` component fetches from a dedicated per-entity history endpoint that merges AuditLog entries with transaction records server-side. CRUD routes for contractors and suppliers are updated to write AuditLog entries on every mutation. A shared `lib/auditLog.ts` utility keeps the INSERT logic DRY.

**Tech Stack:** Next.js (App Router), TypeScript, Cloudflare D1 (via `d1Query`/`d1Run` from `@/lib/d1`), React hooks, `react-icons/fi`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/auditLog.ts` | `writeAuditLog()` + `diffFields()` helpers |
| Create | `app/api/contractors/[id]/history/route.ts` | Contractor history endpoint |
| Create | `app/api/suppliers/[id]/history/route.ts` | Supplier history endpoint |
| Create | `components/HistoryPanel.tsx` | Slide-out panel component |
| Modify | `app/api/contractors/route.ts` | Write CREATE audit log in POST |
| Modify | `app/api/contractors/[id]/route.ts` | Write UPDATE/DELETE audit logs in PUT/DELETE |
| Modify | `app/api/suppliers/route.ts` | Write CREATE audit log in POST |
| Modify | `app/api/suppliers/[id]/route.ts` | Write UPDATE/DELETE audit logs in PUT/DELETE |
| Modify | `app/contractors/page.tsx` | Clock icon + HistoryPanel integration |
| Modify | `app/suppliers/page.tsx` | Clock icon + HistoryPanel integration |

---

## Task 1: Shared audit log helpers

**Files:**
- Create: `lib/auditLog.ts`

- [ ] **Step 1: Create `lib/auditLog.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "e:/Demo Website/Stock Inventory Management/stock-inventory-erp"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `lib/auditLog.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/auditLog.ts
git commit -m "feat: add writeAuditLog and diffFields helpers"
```

---

## Task 2: Contractor history API endpoint

**Files:**
- Create: `app/api/contractors/[id]/history/route.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p "app/api/contractors/[id]/history"
```

- [ ] **Step 2: Write `app/api/contractors/[id]/history/route.ts`**

```typescript
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
        changes: row.changes ? JSON.parse(row.changes) : null,
        by: row.userName || null,
        timestamp: row.timestamp,
      })
    }

    if (!hasCreateLog) {
      events.push({
        type: 'CREATED',
        label: 'Record created',
        by: 'Unknown',
        timestamp: contractor.createdAt,
      })
    }

    for (const row of issueRows) {
      events.push({
        type: 'STOCK_ISSUED',
        label: `${row.productName} · ${row.quantity} ${row.unit}${row.purpose ? ' → ' + row.purpose : ''}`,
        detail: `Issue #${row.id}`,
        by: row.issuedBy || null,
        timestamp: row.createdAt,
      })
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Manual verification — start dev server and test**

```bash
npm run dev
```

In a new terminal or browser DevTools:
```
GET http://localhost:3000/api/contractors/<any-real-contractor-id>/history
```

Expected: JSON array with at least one entry (the synthesized CREATED event with `type: "CREATED"` and `by: "Unknown"`). If the contractor has stock issues, those also appear as `type: "STOCK_ISSUED"` entries.

If contractor ID is unknown, first call `GET /api/contractors` to find a real ID.

- [ ] **Step 4: Commit**

```bash
git add "app/api/contractors/[id]/history/route.ts"
git commit -m "feat: add contractor history API endpoint"
```

---

## Task 3: Supplier history API endpoint

**Files:**
- Create: `app/api/suppliers/[id]/history/route.ts`

- [ ] **Step 1: Write `app/api/suppliers/[id]/history/route.ts`**

```typescript
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
        changes: row.changes ? JSON.parse(row.changes) : null,
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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Manual verification**

```
GET http://localhost:3000/api/suppliers/<any-real-supplier-id>/history
```

Expected: JSON array with at least one `CREATED` entry. Suppliers with supply receipts should also show `SUPPLY_RECEIVED` entries sorted newest-first.

- [ ] **Step 3: Commit**

```bash
git add "app/api/suppliers/[id]/history/route.ts"
git commit -m "feat: add supplier history API endpoint"
```

---

## Task 4: HistoryPanel component

**Files:**
- Create: `components/HistoryPanel.tsx`

- [ ] **Step 1: Write `components/HistoryPanel.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors for `components/HistoryPanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/HistoryPanel.tsx
git commit -m "feat: add HistoryPanel slide-out component"
```

---

## Task 5: Wire audit logging into contractor CRUD

**Files:**
- Modify: `app/api/contractors/route.ts` (POST handler)
- Modify: `app/api/contractors/[id]/route.ts` (PUT and DELETE handlers)

- [ ] **Step 1: Update `app/api/contractors/route.ts` — add audit log to POST**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog } from '@/lib/auditLog';

export async function GET() {
  try {
    const contractors = await d1Query('SELECT * FROM contractors ORDER BY createdAt DESC');
    return NextResponse.json(contractors);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    await d1Run(
      `INSERT INTO contractors (id, name, phone, role, company, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.phone ?? null,
        body.role ?? null,
        body.company ?? '',
        now,
        now,
      ]
    );

    await writeAuditLog({ action: 'CREATE', entityType: 'contractor', entityId: id, details: body.name });

    const [newContractor] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    return NextResponse.json(newContractor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update `app/api/contractors/[id]/route.ts` — add audit logs to PUT and DELETE**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog, diffFields } from '@/lib/auditLog';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [contractor] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }
    return NextResponse.json(contractor);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const [existing] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    await d1Run(
      `UPDATE contractors SET name = ?, phone = ?, role = ?, company = ?, updatedAt = ? WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.phone ?? existing.phone,
        body.role ?? existing.role,
        body.company ?? existing.company,
        new Date().toISOString(),
        id,
      ]
    );

    const changes = diffFields(existing, body, ['name', 'phone', 'role', 'company']);
    if (changes) {
      await writeAuditLog({ action: 'UPDATE', entityType: 'contractor', entityId: id, changes });
    }

    const [updated] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM contractors WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM contractors WHERE id = ?', [id]);
    await writeAuditLog({ action: 'DELETE', entityType: 'contractor', entityId: id, details: existing.name });

    return NextResponse.json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Manual verification**

With the dev server running:
1. Create a new contractor via the UI
2. Call `GET /api/audit-logs?limit=5` in DevTools — expect a row with `action: "CREATE"`, `entityType: "contractor"`
3. Edit that contractor (change the phone number)
4. Call `GET /api/audit-logs?limit=5` — expect a row with `action: "UPDATE"` and `changes` JSON showing the old/new phone
5. Call `GET /api/contractors/<id>/history` — expect both events in the response

- [ ] **Step 4: Commit**

```bash
git add app/api/contractors/route.ts "app/api/contractors/[id]/route.ts"
git commit -m "feat: write audit logs on contractor create/update/delete"
```

---

## Task 6: Wire audit logging into supplier CRUD

**Files:**
- Modify: `app/api/suppliers/route.ts` (POST handler only — PUT in this file is not called by the UI)
- Modify: `app/api/suppliers/[id]/route.ts` (PUT and DELETE handlers)

- [ ] **Step 1: Update `app/api/suppliers/route.ts` — add audit log to POST**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog } from '@/lib/auditLog';

export async function GET() {
  try {
    const suppliers = await d1Query('SELECT * FROM suppliers ORDER BY createdAt DESC');
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();

    await d1Run(
      `INSERT INTO suppliers (id, name, email, phone, address, city, country, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.email ?? null,
        body.phone ?? null,
        body.address ?? null,
        body.city ?? null,
        body.country ?? null,
        body.status ?? 'active',
        createdAt,
      ]
    );

    await writeAuditLog({ action: 'CREATE', entityType: 'supplier', entityId: id, details: body.name });

    const [newSupplier] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    const [existing] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await d1Run(
      `UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, status = ? WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.email ?? existing.email,
        body.phone ?? existing.phone,
        body.address ?? existing.address,
        body.city ?? existing.city,
        body.country ?? existing.country,
        body.status ?? existing.status,
        id,
      ]
    );

    const [updated] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update `app/api/suppliers/[id]/route.ts` — add audit logs to PUT and DELETE**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Run } from '@/lib/d1';
import { writeAuditLog, diffFields } from '@/lib/auditLog';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [supplier] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();

    const [existing] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await d1Run(
      `UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, status = ? WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.email ?? existing.email,
        body.phone ?? existing.phone,
        body.address ?? existing.address,
        body.city ?? existing.city,
        body.country ?? existing.country,
        body.status ?? existing.status,
        id,
      ]
    );

    const changes = diffFields(existing, body, ['name', 'email', 'phone', 'address', 'city', 'country', 'status']);
    if (changes) {
      await writeAuditLog({ action: 'UPDATE', entityType: 'supplier', entityId: id, changes });
    }

    const [updated] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const [existing] = await d1Query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    await d1Run('DELETE FROM suppliers WHERE id = ?', [id]);
    await writeAuditLog({ action: 'DELETE', entityType: 'supplier', entityId: id, details: existing.name });

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Manual verification**

With the dev server running:
1. Create a new supplier via the UI — verify `GET /api/audit-logs?limit=5` shows `entityType: "supplier"`, `action: "CREATE"`
2. Edit that supplier (change city or email)
3. `GET /api/suppliers/<id>/history` — expect CREATED + EDITED events, sorted newest-first
4. Suppliers with existing supply receipts should also show `SUPPLY_RECEIVED` entries

- [ ] **Step 4: Commit**

```bash
git add app/api/suppliers/route.ts "app/api/suppliers/[id]/route.ts"
git commit -m "feat: write audit logs on supplier create/update/delete"
```

---

## Task 7: Add history panel to contractors page

**Files:**
- Modify: `app/contractors/page.tsx`

- [ ] **Step 1: Add imports at the top of `app/contractors/page.tsx`**

Find the existing import line:
```typescript
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiLoader } from 'react-icons/fi';
```

Replace it with:
```typescript
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiLoader, FiClock } from 'react-icons/fi';
import HistoryPanel from '@/components/HistoryPanel';
```

- [ ] **Step 2: Add `historyTarget` state**

Find the existing state declarations block:
```typescript
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { canDo } = useAuth();
```

Replace it with:
```typescript
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
  const { canDo } = useAuth();
```

- [ ] **Step 3: Add history button to each table row's actions cell**

Find the actions cell in the table row (inside the `.map(c => ...)` block):
```tsx
                  <td className="px-6 py-4 text-sm space-x-2">
                    {canDo('contractors', 'edit') && (
                    <button onClick={() => { setEditing(c); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    )}
                    {canDo('contractors', 'delete') && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={!!deletingId}
                      className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                    >
                      {deletingId === c.id
                        ? <FiLoader className="w-4 h-4 animate-spin" />
                        : <FiTrash2 className="w-4 h-4" />}
                    </button>
                    )}
                  </td>
```

Replace it with:
```tsx
                  <td className="px-6 py-4 text-sm space-x-2">
                    {canDo('contractors', 'edit') && (
                    <button onClick={() => { setEditing(c); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    )}
                    {canDo('contractors', 'delete') && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={!!deletingId}
                      className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                    >
                      {deletingId === c.id
                        ? <FiLoader className="w-4 h-4 animate-spin" />
                        : <FiTrash2 className="w-4 h-4" />}
                    </button>
                    )}
                    <button
                      onClick={() => setHistoryTarget({ id: c.id, name: c.name })}
                      className="text-purple-500 hover:text-purple-700 inline-block"
                      title="View History"
                    >
                      <FiClock className="w-4 h-4" />
                    </button>
                  </td>
```

- [ ] **Step 4: Render HistoryPanel when historyTarget is set**

Find the closing block just before the final `</div>` of the return:
```tsx
      {showModal && (
        <ContractorModal
          contractor={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saved => {
            setContractors(prev => {
              const updated = editing
                ? prev.map(c => c.id === saved.id ? saved : c)
                : [...prev, saved];
              writeCache(updated);
              return updated;
            });
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
```

Replace it with:
```tsx
      {showModal && (
        <ContractorModal
          contractor={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saved => {
            setContractors(prev => {
              const updated = editing
                ? prev.map(c => c.id === saved.id ? saved : c)
                : [...prev, saved];
              writeCache(updated);
              return updated;
            });
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}

      {historyTarget && (
        <HistoryPanel
          entityType="contractor"
          entityId={historyTarget.id}
          entityName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
```

- [ ] **Step 5: Manual verification**

Navigate to `http://localhost:3000/contractors` in the browser:
1. A purple clock icon (🕐) appears in the Actions column of each row
2. Clicking the clock for any contractor opens the slide-out panel on the right
3. Panel header shows "HISTORY" label + contractor name
4. Panel lists events with coloured left borders (green for CREATED, purple for stock issues, blue for edits)
5. Clicking the dimmed backdrop closes the panel
6. Clicking ✕ button closes the panel

- [ ] **Step 6: Commit**

```bash
git add app/contractors/page.tsx
git commit -m "feat: add history icon and panel to contractors page"
```

---

## Task 8: Add history panel to suppliers page

**Files:**
- Modify: `app/suppliers/page.tsx`

- [ ] **Step 1: Add imports at the top of `app/suppliers/page.tsx`**

Find the existing import line:
```typescript
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX, FiLoader, FiFileText } from 'react-icons/fi';
```

Replace it with:
```typescript
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX, FiLoader, FiFileText, FiClock } from 'react-icons/fi';
import HistoryPanel from '@/components/HistoryPanel';
```

- [ ] **Step 2: Add `historyTarget` state**

Find the existing state declarations:
```typescript
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { canDo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
```

Replace it with:
```typescript
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { canDo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
```

- [ ] **Step 3: Add history button to each supplier row's actions cell**

Find the actions cell in the suppliers table (inside the `.map((supplier: any) => ...)` block):
```tsx
                  <td className="px-6 py-4 text-sm space-x-3">
                    <button
                      onClick={() => setViewingSupplier(supplier)}
                      className="text-green-600 hover:text-green-800 inline-block"
                      title="View Transactions"
                    >
                      <FiFileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingSupplier(supplier); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 inline-block"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    {canDo('suppliers', 'delete') && (
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        disabled={!!deletingId}
                        className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                      >
                        {deletingId === supplier.id
                          ? <FiLoader className="w-4 h-4 animate-spin" />
                          : <FiTrash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
```

Replace it with:
```tsx
                  <td className="px-6 py-4 text-sm space-x-3">
                    <button
                      onClick={() => setViewingSupplier(supplier)}
                      className="text-green-600 hover:text-green-800 inline-block"
                      title="View Transactions"
                    >
                      <FiFileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingSupplier(supplier); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 inline-block"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    {canDo('suppliers', 'delete') && (
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        disabled={!!deletingId}
                        className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                      >
                        {deletingId === supplier.id
                          ? <FiLoader className="w-4 h-4 animate-spin" />
                          : <FiTrash2 className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => setHistoryTarget({ id: supplier.id, name: supplier.name })}
                      className="text-purple-500 hover:text-purple-700 inline-block"
                      title="View History"
                    >
                      <FiClock className="w-4 h-4" />
                    </button>
                  </td>
```

- [ ] **Step 4: Render HistoryPanel at the bottom of the return block**

Find the closing modals block:
```tsx
      {viewingSupplier && (
        <SupplierTransactionsModal
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
        />
      )}
    </div>
```

Replace it with:
```tsx
      {viewingSupplier && (
        <SupplierTransactionsModal
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
        />
      )}

      {historyTarget && (
        <HistoryPanel
          entityType="supplier"
          entityId={historyTarget.id}
          entityName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
```

- [ ] **Step 5: Manual verification**

Navigate to `http://localhost:3000/suppliers` in the browser:
1. A purple clock icon appears in the Actions column of each row (alongside the existing green document icon, blue edit, and red delete)
2. Clicking the clock opens the slide-out panel showing history for that supplier
3. Suppliers with supply receipts show `SUPPLY_RECEIVED` entries in purple
4. Panel closes on backdrop click or ✕ button

- [ ] **Step 6: Final TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/suppliers/page.tsx
git commit -m "feat: add history icon and panel to suppliers page"
```
