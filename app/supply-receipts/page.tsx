'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiPaperclip, FiExternalLink, FiX } from 'react-icons/fi';
import { useAuth } from '@/components/AuthContext';

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
interface Warehouse { id: string; name: string; status?: string; }
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
  const { canDo } = useAuth();

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
    }).catch(error => {
      console.error('Failed to load data:', error);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supply receipt?')) return;
    try {
      const res = await fetch(`/api/supply-receipts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReceipts(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete receipt:', error);
    }
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
        {canDo('supply-receipts', 'add') && (
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Receipt</span>
        </button>
        )}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Receipt ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Warehouse</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Amount (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Gate Pass</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Receipt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">No receipts found.</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-4 py-4 text-xs text-gray-500 dark:text-slate-400 font-mono hidden sm:table-cell">{r.id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">{r.supplierName}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">{r.warehouseName}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">
                    {new Date(r.dateTime).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-slate-100 hidden md:table-cell">₹{r.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-slate-400 hidden md:table-cell">{r.gatePassNumber || '—'}</td>
                  <td className="px-4 py-4 text-sm">
                    {r.receiptFile ? (
                      <a href={r.receiptFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <FiPaperclip className="w-3 h-3" /><FiExternalLink className="w-3 h-3" />
                      </a>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-4 text-sm space-x-2">
                    {canDo('supply-receipts', 'edit') && (
                    <button onClick={() => { setEditing(r); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    )}
                    {canDo('supply-receipts', 'delete') && (
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 inline-block">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    )}
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
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('receiptId', saved.id);
          const upRes = await fetch('/api/supply-receipts/upload', { method: 'POST', body: fd });
          if (upRes.ok) {
            const { filePath } = await upRes.json();
            saved.receiptFile = filePath;
          }
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
        }
      }
      onSave(saved);
    } catch (error) {
      console.error('Failed to save receipt:', error);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{receipt ? 'Edit' : 'Add'} Supply Receipt</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                {warehouses.filter(w => w.status !== 'ARCHIVED').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date & Time *</label>
              <input type="datetime-local" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Verified By *</label>
              <input type="text" value={form.verifiedBy} onChange={e => setForm({ ...form, verifiedBy: e.target.value })} required className={inputCls} placeholder="Name of verifier" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
