# Responsive Layout Design

**Date:** 2026-05-19  
**Status:** Approved

## Problem

The app has a working mobile sidebar drawer but page content is not fully responsive:
- Page header buttons get clipped behind the fixed mobile top bar
- Tables overflow horizontally with no scroll on many pages
- Modals overflow the viewport on short screens
- Dashboard stat grid is not responsive

## Approach

Tailwind utility-first — add responsive prefixes (`hidden md:table-cell`, `sm:grid-cols-2`, `max-h-[90vh]`) directly in existing components. No new components or abstractions.

## Breakpoints (Tailwind defaults)

| Prefix | Min-width | Target |
|--------|-----------|--------|
| (none) | 0px | Mobile (< 640px) |
| `sm:` | 640px | Large mobile / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |

---

## Section 1: Shell & Layout

**File:** `components/AppShell.tsx`

- Main content: change `pt-20` to `pt-16 lg:pt-8` — tighter on mobile, less wasted space
- Outer wrapper: add `overflow-x-hidden` to prevent horizontal bleed from table overflow
- No sidebar changes — drawer already works correctly

---

## Section 2: Tables — Hybrid Column Hiding

Every table page gets an `overflow-x-auto` wrapper on the table container. Secondary columns use `hidden sm:table-cell` or `hidden md:table-cell` on both `<th>` and `<td>` to hide on small screens.

### Column visibility per page

**Products** (`/products`)
- Always: Name, Actions
- `sm:table-cell`: Category, SKU
- `md:table-cell`: Price, Min Qty

**Inventory** (`/inventory`)
- Always: Product, Available Qty, Actions
- `sm:table-cell`: Warehouse
- `md:table-cell`: Reserved, Total Qty

**Stock Management** (`/stock-management`)
- Always: Product, Total Qty, Status, Actions
- `sm:table-cell`: Warehouse
- `md:table-cell`: Last Updated

**Stock Transfers** (`/stock-transfers`)
- Always: Product, Status, Actions
- `sm:table-cell`: From Warehouse, To Warehouse
- `md:table-cell`: Date, Qty

**Low Stock Alerts** (`/alerts`)
- Always: Product, Stock Qty, Actions
- `sm:table-cell`: Warehouse
- `md:table-cell`: Min Qty, Category

**Suppliers** (`/suppliers`)
- Always: Name, Actions
- `sm:table-cell`: Email
- `md:table-cell`: Phone, Address

**Supply Receipts** (`/supply-receipts`)
- Always: Supplier, Actions
- `sm:table-cell`: Warehouse, Date
- `md:table-cell`: Amount, Gate Pass

**Stock Issues** (`/stock-issues`)
- Always: Product, Qty, Actions
- `sm:table-cell`: Contractor, Status
- `md:table-cell`: Date, Unit

**Contractors** (`/contractors`)
- Always: Name, Actions
- `sm:table-cell`: Role
- `md:table-cell`: Phone, Email

**Warehouses** (`/warehouses`)
- Always: Name, Status, Actions
- `sm:table-cell`: Location
- `md:table-cell`: Manager, Capacity, Usage

**Users** (`/users`)
- Always: Name, Role, Actions
- `sm:table-cell`: Email
- `md:table-cell`: Status

**Audit Logs** (`/audit-logs`)
- Always: Action, Date
- `sm:table-cell`: User
- `md:table-cell`: Details/IP

---

## Section 3: Modals & Forms

**All modals** (every `WarehouseModal`, `ProductModal`, `SupplierModal`, etc.):
- Modal container: add `max-h-[90vh] overflow-y-auto` so content scrolls inside modal on short screens
- Inner padding: `p-4 sm:p-6 sm:p-8` — reduce on mobile

**Form grids** inside modals:
- Change `grid-cols-2` → `grid-cols-1 md:grid-cols-2`
- Applies to: Product, Warehouse, Supplier, Contractor, User, Stock Transfer, Stock Issue modals

**Dashboard stat cards** (`/` dashboard):
- Change stat cards grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Chart section: `grid-cols-1 lg:grid-cols-2`

---

## Files Changed

| File | Change |
|------|--------|
| `components/AppShell.tsx` | pt padding, overflow-x-hidden |
| `app/page.tsx` (dashboard) | responsive grid |
| `app/products/page.tsx` | table column hiding, modal form grid |
| `app/inventory/page.tsx` | table column hiding |
| `app/stock-management/page.tsx` | table column hiding |
| `app/stock-transfers/page.tsx` | table column hiding, modal form grid |
| `app/alerts/page.tsx` | table column hiding |
| `app/suppliers/page.tsx` | table column hiding, modal form grid |
| `app/supply-receipts/page.tsx` | table column hiding, modal form grid |
| `app/stock-issues/page.tsx` | table column hiding, modal form grid |
| `app/contractors/page.tsx` | table column hiding, modal form grid |
| `app/warehouses/page.tsx` | table column hiding, modal form grid |
| `app/users/page.tsx` | table column hiding, modal form grid |
| `app/audit-logs/page.tsx` | table column hiding |

---

## Out of Scope

- Bottom navigation bar on mobile (current sidebar drawer is sufficient)
- Tablet-specific layouts beyond the `md:` breakpoint adjustments above
- Dashboard chart responsiveness (charts are already SVG-based and scale)
- Login page (already responsive)
