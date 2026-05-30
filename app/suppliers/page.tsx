'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX, FiLoader, FiFileText, FiClock } from 'react-icons/fi';
import HistoryPanel from '@/components/HistoryPanel';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: 'ACTIVE' | 'INACTIVE';
  address?: string;
  postalCode?: string;
}

const CACHE_KEY = 'erp-suppliers';

function readCache<T>(): T[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(list: T[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { canDo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const cached = readCache<Supplier>();
    if (cached) {
      setSuppliers(cached);
      setLoading(false);
    }
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      const list = data.suppliers || data || [];
      setSuppliers(list);
      writeCache(list);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    setError(null);
    setDeletingId(id);
    const previous = suppliers;
    const updated = suppliers.filter(s => s.id !== id);
    setSuppliers(updated);
    writeCache(updated);
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setSuppliers(previous);
      writeCache(previous);
      setError('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-2 text-gray-600">Manage supplier details, contacts, and performance.</p>
        </div>
        <button
          onClick={() => { setEditingSupplier(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-500 hover:text-red-700">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No suppliers found.</td></tr>
              )}
              {filteredSuppliers.map((supplier: any) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <button onClick={() => setViewingSupplier(supplier)} className="hover:text-blue-600 hover:underline text-left">
                      {supplier.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{supplier.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{supplier.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{supplier.city}, {supplier.country}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    <button
                      onClick={() => setViewingSupplier(supplier)}
                      className="text-green-600 hover:text-green-800 inline-block"
                      title="View Transactions"
                    >
                      <FiFileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingSupplier(supplier); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 inline-block"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    {canDo('suppliers', 'delete') && (
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        disabled={!!deletingId}
                        className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                      >
                        {deletingId === supplier.id
                          ? <FiLoader className="w-4 h-4 animate-spin" />
                          : <FiTrash2 className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => setHistoryTarget({ id: supplier.id, name: supplier.name })}
                      className="text-purple-500 hover:text-purple-700 inline-block"
                      title="View History"
                    >
                      <FiClock className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => { setShowModal(false); setEditingSupplier(null); }}
          onSave={(saved: Supplier) => {
            setSuppliers(prev => {
              const updated = editingSupplier
                ? prev.map(i => i.id === saved.id ? saved : i)
                : [...prev, saved];
              writeCache(updated);
              return updated;
            });
            setShowModal(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {viewingSupplier && (
        <SupplierTransactionsModal
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
        />
      )}

      {historyTarget && (
        <HistoryPanel
          entityType="supplier"
          entityId={historyTarget.id}
          entityName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}

function SupplierTransactionsModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supply-receipts')
      .then(r => r.json())
      .then(data => {
        const all = Array.isArray(data) ? data : [];
        setReceipts(all.filter((r: any) => r.supplierId === supplier.id || r.supplierName === supplier.name));
      })
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [supplier.id, supplier.name]);

  const total = receipts.reduce((s, r) => s + (r.totalAmount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Transactions — {supplier.name}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{supplier.email} · {supplier.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No supply receipts found for this supplier.</div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Receipt ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Warehouse</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Gate Pass</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {receipts.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">{r.warehouseName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.dateTime ? new Date(r.dateTime).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.gatePassNumber || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-100">₹{(r.totalAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-slate-700">
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300">Total ({receipts.length} receipts)</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-blue-700 dark:text-blue-400">₹{total.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SupplierModal({ supplier, onClose, onSave }: any) {
  const [formData, setFormData] = useState(supplier || {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    status: 'ACTIVE',
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers';
      const method = supplier ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const saved = await response.json();
        onSave(saved);
      } else {
        throw new Error(`${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save supplier:', error);
      setSaveError('Failed to save supplier. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {saveError && (
          <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            <span>{saveError}</span>
            <button onClick={() => setSaveError(null)} className="shrink-0 text-red-500 hover:text-red-700">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="Postal Code" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <textarea placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <div className="flex space-x-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving ? <><FiLoader className="w-4 h-4 animate-spin" />Saving...</> : <>{supplier ? 'Update' : 'Add'} Supplier</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
