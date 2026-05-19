# Archived Warehouse Inventory Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide inventory items from archived warehouses by default on both the Inventory and Stock Management pages, with a toggle to show them and an ARCHIVED badge when visible.

**Architecture:** Add `warehouseArchived: boolean` to each enriched inventory item by checking `warehouse.status === 'ARCHIVED'` during the existing enrichment step. Add a `showArchivedWh` state variable and a pre-filter to hide archived items when the toggle is off. Add a toggle UI and an ARCHIVED badge in the warehouse column.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `app/inventory/page.tsx` | Interface + enrichment + state + filter + toggle UI + badge + row dimming |
| `app/stock-management/page.tsx` | Interface + enrichment + state + filter + toggle UI + badge + row dimming |

---

## Task 1: Inventory page — archived warehouse visibility

**Files:**
- Modify: `app/inventory/page.tsx`

### Step 1: Add `warehouseArchived` to the `InventoryItem` interface

Find the `InventoryItem` interface (lines 7-20). Add one field:

```typescript
interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  productName: string;
  sku: string;
  category: string;
  warehouseName: string;
  warehouseArchived: boolean;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  minQuantity: number;
  lastUpdated: string;
}
```

### Step 2: Add `warehouseArchived` to the enrichment

Find the enrichment inside `useEffect` (around lines 42-53). The current `return` object has `warehouseName: warehouse.name || 'Unknown Warehouse'`. Add the new field after it:

```typescript
warehouseName: warehouse.name || 'Unknown Warehouse',
warehouseArchived: warehouse.status === 'ARCHIVED',
```

### Step 3: Add `showArchivedWh` state

Find the existing state declarations (lines 23-28). Add after `statusFilter`:

```typescript
const [showArchivedWh, setShowArchivedWh] = useState(false);
```

### Step 4: Update the `filtered` memo to hide archived warehouse items

Find the `filtered` useMemo (around lines 70-82). Add the archived warehouse filter as the **first** filter inside `.filter()`:

```typescript
const filtered = useMemo(() => {
  return inventory.filter(item => {
    if (!showArchivedWh && item.warehouseArchived) return false;
    const matchSearch = !search ||
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchWarehouse = !warehouseFilter || item.warehouseName === warehouseFilter;
    const matchCategory = !categoryFilter || item.category === categoryFilter;
    const status = item.availableQuantity === 0 ? 'out'
      : item.availableQuantity <= item.minQuantity ? 'low' : 'good';
    const matchStatus = !statusFilter || status === statusFilter;
    return matchSearch && matchWarehouse && matchCategory && matchStatus;
  });
}, [inventory, search, warehouseFilter, categoryFilter, statusFilter, showArchivedWh]);
```

### Step 5: Add "Show Archived Warehouses" toggle to the filters section

Find the filters `<div>` (around line 232). It has a `flex flex-col md:flex-row gap-3` inner div. Add the toggle **after the Clear button** (inside the same flex div, at the end):

```tsx
<label
  onClick={() => setShowArchivedWh(v => !v)}
  className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 whitespace-nowrap"
>
  <div className={`relative w-10 h-5 rounded-full transition-colors ${showArchivedWh ? 'bg-blue-600' : 'bg-gray-300'}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showArchivedWh ? 'translate-x-5' : 'translate-x-0'}`} />
  </div>
  Show Archived
</label>
```

### Step 6: Add ARCHIVED badge to the warehouse column and dim archived rows

Find the row render (around line 329):
```tsx
<tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
```

Change to:
```tsx
<tr key={item.id} className={`hover:bg-gray-50 transition-colors duration-150 ${item.warehouseArchived ? 'opacity-60' : ''}`}>
```

Find the warehouse cell (around line 335):
```tsx
<td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{item.warehouseName}</td>
```

Change to:
```tsx
<td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">
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

### Step 7: Verify visually

Start dev server (`npm run dev`). Open `http://localhost:3000/inventory`. Confirm:
- Default state: no items shown from archived warehouses (if any exist)
- Toggle "Show Archived" on: archived warehouse items appear with `opacity-60` and orange ARCHIVED badge next to the warehouse name
- Toggle off: they disappear again

### Step 8: Commit

