# Warehouse Archive (Soft Delete) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hard-delete on warehouses with a soft archive that preserves all related inventory, movement, and receipt data.

**Architecture:** Extend the `status` field on warehouse records to `"ACTIVE" | "INACTIVE" | "ARCHIVED"`. The DELETE API endpoint archives instead of removes. The UI gains a "Show Archived" toggle and a Restore button. Warehouse pickers in stock-transfer and supply-receipt forms filter out archived warehouses.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, JSON file storage via `lib/db`

---

## File Map

| File | Change |
|------|--------|
| `app/api/warehouses/[id]/route.ts` | DELETE → archive; PUT → clear `archivedAt` on restore |
| `app/warehouses/page.tsx` | New `showArchived` toggle, archive/restore handlers, archived row styling, custom confirm dialog |
| `app/stock-transfers/page.tsx` | Filter ARCHIVED warehouses from source/destination dropdowns |
| `app/supply-receipts/page.tsx` | Filter ARCHIVED warehouses from warehouse dropdown |

---

## Task 1: Update DELETE API to archive instead of remove

**Files:**
- Modify: `app/api/warehouses/[id]/route.ts:37-53`

- [ ] **Step 1: Replace the DELETE handler body**

Open `app/api/warehouses/[id]/route.ts` and replace the `DELETE` function with:

```typescript
export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('warehouses.json');
    const index = data.warehouses.findIndex((w: any) => w.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    data.warehouses[index] = {
      ...data.warehouses[index],
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    };
    writeJSON('warehouses.json', data);
    return NextResponse.json(data.warehouses[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to archive warehouse' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update PUT handler to clear `archivedAt` on restore**

In the same file, replace the body of `PUT` (lines 18-35) so that when `status` is being set to `ACTIVE`, `archivedAt` is cleared:

```typescript
export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('warehouses.json');
    const index = data.warehouses.findIndex((w: any) => w.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    const updated: any = { ...data.warehouses[index], ...body, updatedAt: new Date().toISOString() };
    if (body.status === 'ACTIVE') {
      delete updated.archivedAt;
    }
    data.warehouses[index] = updated;
    writeJSON('warehouses.json', data);
    return NextResponse.json(data.warehouses[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify manually**

Start the dev server (`npm run dev`) and open `http://localhost:3000/warehouses`. Click the delete (trash) icon on any warehouse — confirm the browser's native dialog still appears (we replace this in Task 2). After clicking OK, verify the warehouse disappears from the list. Then open `data/warehouses.json` and confirm the warehouse record now has `"status": "ARCHIVED"` and an `archivedAt` timestamp — it must NOT be deleted from the file.

- [ ] **Step 4: Commit**

```bash
git add app/api/warehouses/[id]/route.ts
git commit -m "feat: archive warehouse on delete instead of removing record"
```

---

## Task 2: Rewrite `app/warehouses/page.tsx` with archive UI

**Files:**
- Modify: `app/warehouses/page.tsx`

- [ ] **Step 1: Update the `Warehouse` interface and add new state**

Replace the `Warehouse` interface and the state declarations at the top of `WarehousesPage`:

```typescript
interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  capacity: number;
  currentUsage: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  address?: string;
  phone?: string;
  archivedAt?: string;
}
```

Add `showArchived` and `archiveTarget` state inside `WarehousesPage` (alongside the existing state):

```typescript
const [showArchived, setShowArchived] = useState(false);
const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
```

- [ ] **Step 2: Replace `handleDelete` with `handleArchive` and add `handleRestore`**

Remove the existing `handleDelete` function and replace with:

```typescript
const handleArchive = async (id: string) => {
  try {
    const res = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const updated = await res.json();
      setWarehouses(warehouses.map(w => w.id === id ? updated : w));
    }
  } catch (error) {
    console.error('Failed to archive warehouse:', error);
  } finally {
    setArchiveTarget(null);
  }
};

const handleRestore = async (id: string) => {
  try {
    const res = await fetch(`/api/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setWarehouses(warehouses.map(w => w.id === id ? updated : w));
    }
  } catch (error) {
    console.error('Failed to restore warehouse:', error);
  }
};
```

- [ ] **Step 3: Update `filteredWarehouses` to respect `showArchived`**

Replace the existing `filteredWarehouses` constant:

```typescript
const filteredWarehouses = warehouses
  .filter(w => showArchived ? true : w.status !== 'ARCHIVED')
  .filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.location.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    if (a.status === 'ARCHIVED' && b.status !== 'ARCHIVED') return 1;
    if (a.status !== 'ARCHIVED' && b.status === 'ARCHIVED') return -1;
    return 0;
  });
