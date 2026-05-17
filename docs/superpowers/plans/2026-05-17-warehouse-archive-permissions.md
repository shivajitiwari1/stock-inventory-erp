# Warehouse Archive Permission Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the warehouse archive and restore buttons behind a new `archive` permission so only authorized roles/users can perform those actions.

**Architecture:** Extend the existing `UserAction` type with `'archive'`, add `archive: false` to `INVENTORY_MANAGER`'s warehouse permissions in `roles.json`, then import `useAuth` in `app/warehouses/page.tsx` and wrap the archive/restore buttons with `canDo('warehouses', 'archive')` checks.

**Tech Stack:** Next.js App Router, TypeScript, React Context (`AuthContext`)

---

## File Map

| File | Change |
|------|--------|
| `components/AuthContext.tsx` | Add `'archive'` to `UserAction` type |
| `data/roles.json` | Add `"archive": false` to `INVENTORY_MANAGER` warehouses permissions |
| `app/warehouses/page.tsx` | Import `useAuth`, call `canDo('warehouses', 'archive')`, gate both buttons |

---

## Task 1: Extend `UserAction` type with `'archive'`

**Files:**
- Modify: `components/AuthContext.tsx:6`

- [ ] **Step 1: Update the `UserAction` type**

Open `components/AuthContext.tsx`. Find line 6:

```typescript
export type UserAction = 'add' | 'edit' | 'delete';
```

Replace with:

```typescript
export type UserAction = 'add' | 'edit' | 'delete' | 'archive';
```

- [ ] **Step 2: Verify no TypeScript errors**

Run:
```bash
cd "e:/Demo Website/Stock Inventory Management/stock-inventory-erp"
npx tsc --noEmit
```

Expected: No errors related to `UserAction`. (There may be pre-existing errors in the project — only new errors from this change matter.)

- [ ] **Step 3: Commit**

```bash
git add components/AuthContext.tsx
git commit -m "feat: add archive to UserAction permission type"
```

---

## Task 2: Add `archive` permission to `INVENTORY_MANAGER` role

**Files:**
- Modify: `data/roles.json:31`

- [ ] **Step 1: Update the warehouses permission block for INVENTORY_MANAGER**

Open `data/roles.json`. Find the `INVENTORY_MANAGER` role (id: `ROLE002`). Its `warehouses` entry currently reads:

```json
"warehouses": { "view": true, "add": true, "edit": true, "delete": false }
```

Add `"archive": false`:

```json
"warehouses": { "view": true, "add": true, "edit": true, "delete": false, "archive": false }
```

`STAFF` (ROLE003) has no `warehouses` key at all — leave it unchanged.  
`ADMIN` (ROLE001) uses `{}` permissions and bypasses all checks via `user.role === 'ADMIN'` in `canDo()` — leave it unchanged.

- [ ] **Step 2: Verify JSON is valid**

Run:
```bash
node -e "require('./data/roles.json'); console.log('valid')"
```

Expected output: `valid`

- [ ] **Step 3: Commit**

```bash
git add data/roles.json
git commit -m "feat: add archive permission to INVENTORY_MANAGER warehouse config"
```

---

## Task 3: Gate archive and restore buttons in Warehouses page

**Files:**
- Modify: `app/warehouses/page.tsx`

- [ ] **Step 1: Import `useAuth`**

Open `app/warehouses/page.tsx`. The file currently imports from `react` and `react-icons` but does NOT import `useAuth`. Add the import on line 3 (after the react import):

```typescript
import { useAuth } from '@/components/AuthContext';
```

So the top of the file becomes:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiRefreshCw } from 'react-icons/fi';
```

- [ ] **Step 2: Call `canDo` inside `WarehousesPage`**

Inside the `WarehousesPage` function body, add this line immediately after the existing `useState` declarations (before `useEffect`):

```typescript
const { canDo } = useAuth();
```

- [ ] **Step 3: Gate the archive button**

Find the archive (trash) button in the table row — it currently reads:

```tsx
<button
  onClick={() => setArchiveTarget(warehouse.id)}
  className="text-red-600 hover:text-red-800 inline-block"
  title="Archive warehouse"
>
  <FiTrash2 className="w-4 h-4" />
</button>
```

Wrap it with a permission check:

```tsx
{canDo('warehouses', 'archive') && (
  <button
    onClick={() => setArchiveTarget(warehouse.id)}
    className="text-red-600 hover:text-red-800 inline-block"
    title="Archive warehouse"
  >
    <FiTrash2 className="w-4 h-4" />
  </button>
)}
```

- [ ] **Step 4: Gate the restore button**

Find the restore button — it currently reads:

```tsx
<button
  onClick={() => handleRestore(warehouse.id)}
  title="Restore warehouse"
  className="text-green-600 hover:text-green-800 inline-block"
>
  <FiRefreshCw className="w-4 h-4" />
</button>
```

Wrap it with the same permission check:

```tsx
{canDo('warehouses', 'archive') && (
  <button
    onClick={() => handleRestore(warehouse.id)}
    title="Restore warehouse"
    className="text-green-600 hover:text-green-800 inline-block"
  >
    <FiRefreshCw className="w-4 h-4" />
  </button>
)}
```

- [ ] **Step 5: Verify in browser**

Start the dev server (`npm run dev`). Log in as **John Admin** (ADMIN role) — both the archive icon on active warehouses and the restore icon on archived warehouses should be visible.

Log out. Log in as a non-admin user (INVENTORY_MANAGER role) — neither the archive nor restore buttons should appear. The warehouses page and rows are still visible; only the action buttons are hidden.

To confirm per-user override works: open `data/users.json`, find an INVENTORY_MANAGER user, and temporarily add:
```json
"permissions": { "warehouses": { "archive": true } }
```
Log in as that user — the archive/restore buttons should now appear. Remove the override when done testing.

- [ ] **Step 6: Commit**

```bash
git add app/warehouses/page.tsx
git commit -m "feat: gate warehouse archive/restore buttons behind archive permission"
```

---

## Self-Review Checklist

- [x] `UserAction` extended with `'archive'` (Task 1) ✓
- [x] `INVENTORY_MANAGER` warehouses config has `archive: false` (Task 2) ✓
- [x] `ADMIN` and `STAFF` roles untouched (Task 2) ✓
- [x] `useAuth` imported in warehouses page (Task 3) ✓
- [x] Archive button gated with `canDo('warehouses', 'archive')` (Task 3) ✓
- [x] Restore button gated with `canDo('warehouses', 'archive')` (Task 3) ✓
- [x] Per-user override works via existing `user.permissions` — no extra code (spec requirement) ✓