```bash
git add app/inventory/page.tsx
git commit -m "feat: hide archived warehouse items in inventory with toggle and badge"
```

---

## Task 2: Stock Management page — archived warehouse visibility

**Files:**
- Modify: `app/stock-management/page.tsx`

### Step 1: Add `warehouseArchived` to the `InventoryItem` interface

Find the `InventoryItem` interface (lines 13-28). Add one field after `warehouseName`:

```typescript
interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  productName: string;
  sku: string;
  category: string;
  warehouseName: string;
  warehouseArchived: boolean;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  minQuantity: number;
  attributeQuantityRules: AttributeQuantityRule[];
}
```

### Step 2: Add `warehouseArchived` to the `enrich` function

Find the `enrich` function (lines 38-58). The return object has `warehouseName: warehouse.name || item.warehouseId`. Add after it:

```typescript
warehouseName: warehouse.name || item.warehouseId,
warehouseArchived: warehouse.status === 'ARCHIVED',
```

### Step 3: Add `showArchivedWh` state

Find the state declarations (around line 31-34). Add after the existing states:

```typescript
const [showArchivedWh, setShowArchivedWh] = useState(false);
```

### Step 4: Add filtered inventory derived value

The stock-management page renders `inventory` directly in the table (no separate `filtered` variable). Add a derived `displayInventory` constant after the `outOfStockCount` line (around line 82):

```typescript
const displayInventory = showArchivedWh
  ? inventory
  : inventory.filter(item => !item.warehouseArchived);
```

### Step 5: Replace `inventory` with `displayInventory` in the table

Find the table `tbody` map — it currently iterates over `inventory`. Change:

```tsx
} : inventory.map((item) => {
```

to:

```tsx
} : displayInventory.map((item) => {
```

Also update the empty state check. Find:
```tsx
{inventory.length === 0 ? (
```
Change to:
```tsx
{displayInventory.length === 0 ? (
```

And update the `colSpan` empty state cell text from hardcoded to dynamic if needed — leave it as-is if it says "No inventory records found."

### Step 6: Add "Show Archived Warehouses" toggle to the page header

Find the page header div (around line 93-97):
```tsx
<div>
  <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
  <p className="mt-2 text-gray-600">Manage stock levels...</p>
</div>
```

Wrap the header in a flex row and add the toggle:

```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
    <p className="mt-2 text-gray-600">Manage stock levels and monitor inventory status across warehouses.</p>
  </div>
  <label
    onClick={() => setShowArchivedWh(v => !v)}
    className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 shrink-0"
  >
    <div className={`relative w-10 h-5 rounded-full transition-colors ${showArchivedWh ? 'bg-blue-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showArchivedWh ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
    Show Archived
  </label>
</div>
```

### Step 7: Add ARCHIVED badge to the warehouse column and dim archived rows

Find the table row (around line 142):
```tsx
<tr key={item.id} className="hover:bg-gray-50">
```
Change to:
```tsx
<tr key={item.id} className={`hover:bg-gray-50 ${item.warehouseArchived ? 'opacity-60' : ''}`}>
```

Find the warehouse cell (around line 147):
```tsx
<td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{item.warehouseName}</td>
```
Change to:
```tsx
<td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
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

### Step 8: Verify TypeScript compiles

```bash
cd "e:/Demo Website/Stock Inventory Management/stock-inventory-erp"
npx tsc --noEmit
```

Expected: no output (no errors).

### Step 9: Commit

```bash
git add app/stock-management/page.tsx
git commit -m "feat: hide archived warehouse items in stock management with toggle and badge"
```

---

## Self-Review Checklist

- [x] `warehouseArchived` added to `InventoryItem` interface in both files ✓
- [x] `warehouseArchived: warehouse.status === 'ARCHIVED'` in enrichment of both files ✓
- [x] `showArchivedWh` state defaulting to `false` in both files ✓
- [x] Filter hides archived items when `showArchivedWh` is false in both files ✓
- [x] Toggle UI added in both pages ✓
- [x] ARCHIVED badge in warehouse column when archived ✓
- [x] `opacity-60` on archived rows ✓
- [x] `showArchivedWh` added to `filtered` memo dependency array (Task 1) ✓
- [x] `displayInventory` replaces `inventory` in table map (Task 2) ✓
