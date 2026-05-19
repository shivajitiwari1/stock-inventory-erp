# Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all pages responsive for mobile, tablet, and desktop by hiding secondary table columns on small screens, fixing modal max-height, and ensuring form grids are single-column on mobile.

**Architecture:** Tailwind utility-first — add `hidden sm:table-cell` / `hidden md:table-cell` to secondary `<th>` and `<td>` elements, `max-h-[90vh] overflow-y-auto` to modal inner containers, and `grid-cols-1 md:grid-cols-2` to bare 2-column form grids. No new components. All `overflow-x-auto` wrappers already exist on tables.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `components/AppShell.tsx` | Add `overflow-x-hidden` to outer wrapper |
| `app/products/page.tsx` | Column hiding + modal max-height |
| `app/inventory/page.tsx` | Column hiding |
| `app/stock-management/page.tsx` | Column hiding + fix bare `grid-cols-2` → `grid-cols-1 md:grid-cols-2` + modal max-height |
| `app/stock-transfers/page.tsx` | Column hiding + modal max-height |
| `app/alerts/page.tsx` | Column hiding |
| `app/suppliers/page.tsx` | Column hiding + modal max-height |
| `app/supply-receipts/page.tsx` | Column hiding + fix 3× bare `grid-cols-2` + modal max-height |
| `app/stock-issues/page.tsx` | Column hiding + fix bare `grid-cols-2` + modal max-height |
| `app/contractors/page.tsx` | Column hiding + modal max-height |
| `app/warehouses/page.tsx` | Column hiding + modal max-height |
| `app/users/page.tsx` | Column hiding + modal max-height |
| `app/audit-logs/page.tsx` | Column hiding |

---

## Task 1: AppShell layout fix

**Files:**
- Modify: `components/AppShell.tsx`

- [ ] **Step 1: Add `overflow-x-hidden` to outer wrapper**

Find the outer wrapper div:
```tsx
<div className="min-h-screen flex w-full overflow-x-hidden">
```
It already has `overflow-x-hidden` — verify this is present. If missing, add it.

- [ ] **Step 2: Commit**

```bash
git add components/AppShell.tsx
git commit -m "fix: verify overflow-x-hidden on AppShell outer wrapper"
```

---

## Task 2: Products page — column hiding + modal max-height

**Files:**
- Modify: `app/products/page.tsx`

The products table has columns: Product, SKU, Category, Stock Qty, Total Stock, Price, Min Qty, Actions.

- [ ] **Step 1: Hide secondary columns on mobile**

In the `<thead>` row, add responsive classes to these `<th>` elements:
- SKU: `hidden sm:table-cell`
- Category: `hidden sm:table-cell`
- Stock Qty: `hidden md:table-cell`
- Total Stock: keep visible (always show)
- Price: `hidden md:table-cell`
- Min Qty: `hidden md:table-cell`

Find each `<th>` and add the class. Example for SKU:
```tsx
<th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">SKU</th>
```

Do the same for the matching `<td>` in every row. Example for SKU cell:
```tsx
<td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{product.sku}</td>
```

Apply the same `hidden sm:table-cell` / `hidden md:table-cell` class to every matching `<td>` in the row.

- [ ] **Step 2: Add modal max-height**

Find the `ProductModal` inner container div — it looks like:
```tsx
<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8">
```

Add `max-h-[90vh] overflow-y-auto`:
```tsx
<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
```

- [ ] **Step 3: Verify visually**

Open `http://localhost:3000/products` in browser devtools at 375px width. Confirm only Product name, Total Stock, and Actions columns are visible. At 640px+ SKU and Category appear. At 768px+ Price and Min Qty appear.

- [ ] **Step 4: Commit**

```bash
git add app/products/page.tsx
git commit -m "feat: responsive column hiding and modal max-height on products page"
```

---

## Task 3: Inventory page — column hiding

**Files:**
- Modify: `app/inventory/page.tsx`

The inventory table has columns: Product, SKU, Warehouse, Category, Available, Reserved, Total, Status, Last Updated.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes to add:
- SKU: `hidden sm:table-cell`
- Warehouse: `hidden sm:table-cell`
- Category: `hidden md:table-cell`
- Reserved: `hidden md:table-cell`
- Last Updated: `hidden md:table-cell`

Always visible: Product, Available, Total, Status.

Find each `<th>` in the thead and add the class. Example:
```tsx
<th className="... hidden sm:table-cell">SKU</th>
```
Then find each matching `<td>` in the tbody rows and add the same class.

