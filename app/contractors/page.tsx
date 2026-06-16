'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiLoader, FiClock } from 'react-icons/fi';
import { useAuth } from '@/components/AuthContext';
import HistoryPanel from '@/components/HistoryPanel';

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

const CACHE_KEY = 'erp-contractors';

function readCache<T>(): T[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(list: T[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contractor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
  const { canDo } = useAuth();

  useEffect(() => {
    const cached = readCache<Contractor>();
    if (cached) {
      setContractors(cached);
      setLoading(false);
    }
    fetch('/api/contractors')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setContractors(list);
        writeCache(list);
      })
      .catch(error => {
        console.error('Failed to fetch contractors:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contractor?')) return;
    setError(null);
    setDeletingId(id);
    const previous = contractors;
    const updated = contractors.filter(c => c.id !== id);
    setContractors(updated);
    writeCache(updated);
    try {
      const res = await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setContractors(previous);
      writeCache(previous);
      setError('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = contractors
    .filter(c => ['name', 'phone', 'role', 'company'].some(f => String((c as any)[f] ?? '').toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => {
      if (!sortKey) return 0;
      const av = String((a as any)[sortKey] ?? '');
      const bv = String((b as any)[sortKey] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Contractors & Workers</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Manage contractors and daily workers for stock issuance.</p>
        </div>
        {canDo('contractors', 'add') && (
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Contractor</span>
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
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, role, or company..."
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
                <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-600">Name {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('phone')} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-600">Phone {sortKey === 'phone' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('role')} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-600">Role {sortKey === 'role' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('company')} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-600">Company {sortKey === 'company' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No contractors found.</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">
                    <button onClick={() => setHistoryTarget({ id: c.id, name: c.name })} className="hover:text-blue-600 hover:underline text-left">
                      {c.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">{c.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleBadge(c.role)}`}>{c.role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 hidden md:table-cell">{c.company || '—'}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {canDo('contractors', 'edit') && (
                    <button onClick={() => { setEditing(c); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 inline-block">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    )}
                    {canDo('contractors', 'delete') && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={!!deletingId}
                      className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                    >
                      {deletingId === c.id
                        ? <FiLoader className="w-4 h-4 animate-spin" />
                        : <FiTrash2 className="w-4 h-4" />}
                    </button>
                    )}
                    <button
                      onClick={() => setHistoryTarget({ id: c.id, name: c.name })}
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
        <ContractorModal
          contractor={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={saved => {
            setContractors(prev => {
              const updated = editing
                ? prev.map(c => c.id === saved.id ? saved : c)
                : [...prev, saved];
              writeCache(updated);
              return updated;
            });
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
      {historyTarget && (
        <HistoryPanel
          entityType="contractor"
          entityId={historyTarget.id}
          entityName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
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
    } catch (error) {
      console.error('Failed to save contractor:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{contractor ? 'Edit' : 'Add'} Contractor / Worker</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
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
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as 'Contractor' | 'Daily Worker' })}
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
