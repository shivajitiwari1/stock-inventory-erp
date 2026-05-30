# Contractor & Supplier History — Design Spec

**Date:** 2026-05-30
**Status:** Approved

## Overview

Add a combined activity history panel to the Contractors & Workers page and the Suppliers page. Clicking a clock icon on any row slides open a panel showing a unified, newest-first timeline of:

- Record lifecycle events (created, edited with field-level before/after, deleted)
- Transactions linked to that entity (stock issues for contractors, supply receipts for suppliers)

## Decisions Made

| Question | Decision |
|----------|----------|
| History type | Both audit trail AND transactions combined |
| UI placement | Clock icon in actions column → slide-out panel (right side) |
| Detail level | Detailed: issue#/receipt#, site, who acted, before/after for edits |
| Existing records | Synthesize a CREATED entry from `createdAt`; show all past transactions; edits captured going forward |
| Architecture | Dedicated history endpoint per entity type |

## Backend

### New API Routes

#### `GET /api/contractors/[id]/history`

Queries three sources and merges them into a unified response:

1. **AuditLog table** — `WHERE entityType = 'contractor' AND entityId = :id`
   - Returns CREATE, UPDATE, DELETE entries with `changes` JSON
2. **StockIssues table** — `WHERE contractorId = :id`, joined with products for item name
3. **CREATED entry** — if a `CREATE` audit log exists, use it (preserving the real `by` user). If not, synthesize one from the contractor's own `createdAt` field with `by: "Unknown"`

Response shape (array, sorted by timestamp DESC):

```json
[
  {
    "type": "STOCK_ISSUED",
    "label": "Steel Rod · 50 PCS → Site A",
    "detail": "Issue #SI-042",
    "by": "Admin",
    "timestamp": "2026-05-30T10:30:00Z"
  },
  {
    "type": "EDITED",
    "label": "Record edited",
    "changes": { "phone": { "from": "882670099", "to": "8826700991" } },
    "by": "Admin",
    "timestamp": "2026-05-27T11:15:00Z"
  },
  {
    "type": "CREATED",
    "label": "Record created",
    "by": "Admin",
    "timestamp": "2026-05-20T09:00:00Z"
  }
]
```

#### `GET /api/suppliers/[id]/history`

Same pattern, querying:

1. **AuditLog table** — `WHERE entityType = 'supplier' AND entityId = :id`
2. **SupplyReceipts table** — `WHERE supplierId = :id` with receipt number and total amount
3. **CREATED entry** — from CREATE audit log if it exists; otherwise synthesized from supplier's `createdAt` with `by: "Unknown"`

Response shape is identical to the contractor history shape, with `type: "SUPPLY_RECEIVED"` for receipt events.

### Audit Logging — Wired Into Existing CRUD Routes

The following routes are updated to write an `AuditLog` entry after each successful DB operation:

| Route | Event written |
|-------|--------------|
| `POST /api/contractors` | `CREATE` — entityType: `contractor`, entityId: new id, details: contractor name |
| `PUT /api/contractors/[id]` | `UPDATE` — changes: JSON diff of changed fields (old vs new values) |
| `DELETE /api/contractors/[id]` | `DELETE` — details: contractor name snapshot |
| `POST /api/suppliers` | `CREATE` — entityType: `supplier` |
| `PUT /api/suppliers/[id]` | `UPDATE` — changes: JSON diff |
| `DELETE /api/suppliers/[id]` | `DELETE` — details: supplier name snapshot |

The `changes` field for UPDATE entries is a JSON object:

```json
{ "phone": { "from": "old", "to": "new" }, "company": { "from": "old", "to": "new" } }
```

Only fields that actually changed are included.

The `userId` and `userName` are read from the authenticated session using the same auth extraction pattern already used in other API routes in this codebase (e.g. reading from the session cookie or request headers set by the auth middleware).

For `PUT` (UPDATE) routes: the handler must **fetch the current record from D1 first**, then diff it against the incoming request body to produce the `changes` object. Only fields present in both old and new that have different values are included in the diff.

## Frontend

### New Component: `HistoryPanel`

**File:** `app/components/HistoryPanel.tsx`

Props:
```ts
interface HistoryPanelProps {
  entityType: 'contractor' | 'supplier'
  entityId: string
  entityName: string
  onClose: () => void
}
```

Behaviour:
- Fetches `GET /api/{entityType}s/{entityId}/history` on mount
- Shows loading skeleton while fetching
- Renders events as a vertical timeline list, newest first
- Dismissible via ✕ button or clicking the dimmed backdrop
- Fixed to the right side of the viewport, full page height
- The page behind dims to `opacity: 0.45` while panel is open

**Event card colours (left border):**

| Event type | Border colour | Badge colour |
|-----------|--------------|-------------|
| STOCK_ISSUED / SUPPLY_RECEIVED | Purple `#6366f1` | Purple badge |
| EDITED | Blue `#3b82f6` | Blue badge |
| CREATED | Green `#10b981` | Green badge |
| DELETED | Red `#ef4444` | Red badge |

**Edit event rendering:** Shows each changed field as `fieldName: old_value → new_value` with the old value in red strikethrough and new value in green.

**Footer:** Shows total event count, e.g. "5 events · newest first"

### Changes to Existing Pages

#### `app/contractors/page.tsx`

- Add clock icon button (🕐) to the actions column of each row
- Add state: `historyTarget: { id: string, name: string } | null`
- When clock icon clicked: set `historyTarget` to that row's id + name
- Render `<HistoryPanel>` when `historyTarget !== null`, with `onClose` clearing it

#### `app/suppliers/page.tsx`

- Same changes as contractors page
- Clock icon in actions column, `historyTarget` state, `<HistoryPanel>` rendered conditionally

## Data Flow

```
User clicks 🕐 on a row
  → historyTarget state set
  → HistoryPanel mounts
  → GET /api/contractors/{id}/history called
  → API queries AuditLog + StockIssues, synthesizes CREATED if needed
  → Merged array returned sorted by timestamp DESC
  → HistoryPanel renders event cards
  → User clicks ✕ or backdrop
  → historyTarget cleared, panel unmounts
```

## Out of Scope

- Pagination (all history loaded at once; can be added later if lists grow long)
- Filtering by event type within the panel
- History for entities other than contractors and suppliers
- Retroactive edit history (only edits from implementation date onward are captured)