- [ ] **Step 2: Commit**

```bash
git add app/inventory/page.tsx
git commit -m "feat: responsive column hiding on inventory page"
```

---

## Task 4: Stock Management page — column hiding + form grid fix + modal max-height

**Files:**
- Modify: `app/stock-management/page.tsx`

The stock management table has columns: Product, Warehouse, Category, Total Qty, Available, Reserved, Status, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Warehouse: `hidden sm:table-cell`
- Category: `hidden md:table-cell`
- Reserved: `hidden md:table-cell`

Always visible: Product, Total Qty, Available, Status, Actions.

- [ ] **Step 2: Fix form grid in AdjustStockModal**

Find the form grid inside the modal — it currently reads:
```tsx
<div className="grid grid-cols-2 gap-4">
```

Change to:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

- [ ] **Step 3: Add modal max-height**

Find the modal inner container:
```tsx
<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
```
Add `max-h-[90vh] overflow-y-auto`:
```tsx
<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
```

- [ ] **Step 4: Commit**

```bash
git add app/stock-management/page.tsx
git commit -m "feat: responsive column hiding, form grid, and modal max-height on stock management"
```

---

## Task 5: Stock Transfers page — column hiding + modal max-height

**Files:**
- Modify: `app/stock-transfers/page.tsx`

The stock transfers table has columns: Transfer ID, Product, From Warehouse, To Warehouse, Qty, Status, Date, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Transfer ID: `hidden sm:table-cell`
- From Warehouse: `hidden sm:table-cell`
- To Warehouse: `hidden sm:table-cell`
- Date: `hidden md:table-cell`
- Qty: keep visible

Always visible: Product, Qty, Status, Actions.

- [ ] **Step 2: Add modal max-height**

Find `TransferModal` inner container and add `max-h-[90vh] overflow-y-auto`.

- [ ] **Step 3: Commit**

```bash
git add app/stock-transfers/page.tsx
git commit -m "feat: responsive column hiding and modal max-height on stock transfers"
```

---

## Task 6: Alerts page — column hiding

**Files:**
- Modify: `app/alerts/page.tsx`

The alerts tables have columns: Product, SKU, Warehouse, Current Stock, Min Qty, Category.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- SKU: `hidden sm:table-cell`
- Warehouse: `hidden sm:table-cell`
- Category: `hidden md:table-cell`

Always visible: Product, Current Stock, Min Qty.

Apply to both the Low Stock and Out of Stock tables on this page.

- [ ] **Step 2: Commit**

```bash
git add app/alerts/page.tsx
git commit -m "feat: responsive column hiding on alerts page"
```

---

## Task 7: Suppliers page — column hiding + modal max-height

**Files:**
- Modify: `app/suppliers/page.tsx`

The suppliers table has columns: Supplier, Email, Phone, Location, Status, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Email: `hidden sm:table-cell`
- Phone: `hidden md:table-cell`
- Location: `hidden md:table-cell`

Always visible: Supplier name, Status, Actions.

- [ ] **Step 2: Add modal max-height**

Find `SupplierModal` inner container and add `max-h-[90vh] overflow-y-auto`.

- [ ] **Step 3: Commit**

```bash
git add app/suppliers/page.tsx
git commit -m "feat: responsive column hiding and modal max-height on suppliers page"
```

---

## Task 8: Supply Receipts page — column hiding + form grid fix + modal max-height

**Files:**
- Modify: `app/supply-receipts/page.tsx`

The supply receipts table has columns: Receipt ID, Supplier, Warehouse, Date, Amount, Gate Pass, Receipt, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Receipt ID: `hidden sm:table-cell`
- Warehouse: `hidden sm:table-cell`
- Date: `hidden sm:table-cell`
- Gate Pass: `hidden md:table-cell`
- Amount: `hidden md:table-cell`

Always visible: Supplier, Receipt (file link), Actions.

- [ ] **Step 2: Fix form grids — 3 bare `grid-cols-2` instances**

