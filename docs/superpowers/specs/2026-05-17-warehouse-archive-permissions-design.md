# Warehouse Archive Permission Control Design

**Date:** 2026-05-17  
**Status:** Approved

## Problem

The archive and restore buttons on the Warehouses page are visible and usable by all authenticated users. There is no permission check controlling who can archive or restore a warehouse. This should be role-controlled (configurable per role) with optional per-user overrides.

## Solution

Add a new `archive` action to the permission system. Gate both the archive and restore buttons with `canDo('warehouses', 'archive')`. Default to `false` for non-admin roles. Per-user overrides work automatically via the existing `user.permissions` structure.

---

## Data Model

### `components/AuthContext.tsx`

Extend `UserAction` type to include `'archive'`:

```typescript
export type UserAction = 'add' | 'edit' | 'delete' | 'archive';
```

No other changes to `AuthContext.tsx`. The existing `canDo()` function already handles any action string via `user.permissions?.[page]?.[action]`.

### `data/roles.json`

Add `"archive": false` to the `warehouses` permission block for `INVENTORY_MANAGER`:

```json
"warehouses": { "view": true, "add": true, "edit": true, "delete": false, "archive": false }
```

`STAFF` has no warehouse permissions at all — no change needed.  
`ADMIN` has full access via the `user.role === 'ADMIN'` shortcut in `canDo()` — no change needed.

### Per-user override (no code change required)

Users in `data/users.json` can already carry a `permissions` field that overrides role defaults. To grant a specific user archive access regardless of their role:

```json
{
  "permissions": {
    "warehouses": { "archive": true }
  }
}
```

`canDo('warehouses', 'archive')` already reads `user.permissions?.warehouses?.archive` — this works with zero additional code.

---

## UI Changes

### `app/warehouses/page.tsx`

Both the archive trigger and the restore button are gated with `canDo('warehouses', 'archive')`:

**Archive button** (trash icon on active/inactive rows):
```tsx
{canDo('warehouses', 'archive') && (
  <button onClick={() => setArchiveTarget(warehouse.id)} ...>
    <FiTrash2 className="w-4 h-4" />
  </button>
)}
```

**Restore button** (refresh icon on archived rows):
```tsx
{canDo('warehouses', 'archive') && (
  <button onClick={() => handleRestore(warehouse.id)} ...>
    <FiRefreshCw className="w-4 h-4" />
  </button>
)}
```

Users without the `archive` permission:
- Can still view the Warehouses page (controlled by `warehouses.view`)
- Can still see archived rows when "Show Archived" is on
- See no action buttons on archived rows (no restore available)
- See only the edit button on active/inactive rows (no archive available)

---

## Behaviour Summary

| Role | Default `warehouses.archive` | Can archive/restore? |
|------|------------------------------|----------------------|
| ADMIN | full access | Yes |
| INVENTORY_MANAGER | `false` | No (unless overridden per-user) |
| STAFF | no warehouse access | No |
| Custom roles | configurable in roles.json | Depends on config |

---

## Out of Scope

- Changing who can view archived warehouses (controlled by existing `warehouses.view`)
- API-level permission enforcement (this app uses client-side permission gating; the API has no auth middleware)
- Audit logging of archive/restore actions