```

- [ ] **Step 4: Add the "Show Archived" toggle to the page header**

Add the toggle import at the top of the file (react-icons is already imported):

```typescript
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiArchive, FiRefreshCw } from 'react-icons/fi';
```

In the JSX header `<div className="flex flex-col sm:flex-row ...">`, add the toggle next to the Add Warehouse button:

```tsx
<div className="flex items-center gap-3 shrink-0">
  <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
    <div
      onClick={() => setShowArchived(v => !v)}
      className={`relative w-10 h-5 rounded-full transition-colors ${showArchived ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showArchived ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
    Show Archived
  </label>
  <button
    onClick={() => { setEditingWarehouse(null); setShowModal(true); }}
    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
  >
    <FiPlus className="w-4 h-4" />
    <span>Add Warehouse</span>
  </button>
</div>
```

Remove the old standalone `<button>Add Warehouse</button>` that was there before.

- [ ] **Step 5: Update the table rows to handle archived warehouses**

Replace the row rendering inside `filteredWarehouses.map(...)` with:

```tsx
{filteredWarehouses.map((warehouse: any) => {
  const isArchived = warehouse.status === 'ARCHIVED';
  const usagePercent = warehouse.capacity > 0 ? (warehouse.currentUsage / warehouse.capacity) * 100 : 0;
  return (
    <tr key={warehouse.id} className={`hover:bg-gray-50 ${isArchived ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4 text-sm font-medium text-gray-900">{warehouse.name}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{warehouse.location}</td>
      <td className="px-6 py-4 text-sm text-gray-500">{warehouse.manager}</td>
      <td className="px-6 py-4 text-sm text-right text-gray-900">{warehouse.capacity}</td>
      <td className="px-6 py-4 text-sm text-right">
        <div className="flex items-center space-x-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <span className="text-gray-900">{warehouse.currentUsage}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
          warehouse.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          warehouse.status === 'ARCHIVED' ? 'bg-orange-100 text-orange-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {warehouse.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm space-x-2">
        {isArchived ? (
          <button
            onClick={() => handleRestore(warehouse.id)}
            title="Restore warehouse"
            className="text-green-600 hover:text-green-800 inline-block"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={() => { setEditingWarehouse(warehouse); setShowModal(true); }}
              className="text-blue-600 hover:text-blue-800 inline-block"
            >
              <FiEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setArchiveTarget(warehouse.id)}
              className="text-red-600 hover:text-red-800 inline-block"
              title="Archive warehouse"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </td>
    </tr>
  );
})}
```

- [ ] **Step 6: Add the archive confirmation modal**

Add this component at the bottom of the file (after `WarehouseModal`):

```tsx
function ArchiveConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Archive Warehouse</h2>
          <button type="button" onClick={onCancel} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Archive this warehouse? It will be hidden from the active list but all stock data is preserved.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 font-medium"
          >
            Archive
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

In the `WarehousesPage` JSX, render the modal just before the closing `</div>`:

```tsx
{archiveTarget && (
  <ArchiveConfirmModal
    onConfirm={() => handleArchive(archiveTarget)}
    onCancel={() => setArchiveTarget(null)}
  />
)}
```

- [ ] **Step 7: Verify in browser**

Open `http://localhost:3000/warehouses`. Click the trash icon on a warehouse — the custom "Archive Warehouse" modal should appear. Click **Archive** — the warehouse disappears from the list. Toggle "Show Archived" on — the warehouse reappears grayed out with an `ARCHIVED` orange badge and a green restore icon. Click the restore icon — the warehouse returns to active. Toggle "Show Archived" back off — archived warehouses are hidden again.

- [ ] **Step 8: Commit**

```bash
git add app/warehouses/page.tsx
git commit -m "feat: add warehouse archive/restore UI with Show Archived toggle"
```

---

## Task 3: Filter archived warehouses from Stock Transfers dropdown

**Files:**
- Modify: `app/stock-transfers/page.tsx`

- [ ] **Step 1: Locate the warehouse options in `TransferModal`**

Open `app/stock-transfers/page.tsx`. Find the `TransferModal` function. There are two `<select>` elements for source and destination warehouse — both map over `warehouses` prop:

```tsx
{warehouses.map((w: any) => (
  <option key={w.id} value={w.id}>{w.name}</option>
))}
```

- [ ] **Step 2: Filter out ARCHIVED warehouses in both selects**

Replace both instances of `{warehouses.map(...)}` with:

```tsx
{warehouses.filter((w: any) => w.status !== 'ARCHIVED').map((w: any) => (
  <option key={w.id} value={w.id}>{w.name}</option>
))}
```

There are two identical instances (source and destination) — update both.

- [ ] **Step 3: Commit**

```bash
git add app/stock-transfers/page.tsx
git commit -m "feat: exclude archived warehouses from stock transfer dropdowns"
```

---

## Task 4: Filter archived warehouses from Supply Receipts dropdown

**Files:**
- Modify: `app/supply-receipts/page.tsx`

- [ ] **Step 1: Locate the warehouse select in `ReceiptModal`**

Open `app/supply-receipts/page.tsx`. Find the warehouse `<select>` in `ReceiptModal`:

```tsx
{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
```

- [ ] **Step 2: Filter out ARCHIVED warehouses**

Replace that line with:

```tsx
{warehouses.filter(w => w.status !== 'ARCHIVED').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
```

- [ ] **Step 3: Commit**

```bash
git add app/supply-receipts/page.tsx
git commit -m "feat: exclude archived warehouses from supply receipt dropdown"
```

---

## Self-Review Checklist

- [x] DELETE → archive (Task 1) ✓
- [x] PUT restore clears `archivedAt` (Task 1) ✓  
- [x] `Warehouse` interface extended with `ARCHIVED` + `archivedAt` (Task 2) ✓
- [x] `showArchived` toggle (Task 2) ✓
- [x] Archive confirmation modal (Task 2) ✓
- [x] Archived rows: grayed, ARCHIVED badge, Restore button (Task 2) ✓
- [x] Archived warehouses sorted to bottom (Task 2) ✓
- [x] Stock transfers dropdown filtered (Task 3) ✓
- [x] Supply receipts dropdown filtered (Task 4) ✓
- [x] Stock issues — no warehouse picker exists, no change needed ✓
