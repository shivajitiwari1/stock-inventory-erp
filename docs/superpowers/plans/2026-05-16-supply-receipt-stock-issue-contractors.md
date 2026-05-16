# Supply Receipt, Stock Issue & Contractor Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three new CRUD pages to the Stock ERP — Contractor/Worker Management, Supply Receipts, and Stock Issues to Contractors — each with full create/edit/delete functionality.

**Architecture:** Three independent Next.js App Router page + API route pairs following the existing pattern: JSON file persistence via `lib/db.ts`, modal-based forms, Tailwind CSS. Contractors is built first because its dropdown feeds Stock Issues. File uploads for supply receipts are saved to `public/uploads/receipts/`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS 4, `react-icons/fi`, `lib/db.ts` (`readJSON`/`writeJSON`/`generateId`)

---

## File Map

**New files to create:**
- `data/contractors.json`
- `data/supplyReceipts.json`
- `data/stockIssues.json`
- `public/uploads/receipts/.gitkeep`
- `app/api/contractors/route.ts`
- `app/api/contractors/[id]/route.ts`
- `app/api/supply-receipts/route.ts`
- `app/api/supply-receipts/[id]/route.ts`
- `app/api/supply-receipts/upload/route.ts`
- `app/api/stock-issues/route.ts`
- `app/api/stock-issues/[id]/route.ts`
- `app/contractors/page.tsx`
- `app/supply-receipts/page.tsx`
- `app/stock-issues/page.tsx`

**Files to modify:**
- `components/Sidebar.tsx` — add 3 nav items + import 3 icons

---

## Task 1: Seed Data Files & Uploads Directory

**Files:**
- Create: `data/contractors.json`
- Create: `data/supplyReceipts.json`
- Create: `data/stockIssues.json`
- Create: `public/uploads/receipts/.gitkeep`

- [ ] **Step 1: Create contractors.json**

```json
{
  "contractors": []
}
```
Save to `data/contractors.json`.

- [ ] **Step 2: Create supplyReceipts.json**

```json
{
  "supplyReceipts": []
}
```
Save to `data/supplyReceipts.json`.

- [ ] **Step 3: Create stockIssues.json**

```json
{
  "stockIssues": []
}
```
Save to `data/stockIssues.json`.

- [ ] **Step 4: Create uploads directory**

```bash
mkdir -p public/uploads/receipts
touch public/uploads/receipts/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add data/contractors.json data/supplyReceipts.json data/stockIssues.json public/uploads/receipts/.gitkeep
git commit -m "feat: add data files and uploads dir for new modules"
```

---

## Task 2: Contractors API Routes

**Files:**
- Create: `app/api/contractors/route.ts`
- Create: `app/api/contractors/[id]/route.ts`

- [ ] **Step 1: Create `app/api/contractors/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('contractors.json');
    if (!data) return NextResponse.json({ error: 'Failed to read contractors' }, { status: 500 });
    return NextResponse.json(data.contractors || []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('contractors.json');
    if (!data || !Array.isArray(data.contractors)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    const newContractor = {
      id: generateId('CON'),
      name: body.name,
      phone: body.phone,
      role: body.role,
      company: body.company || '',
      createdAt: new Date().toISOString(),
    };
    data.contractors.push(newContractor);
    writeJSON('contractors.json', data);
    return NextResponse.json(newContractor, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/contractors/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('contractors.json');
    const index = data.contractors.findIndex((c: any) => c.id === id);
    if (index === -1) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    data.contractors[index] = {
      ...data.contractors[index],
      name: body.name,
      phone: body.phone,
      role: body.role,
      company: body.company || '',
      updatedAt: new Date().toISOString(),
    };
    writeJSON('contractors.json', data);
    return NextResponse.json(data.contractors[index]);
  } catch {
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('contractors.json');
    const index = data.contractors.findIndex((c: any) => c.id === id);
    if (index === -1) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    data.contractors.splice(index, 1);
    writeJSON('contractors.json', data);
    return NextResponse.json({ message: 'Contractor deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify API manually — start dev server and test**

```bash
npm run dev
```

Open browser and navigate to `http://localhost:3000/api/contractors` — expect `[]`.

POST a contractor via browser console:
```javascript
fetch('/api/contractors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Ramesh Kumar', phone: '9876543210', role: 'Contractor', company: 'Kumar Constructions' })
}).then(r => r.json()).then(console.log)
```
Expect: `{ id: "CON...", name: "Ramesh Kumar", ... }`