Find all occurrences of `grid grid-cols-2 gap-3` in the `ReceiptModal` form and change each to:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```
There are 3 such grids in this file (lines ~279, ~296, ~307).

- [ ] **Step 3: Add modal max-height**

Find `ReceiptModal` inner container and add `max-h-[90vh] overflow-y-auto`.

- [ ] **Step 4: Commit**

```bash
git add app/supply-receipts/page.tsx
git commit -m "feat: responsive column hiding, form grids, and modal max-height on supply receipts"
```

---

## Task 9: Stock Issues page — column hiding + form grid fix + modal max-height

**Files:**
- Modify: `app/stock-issues/page.tsx`

The stock issues table has columns: Issue ID, Product, Qty, Unit, Contractor, Issue Date, Status, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Issue ID: `hidden sm:table-cell`
- Unit: `hidden sm:table-cell`
- Contractor: `hidden sm:table-cell`
- Issue Date: `hidden md:table-cell`

Always visible: Product, Qty, Status, Actions.

- [ ] **Step 2: Fix form grid**

Find the bare `grid grid-cols-2 gap-3` in the modal form and change to:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```

- [ ] **Step 3: Add modal max-height**

Find the `StockIssueModal` (or equivalent) inner container and add `max-h-[90vh] overflow-y-auto`.

- [ ] **Step 4: Commit**

```bash
git add app/stock-issues/page.tsx
git commit -m "feat: responsive column hiding, form grid, and modal max-height on stock issues"
```

---

## Task 10: Contractors page — column hiding + modal max-height

**Files:**
- Modify: `app/contractors/page.tsx`

The contractors table has columns: Name, Role, Phone, Email, Address, Status, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Phone: `hidden sm:table-cell`
- Email: `hidden sm:table-cell`
- Address: `hidden md:table-cell`

Always visible: Name, Role, Status, Actions.

- [ ] **Step 2: Add modal max-height**

Find the contractor modal inner container and add `max-h-[90vh] overflow-y-auto`.

- [ ] **Step 3: Commit**

```bash
git add app/contractors/page.tsx
git commit -m "feat: responsive column hiding and modal max-height on contractors page"
```

---

## Task 11: Warehouses page — column hiding + modal max-height

**Files:**
- Modify: `app/warehouses/page.tsx`

The warehouses table has columns: Warehouse, Location, Manager, Capacity, Usage, Status, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Location: `hidden sm:table-cell`
- Manager: `hidden md:table-cell`
- Capacity: `hidden md:table-cell`

Always visible: Warehouse name, Usage (progress bar), Status, Actions.

- [ ] **Step 2: Add modal max-height**

Find `WarehouseModal` inner container:
```tsx
<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8">
```
Add `max-h-[90vh] overflow-y-auto`:
```tsx
<div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
```

- [ ] **Step 3: Commit**

```bash
git add app/warehouses/page.tsx
git commit -m "feat: responsive column hiding and modal max-height on warehouses page"
```

---

## Task 12: Users page — column hiding + modal max-height

**Files:**
- Modify: `app/users/page.tsx`

The users table has columns: User, Email, Role, Status, Actions.

- [ ] **Step 1: Hide secondary columns**

`<th>` and matching `<td>` classes:
- Email: `hidden sm:table-cell`
- Status: `hidden md:table-cell`

Always visible: User name, Role, Actions.

- [ ] **Step 2: Add modal max-height**

Find the `UserModal` / `AddUserModal` inner container and add `max-h-[90vh] overflow-y-auto`. There are two modals on this page (Add User and Edit User) — apply to both.

- [ ] **Step 3: Commit**

```bash
git add app/users/page.tsx
git commit -m "feat: responsive column hiding and modal max-height on users page"
```

---

## Task 13: Audit Logs page — column hiding

**Files:**
- Modify: `app/audit-logs/page.tsx`

The audit logs table has columns: Timestamp, Action, User, Details/Entity, IP (if present).

- [ ] **Step 1: Read the actual column names**

Open `app/audit-logs/page.tsx` and find the `<thead>` row to see the actual column names.

- [ ] **Step 2: Hide secondary columns**

Apply `hidden sm:table-cell` to User column and `hidden md:table-cell` to Details/IP column.

Always visible: Timestamp, Action.

- [ ] **Step 3: Commit**

```bash
git add app/audit-logs/page.tsx
git commit -m "feat: responsive column hiding on audit logs page"
```

---

## Self-Review Checklist

- [x] AppShell `overflow-x-hidden` (Task 1) ✓
- [x] All 11 table pages have column hiding (Tasks 2–13) ✓
- [x] Modal `max-h-[90vh] overflow-y-auto` on all pages with modals (Tasks 2–12) ✓
- [x] Bare `grid-cols-2` fixed in stock-management, supply-receipts, stock-issues (Tasks 4, 8, 9) ✓
- [x] Dashboard already responsive — no change needed ✓
- [x] Suppliers and other modals already have `grid-cols-1 md:grid-cols-2` — no change needed ✓
