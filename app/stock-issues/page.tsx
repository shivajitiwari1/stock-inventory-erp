'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/components/AuthContext';

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

const CACHE_KEY = 'erp-stock-issues';

function readCache<T>(): T[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(list: T[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

export default function StockIssuesPage() {
  const [issues, setIssues] = useState<StockIssue[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StockIssue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { canDo } = useAuth();

  useEffect(() => {
    const cached = readCache<StockIssue>();
    if (cached) {
      setIssues(cached);
      setLoading(false);
      // Still fetch auxiliary data for modal dropdowns
      Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/contractors').then(r => r.json()),
      ]).then(([prods, cons]) => {
        setProducts(Array.isArray(prods) ? prods : (prods.products || []));
        setContractors(Array.isArray(cons) ? cons : []);
      }).catch(error => {
        console.error('Failed to load auxiliary data:', error);
      });
      return;
    }
    Promise.all([
      fetch('/api/stock-issues').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/contractors').then(r => r.json()),
    ]).then(([iss, prods, cons]) => {
      const list = Array.isArray(iss) ? iss : [];
      setIssues(list);
      writeCache(list);
      setProducts(Array.isArray(prods) ? prods : (prods.products || []));
      setContractors(Array.isArray(cons) ? cons : []);
    }).catch(error => {
      console.error('Failed to load data:', error);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stock issue record?')) return;
    setError(null);
    setDeletingId(id);
    const previous = issues;
    const updated = issues.filter(i => i.id !== id);
    setIssues(updated);
    writeCache(updated);
    try {
      const res = await fetch(`/api/stock-issues/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setIssues(previous);
      writeCache(previous);
      setError('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = issues.filter(i => {
    const matchSearch = (i.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.contractorName || '').toLowerCase().includes(searchTerm.toLowerCase());
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
        {canDo('stock-issues', 'add') && (
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Issue Stock</span>
        </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-500 hover:text-red-700">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Item</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">Contractor / Worker</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
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
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">{issue.contractorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 hidden md:table-cell">
                    {new Date(issue.issueDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(issue.status)}`}>{issue.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {canDo('stock-issues', 'edit') && (
                    <button onClick={() => { setEditing(issue); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    )}
                    {canDo('stock-issues', 'delete') && (
                    <button
                      onClick={() => handleDelete(issue.id)}
                      disabled={!!deletingId}
                      className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                    >
                      {deletingId === issue.id
                        ? <FiLoader className="w-4 h-4 animate-spin" />
                        : <FiTrash2 className="w-4 h-4" />}
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
        <StockIssueModal
          issue={editing}
          products={products}
          contractors={contractors}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saved => {
            setIssues(prev => {
              const updated = editing
                ? prev.map(i => i.id === saved.id ? saved : i)
                : [...prev, saved];
              writeCache(updated);
              return updated;
            });
            setShowModal(false);
            setEditing(null);
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
    } catch (error) {
      console.error('Failed to save stock issue:', error);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{issue ? 'Edit' : 'Issue'} Stock</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Item *</label>
            <select value={form.productId} onChange={e => setProduct(e.target.value)} required className={inputCls}>
              <option value="">Select Item</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
