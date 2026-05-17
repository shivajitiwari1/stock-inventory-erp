# Warehouse Archive (Soft Delete) Design

**Date:** 2026-05-17  
**Status:** Approved

## Problem

Deleting a warehouse currently removes the warehouse record entirely. Inventory records, stock movements, supply receipts, and stock issues all reference `warehouseId` — those records become orphaned and historical data is lost.

## Solution

Replace hard delete with a soft archive. Warehouses are marked `ARCHIVED` instead of removed. All related data is preserved untouched.

---

## Data Model

**File:** `data/warehouses.json`

Extend the `status` field from `"ACTIVE" | "INACTIVE"` to `"ACTIVE" | "INACTIVE" | "ARCHIVED"`.

Add one new optional field:

```json
{
  "id": "WH001",
  "name": "Main Warehouse",
  "status": "ARCHIVED",
  "archivedAt": "2026-05-17T10:00:00Z"
}
```

No changes to `inventory.json`, `stockMovements.json`, `supplyReceipts.json`, `stockIssues.json`, or any other data file.

---

## API Changes

### DELETE `/api/warehouses/[id]`

**Before:** Removes the warehouse record from `warehouses.json`.

**After:** Sets `status: "ARCHIVED"` and stamps `archivedAt` with the current ISO timestamp. Returns the updated warehouse object.

### PUT `/api/warehouses/[id]` — Restore

No new endpoint needed. Sending `{ status: "ACTIVE" }` via the existing PUT clears `archivedAt` and reactivates the warehouse.

---

## UI Changes

### Warehouses Page (`app/warehouses/page.tsx`)

**1. Archive confirmation dialog**

The trash icon button triggers a confirmation:
> "Archive this warehouse? It will be hidden from the active list but all stock data is preserved."

Buttons: **Archive** (confirms) | **Cancel**

**2. Show Archived toggle**

A toggle switch in the page header area (right side, near the Add Warehouse button). Label: "Show Archived". Default: off.

- When **off**: Only `ACTIVE` and `INACTIVE` warehouses are shown.
- When **on**: Archived warehouses appear at the bottom of the list, visually distinct — grayed out row, `ARCHIVED` badge (replacing the status badge), no edit icon, **Restore** button replacing the delete icon.

**3. Restore button**

Visible only on archived warehouse rows when "Show Archived" is on. Clicking calls `PUT /api/warehouses/[id]` with `{ status: "ACTIVE" }`. On success, the warehouse reappears in the active list.

### Blocked actions for archived warehouses

Warehouse picker dropdowns in the following forms exclude warehouses with `status: "ARCHIVED"`:
- Stock Transfer (source and destination)
- Supply Receipts (warehouse field)
- Stock Issues (warehouse field)

---

## Out of Scope

- Inventory reassignment on archive (no stock is moved)
- Permanent delete option (not needed)
- Audit log entry for archive/restore (existing audit system can handle this separately)