- [ ] **Step 4: Commit**

```bash
git add app/api/contractors/
git commit -m "feat: add contractors API routes (GET, POST, PUT, DELETE)"
```

---

## Task 3: Contractors Page

**Files:**
- Create: `app/contractors/page.tsx`

- [ ] **Step 1: Create `app/contractors/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiBriefcase } from 'react-icons/fi';

interface Contractor {
  id: string;
  name: string;
  phone: string;
  role: 'Contractor' | 'Daily Worker';
  company: string;
  createdAt: string;
}

const ROLES = ['Contractor', 'Daily Worker'] as const;

const roleBadge = (role: string) =>
  role === 'Contractor'
    ? 'bg-green-100 text-green-700'
    : 'bg-blue-100 text-blue-700';

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchContractors(); }, []);

  const fetchContractors = async () => {
    try {
      const res = await fetch('/api/contractors');
      const data = await res.json();
      setContractors(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contractor?')) return;
    await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
    setContractors(prev => prev.filter(c => c.id !== id));
  };

  const filtered = contractors.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Contractors & Workers</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Manage contractors and daily workers for stock issuance.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Contractor</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {['Name', 'Phone', 'Role', 'Company', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No contractors found.</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{c.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleBadge(c.role)}`}>{c.role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{c.company || '—'}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => { setEditing(c); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 inline-block">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ContractorModal
          contractor={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saved => {
            setContractors(prev => editing ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function ContractorModal({ contractor, onClose, onSave }: { contractor: Contractor | null; onClose: () => void; onSave: (c: Contractor) => void }) {
  const [form, setForm] = useState({
    name: contractor?.name || '',
    phone: contractor?.phone || '',
    role: contractor?.role || 'Contractor',
    company: contractor?.company || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = contractor ? `/api/contractors/${contractor.id}` : '/api/contractors';
      const method = contractor ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) onSave(await res.json());
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-slate-100">{contractor ? 'Edit' : 'Add'} Contractor / Worker</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone Number *</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role *</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Company Name {form.role === 'Daily Worker' && <span className="text-gray-400 text-xs">(optional)</span>}
            </label>
            <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
              required={form.role === 'Contractor'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : contractor ? 'Update' : 'Add'} Contractor
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/contractors`. Verify:
- Page loads with empty table
- Clicking "Add Contractor" opens the modal
- Saving a contractor shows it in the table
- Edit and delete work

- [ ] **Step 3: Commit**

```bash
git add app/contractors/
git commit -m "feat: add contractors page with CRUD modal"
```

---

## Task 4: Supply Receipts API Routes

**Files:**
- Create: `app/api/supply-receipts/route.ts`
- Create: `app/api/supply-receipts/[id]/route.ts`
- Create: `app/api/supply-receipts/upload/route.ts`

- [ ] **Step 1: Create `app/api/supply-receipts/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('supplyReceipts.json');
    if (!data) return NextResponse.json({ error: 'Failed to read supply receipts' }, { status: 500 });
    return NextResponse.json(data.supplyReceipts || []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('supplyReceipts.json');
    if (!data || !Array.isArray(data.supplyReceipts)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    const newReceipt = {
      id: generateId('SR'),
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      warehouseId: body.warehouseId,
      warehouseName: body.warehouseName,
      dateTime: body.dateTime,
      verifiedBy: body.verifiedBy,
      totalAmount: Number(body.totalAmount),
      gatePassNumber: body.gatePassNumber || '',
      items: body.items || [],
      receiptFile: '',
      createdAt: new Date().toISOString(),
    };
    data.supplyReceipts.push(newReceipt);
    writeJSON('supplyReceipts.json', data);
    return NextResponse.json(newReceipt, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create supply receipt' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/supply-receipts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('supplyReceipts.json');
    const index = data.supplyReceipts.findIndex((r: any) => r.id === id);
    if (index === -1) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    data.supplyReceipts[index] = {
      ...data.supplyReceipts[index],
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      warehouseId: body.warehouseId,
      warehouseName: body.warehouseName,
      dateTime: body.dateTime,
      verifiedBy: body.verifiedBy,
      totalAmount: Number(body.totalAmount),
      gatePassNumber: body.gatePassNumber || '',
      items: body.items || [],
      receiptFile: body.receiptFile ?? data.supplyReceipts[index].receiptFile,
      updatedAt: new Date().toISOString(),
    };
    writeJSON('supplyReceipts.json', data);
    return NextResponse.json(data.supplyReceipts[index]);
  } catch {
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('supplyReceipts.json');
    const index = data.supplyReceipts.findIndex((r: any) => r.id === id);
    if (index === -1) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    data.supplyReceipts.splice(index, 1);
    writeJSON('supplyReceipts.json', data);
    return NextResponse.json({ message: 'Receipt deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create `app/api/supply-receipts/upload/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { readJSON, writeJSON } from '@/lib/db';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const receiptId = formData.get('receiptId') as string | null;

    if (!file || !receiptId) {
      return NextResponse.json({ error: 'Missing file or receiptId' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, PNG allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.bin';
    const filename = `${receiptId}${ext}`;
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'receipts', filename);

    const bytes = await file.arrayBuffer();
    await writeFile(uploadPath, Buffer.from(bytes));

    const filePath = `/uploads/receipts/${filename}`;

    // Update receipt record with file path
    const data = readJSON('supplyReceipts.json');
    if (data && Array.isArray(data.supplyReceipts)) {
      const index = data.supplyReceipts.findIndex((r: any) => r.id === receiptId);
      if (index !== -1) {
        data.supplyReceipts[index].receiptFile = filePath;
        writeJSON('supplyReceipts.json', data);
      }
    }

    return NextResponse.json({ filePath });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/supply-receipts/
git commit -m "feat: add supply receipts API routes with file upload"
```

---

## Task 5: Supply Receipts Page

**Files:**
- Create: `app/supply-receipts/page.tsx`

- [ ] **Step 1: Create `app/supply-receipts/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiPaperclip, FiExternalLink } from 'react-icons/fi';

interface ReceiptItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface SupplyReceipt {
  id: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  dateTime: string;
  verifiedBy: string;
  totalAmount: number;
  gatePassNumber: string;
  items: ReceiptItem[];
  receiptFile: string;
  createdAt: string;
}

interface Supplier { id: string; name: string; }
interface Warehouse { id: string; name: string; }
interface Product { id: string; name: string; }

export default function SupplyReceiptsPage() {
  const [receipts, setReceipts] = useState<SupplyReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SupplyReceipt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/supply-receipts').then(r => r.json()),
      fetch('/api/suppliers').then(r => r.json()),
      fetch('/api/warehouses').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
    ]).then(([rcpts, supps, whs, prods]) => {
      setReceipts(Array.isArray(rcpts) ? rcpts : []);
      setSuppliers(Array.isArray(supps) ? supps : (supps.suppliers || []));
      setWarehouses(Array.isArray(whs) ? whs : (whs.warehouses || []));
      setProducts(Array.isArray(prods) ? prods : (prods.products || []));
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supply receipt?')) return;
    await fetch(`/api/supply-receipts/${id}`, { method: 'DELETE' });
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const filtered = receipts.filter(r =>
    r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.gatePassNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Supply Receipts</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Record goods received from suppliers at site warehouses.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Receipt</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by supplier or gate pass..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {['Receipt ID', 'Supplier', 'Warehouse', 'Date', 'Amount (₹)', 'Gate Pass', 'Receipt', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">No receipts found.</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-4 py-4 text-xs text-gray-500 dark:text-slate-400 font-mono">{r.id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">{r.supplierName}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">{r.warehouseName}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">
                    {new Date(r.dateTime).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-slate-100">₹{r.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400">{r.gatePassNumber || '—'}</td>
                  <td className="px-4 py-4 text-sm">
                    {r.receiptFile ? (
                      <a href={r.receiptFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <FiPaperclip className="w-3 h-3" /><FiExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-4 text-sm space-x-2">
                    <button onClick={() => { setEditing(r); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 inline-block">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ReceiptModal
          receipt={editing}
          suppliers={suppliers}
          warehouses={warehouses}
          products={products}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saved => {
            setReceipts(prev => editing ? prev.map(r => r.id === saved.id ? saved : r) : [...prev, saved]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function ReceiptModal({ receipt, suppliers, warehouses, products, onClose, onSave }: {
  receipt: SupplyReceipt | null;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  products: Product[];
  onClose: () => void;
  onSave: (r: SupplyReceipt) => void;
}) {
  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    supplierId: receipt?.supplierId || '',
    supplierName: receipt?.supplierName || '',
    warehouseId: receipt?.warehouseId || '',
    warehouseName: receipt?.warehouseName || '',
    dateTime: receipt?.dateTime ? receipt.dateTime.slice(0, 16) : localISO,
    verifiedBy: receipt?.verifiedBy || '',
    totalAmount: receipt?.totalAmount?.toString() || '',
    gatePassNumber: receipt?.gatePassNumber || '',
    items: receipt?.items || [] as ReceiptItem[],
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showItems, setShowItems] = useState((receipt?.items?.length || 0) > 0);

  const setSupplier = (id: string) => {
    const s = suppliers.find(s => s.id === id);
    setForm(f => ({ ...f, supplierId: id, supplierName: s?.name || '' }));
  };

  const setWarehouse = (id: string) => {
    const w = warehouses.find(w => w.id === id);
    setForm(f => ({ ...f, warehouseId: id, warehouseName: w?.name || '' }));
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', productName: '', quantity: 1, unit: '' }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i: number, field: keyof ReceiptItem, value: string | number) => {
    setForm(f => {
      const items = [...f.items];
      if (field === 'productId') {
        const p = products.find(p => p.id === value);
        items[i] = { ...items[i], productId: value as string, productName: p?.name || '' };
      } else {
        items[i] = { ...items[i], [field]: value };
      }
      return { ...f, items };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, dateTime: form.dateTime + ':00', totalAmount: Number(form.totalAmount) };
      const url = receipt ? `/api/supply-receipts/${receipt.id}` : '/api/supply-receipts';
      const method = receipt ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) return;
      const saved: SupplyReceipt = await res.json();

      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('receiptId', saved.id);
        const upRes = await fetch('/api/supply-receipts/upload', { method: 'POST', body: fd });
        if (upRes.ok) {
          const { filePath } = await upRes.json();
          saved.receiptFile = filePath;
        }
      }
      onSave(saved);
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-slate-100">{receipt ? 'Edit' : 'Add'} Supply Receipt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Supplier *</label>
              <select value={form.supplierId} onChange={e => setSupplier(e.target.value)} required className={inputCls}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Warehouse *</label>
              <select value={form.warehouseId} onChange={e => setWarehouse(e.target.value)} required className={inputCls}>
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date & Time *</label>
              <input type="datetime-local" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Verified By *</label>
              <input type="text" value={form.verifiedBy} onChange={e => setForm({ ...form, verifiedBy: e.target.value })} required className={inputCls} placeholder="Name of verifier" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Total Amount (₹) *</label>
              <input type="number" min="0" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} required className={inputCls} placeholder="e.g. 45000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gate Pass Number <span className="text-gray-400 text-xs">(optional)</span></label>
              <input type="text" value={form.gatePassNumber} onChange={e => setForm({ ...form, gatePassNumber: e.target.value })} className={inputCls} placeholder="e.g. GP-2026-001" />
            </div>
          </div>

          {/* Items — collapsible optional section */}
          <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <button type="button" onClick={() => setShowItems(!showItems)}
              className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-slate-700 text-left">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Items Received <span className="text-xs text-gray-400 font-normal ml-1">(optional — can be added later)</span>
              </span>
              <span className="text-blue-600 text-sm">{showItems ? '▲ Hide' : '▼ Add Items'}</span>
            </button>
            {showItems && (
              <div className="p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700">
                      <th className="px-2 py-2 text-left font-medium text-gray-600 dark:text-slate-300">Product</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600 dark:text-slate-300 w-24">Qty</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600 dark:text-slate-300 w-24">Unit</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-1 py-1">
                          <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-xs">
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1">
                          <input type="number" min="1" value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-xs" />
                        </td>
                        <td className="px-1 py-1">
                          <input type="text" value={item.unit} placeholder="e.g. Bags"
                            onChange={e => updateItem(i, 'unit', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-xs" />
                        </td>
                        <td className="px-1 py-1 text-center">
                          <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={addItem}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <FiPlus className="w-3 h-3" /> Add Row
                </button>
              </div>
            )}
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Upload Receipt <span className="text-gray-400 text-xs">(optional — PDF, JPG, PNG, max 10MB)</span>
            </label>
            {receipt?.receiptFile && !file && (
              <p className="text-xs text-green-600 mb-1">Current file: <a href={receipt.receiptFile} target="_blank" rel="noopener noreferrer" className="underline">view</a></p>
            )}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : receipt ? 'Update Receipt' : 'Save Receipt'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/supply-receipts`. Verify:
- Page loads with empty table
- "Add Receipt" opens modal with supplier/warehouse dropdowns populated
- Create a receipt without items/file — appears in table
- Edit the receipt — add an item row and a file, save — table shows file link
- Delete works

- [ ] **Step 3: Commit**

```bash
git add app/supply-receipts/
git commit -m "feat: add supply receipts page with file upload and line items"
```

---

## Task 6: Stock Issues API Routes

**Files:**
- Create: `app/api/stock-issues/route.ts`
- Create: `app/api/stock-issues/[id]/route.ts`

- [ ] **Step 1: Create `app/api/stock-issues/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON, generateId } from '@/lib/db';

export async function GET() {
  try {
    const data = readJSON('stockIssues.json');
    if (!data) return NextResponse.json({ error: 'Failed to read stock issues' }, { status: 500 });
    return NextResponse.json(data.stockIssues || []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = readJSON('stockIssues.json');
    if (!data || !Array.isArray(data.stockIssues)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }
    const newIssue = {
      id: generateId('SI'),
      productId: body.productId,
      productName: body.productName,
      quantity: Number(body.quantity),
      unit: body.unit || '',
      contractorId: body.contractorId,
      contractorName: body.contractorName,
      issueDate: body.issueDate,
      status: body.status || 'Issued',
      createdAt: new Date().toISOString(),
    };
    data.stockIssues.push(newIssue);
    writeJSON('stockIssues.json', data);
    return NextResponse.json(newIssue, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create stock issue' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/stock-issues/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('stockIssues.json');
    const index = data.stockIssues.findIndex((s: any) => s.id === id);
    if (index === -1) return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    data.stockIssues[index] = {
      ...data.stockIssues[index],
      productId: body.productId,
      productName: body.productName,
      quantity: Number(body.quantity),
      unit: body.unit || '',
      contractorId: body.contractorId,
      contractorName: body.contractorName,
      issueDate: body.issueDate,
      status: body.status,
      updatedAt: new Date().toISOString(),
    };
    writeJSON('stockIssues.json', data);
    return NextResponse.json(data.stockIssues[index]);
  } catch {
    return NextResponse.json({ error: 'Failed to update stock issue' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('stockIssues.json');
    const index = data.stockIssues.findIndex((s: any) => s.id === id);
    if (index === -1) return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    data.stockIssues.splice(index, 1);
    writeJSON('stockIssues.json', data);
    return NextResponse.json({ message: 'Stock issue deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete stock issue' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/stock-issues/
git commit -m "feat: add stock issues API routes (GET, POST, PUT, DELETE)"
```

---

## Task 7: Stock Issues Page

**Files:**
- Create: `app/stock-issues/page.tsx`

- [ ] **Step 1: Create `app/stock-issues/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';

interface StockIssue {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  contractorId: string;
  contractorName: string;
  issueDate: string;
  status: string;
  createdAt: string;
}

interface Product { id: string; name: string; }
interface Contractor { id: string; name: string; role: string; }

const STATUSES = ['Issued', 'Partially Returned', 'Fully Returned', 'Damaged', 'Lost'] as const;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    'Issued': 'bg-green-100 text-green-700',
    'Partially Returned': 'bg-yellow-100 text-yellow-700',
    'Fully Returned': 'bg-blue-100 text-blue-700',
    'Damaged': 'bg-red-100 text-red-700',
    'Lost': 'bg-red-200 text-red-900',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export default function StockIssuesPage() {
  const [issues, setIssues] = useState<StockIssue[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StockIssue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/stock-issues').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/contractors').then(r => r.json()),
    ]).then(([iss, prods, cons]) => {
      setIssues(Array.isArray(iss) ? iss : []);
      setProducts(Array.isArray(prods) ? prods : (prods.products || []));
      setContractors(Array.isArray(cons) ? cons : []);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stock issue record?')) return;
    await fetch(`/api/stock-issues/${id}`, { method: 'DELETE' });
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  const filtered = issues.filter(i => {
    const matchSearch = i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.contractorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter ? i.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Stock Issues</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Track materials issued to contractors and workers on site.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Issue Stock</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by item or contractor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {['Item', 'Qty', 'Contractor / Worker', 'Issue Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No stock issues found.</td></tr>
              )}
              {filtered.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">{issue.productName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{issue.quantity} {issue.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{issue.contractorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                    {new Date(issue.issueDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(issue.status)}`}>{issue.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => { setEditing(issue); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(issue.id)} className="text-red-600 hover:text-red-800 inline-block">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <StockIssueModal
          issue={editing}
          products={products}
          contractors={contractors}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saved => {
            setIssues(prev => editing ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function StockIssueModal({ issue, products, contractors, onClose, onSave }: {
  issue: StockIssue | null;
  products: Product[];
  contractors: Contractor[];
  onClose: () => void;
  onSave: (i: StockIssue) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    productId: issue?.productId || '',
    productName: issue?.productName || '',
    quantity: issue?.quantity?.toString() || '',
    unit: issue?.unit || '',
    contractorId: issue?.contractorId || '',
    contractorName: issue?.contractorName || '',
    issueDate: issue?.issueDate || today,
    status: issue?.status || 'Issued',
  });
  const [saving, setSaving] = useState(false);

  const setProduct = (id: string) => {
    const p = products.find(p => p.id === id);
    setForm(f => ({ ...f, productId: id, productName: p?.name || '' }));
  };

  const setContractor = (id: string) => {
    const c = contractors.find(c => c.id === id);
    setForm(f => ({ ...f, contractorId: id, contractorName: c?.name || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = issue ? `/api/stock-issues/${issue.id}` : '/api/stock-issues';
      const method = issue ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, quantity: Number(form.quantity) }) });
      if (res.ok) onSave(await res.json());
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-slate-100">{issue ? 'Edit' : 'Issue'} Stock</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Item *</label>
            <select value={form.productId} onChange={e => setProduct(e.target.value)} required className={inputCls}>
              <option value="">Select Item</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Quantity *</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className={inputCls} placeholder="e.g. 10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unit</label>
              <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="e.g. Bags" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contractor / Worker *</label>
            <select value={form.contractorId} onChange={e => setContractor(e.target.value)} required className={inputCls}>
              <option value="">Select Contractor / Worker</option>
              {contractors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.role})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Issue Date *</label>
            <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status *</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : issue ? 'Update' : 'Issue Stock'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/stock-issues`. Verify:
- Page loads with empty table and search + status filter
- "Issue Stock" opens modal with product and contractor dropdowns
- Creating an issue shows it in the table with a green "Issued" badge
- Edit allows changing status — verify badge color changes
- Delete removes the row

- [ ] **Step 3: Commit**

```bash
git add app/stock-issues/
git commit -m "feat: add stock issues page with status badges and filters"
```

---

## Task 8: Sidebar Navigation

**Files:**
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: Add icon imports to `components/Sidebar.tsx`**

Find the existing import line:
```typescript
import {
  FiMenu, FiX, FiHome, FiPackage, FiBox, FiTrendingUp,
  FiUsers, FiActivity, FiBarChart, FiAlertCircle,
  FiLogOut, FiLogIn, FiSun, FiMoon, FiRepeat,
} from 'react-icons/fi';
```

Replace with:
```typescript
import {
  FiMenu, FiX, FiHome, FiPackage, FiBox, FiTrendingUp,
  FiUsers, FiActivity, FiBarChart, FiAlertCircle,
  FiLogOut, FiLogIn, FiSun, FiMoon, FiRepeat,
  FiFileText, FiArrowUpRight, FiBriefcase,
} from 'react-icons/fi';
```

- [ ] **Step 2: Add three entries to the `menuItems` array**

Find the `menuItems` array. After the `{ href: '/suppliers', ... }` entry, add:

```typescript
{ href: '/supply-receipts',  label: 'Supply Receipts',  icon: FiFileText,      roles: ['ADMIN', 'INVENTORY_MANAGER'] },
{ href: '/stock-issues',     label: 'Stock Issues',     icon: FiArrowUpRight,  roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
{ href: '/contractors',      label: 'Contractors',      icon: FiBriefcase,     roles: ['ADMIN', 'INVENTORY_MANAGER'] },
```

- [ ] **Step 3: Verify in browser**

Refresh `http://localhost:3000`. Verify:
- "Supply Receipts", "Stock Issues", and "Contractors" appear in the sidebar
- Each link navigates to the correct page
- Active page highlights correctly
- Sidebar collapses correctly (icons only when collapsed)

- [ ] **Step 4: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "feat: add supply receipts, stock issues, contractors to sidebar"
```

---

## Done

All three modules are implemented. Final check:
- `/contractors` — add/edit/delete contractors and workers
- `/supply-receipts` — record goods received, optional line items, file upload
- `/stock-issues` — issue stock to contractors, track status with filters
- Sidebar shows all three new pages
