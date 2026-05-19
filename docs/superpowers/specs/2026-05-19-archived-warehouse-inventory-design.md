# Archived Warehouse Inventory Visibility Design

**Date:** 2026-05-19  
**Status:** Approved

## Problem

When a warehouse is archived, its inventory records remain in `inventory.json` with the `warehouseId` still pointing to the now-archived warehouse. Both the Inventory page and Stock Management page continue to show these items with no indication that they belong to a decommissioned location. Users cannot tell which stock is in an archived warehouse.

## Solution

Enrich inventory items with a `warehouseArchived` boolean. Add a "Show Archived Warehouses" toggle (off by default) to hide items from archived warehouses. When the toggle is on, show an orange ARCHIVED badge next to the warehouse name and dim the row.

Apply to both pages that show per-warehouse inventory:
- `app/inventory/page.tsx`
- `app/stock-management/page.tsx`

No API changes required — both pages already fetch warehouses in parallel.

---

## Data Enrichment

**Both pages** — during the enrichment step where inventory items are joined with warehouse data, add one field:

```typescript
warehouseArchived: (warehouse.status === 'ARCHIVED'),
```

Add `warehouseArchived: boolean` to the `InventoryItem` interface on each page.

---

## Filtering

Both pages get a new state variable:

```typescript
const [showArchivedWh, setShowArchivedWh] = useState(false);
```

The existing filtered memo gains one extra filter **before** all other filters:

```typescript
.filter(item => showArchivedWh ? true : !item.warehouseArchived)
```

Default `false` — items from archived warehouses are hidden by default.

---

## "Show Archived Warehouses" Toggle

**Placement:** In the page header area, near the existing search/filter controls. Same visual pattern as the Warehouses page toggle:

```tsx
<label
  onClick={() => setShowArchivedWh(v => !v)}
  className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600"
>
  <div className={`relative w-10 h-5 rounded-full transition-colors ${showArchivedWh ? 'bg-blue-600' : 'bg-gray-300'}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showArchivedWh ? 'translate-x-5' : 'translate-x-0'}`} />
  </div>
  Show Archived Warehouses
</label>
```

---

## ARCHIVED Badge + Row Dimming

When `showArchivedWh` is true and an item has `warehouseArchived === true`:

**Row:** add `opacity-60` to the `<tr>` className.

**Warehouse column:** render the warehouse name followed by the badge inline:

```tsx
<td className="...">
  <div className="flex items-center gap-2 flex-wrap">
    <span>{item.warehouseName}</span>
    {item.warehouseArchived && (
      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700">
        ARCHIVED
      </span>
    )}
  </div>
</td>
```

---

## Files Changed

| File | Change |
|------|--------|
| `app/inventory/page.tsx` | Add `warehouseArchived` to interface + enrichment, `showArchivedWh` state + filter, toggle UI, badge + row dimming |
| `app/stock-management/page.tsx` | Same changes |

---

## Out of Scope

- Hiding archived warehouse items from the warehouse filter dropdown (the filter already uses `warehouseName` — if the item is hidden by default, the archived warehouse name won't appear in the dropdown when the toggle is off)
- API-level filtering
- Stock Transfers or Supply Receipts history pages (historical records referencing archived warehouses are fine to show as-is)
