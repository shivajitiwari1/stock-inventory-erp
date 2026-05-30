'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiX, FiLoader } from 'react-icons/fi';

interface Transfer {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productName: string;
  quantity: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  date: string;
}

interface Warehouse {
  id: string;
  name: string;
  status?: string;
}

interface Product {
  id: string;
  name: string;
}

const CACHE_KEY = 'erp-stock-transfers';

function readCache<T>(): T[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(list: T[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { canDo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trRes, whRes, prRes] = await Promise.all([
          fetch('/api/stock-transfers'),
          fetch('/api/warehouses'),
          fetch('/api/products'),
        ]);
        const [trData, whData, prData] = await Promise.all([trRes.json(), whRes.json(), prRes.json()]);
        const list = trData || [];
        setTransfers(list);
        writeCache(list);
        setWarehouses(whData || []);
        setProducts(prData || []);
      } catch (error) {
        console.error('Failed to fetch transfers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const warehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name || id;

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transfer?')) return;
    setError(null);
    setDeletingId(id);
    const previous = transfers;
    const updated = transfers.filter((t) => t.id !== id);
    setTransfers(updated);
    writeCache(updated);
    try {
      const res = await fetch(`/api/stock-transfers/${id}`, { method: 'DELETE' });
      // 404 means already deleted — treat as success, keep removed from UI
      if (!res.ok && res.status !== 404) throw new Error(`${res.status}`);
    } catch {
      setTransfers(previous);
      writeCache(previous);
      setError('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stock Transfers</h1>
          <p className="mt-2 text-gray-600">Track stock transfers between warehouses and view transfer status.</p>
        </div>
        <button
          onClick={() => { setEditingTransfer(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Transfer</span>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Total Transfers</h2>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{transfers.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Pending</h2>
          <p className="mt-3 text-3xl font-semibold text-yellow-600">
            {transfers.filter((t) => t.status === 'PENDING').length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Completed</h2>
          <p className="mt-3 text-3xl font-semibold text-green-600">
            {transfers.filter((t) => t.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transfer History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Transfer ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400">No transfers found.</td>
                </tr>
              ) : transfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 hidden sm:table-cell">{transfer.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{warehouseName(transfer.fromWarehouseId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{warehouseName(transfer.toWarehouseId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transfer.productName}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{transfer.quantity}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      transfer.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      transfer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {new Date(transfer.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2 text-center">
                    <button
                      onClick={() => { setEditingTransfer(transfer); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 inline-block"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    {canDo('stock-transfers', 'delete') && (
                      <button
                        onClick={() => handleDelete(transfer.id)}
                        disabled={!!deletingId}
                        className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed inline-block"
                      >
                        {deletingId === transfer.id
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
        <TransferModal
          transfer={editingTransfer}
          warehouses={warehouses}
          products={products}
          onClose={() => { setShowModal(false); setEditingTransfer(null); }}
          onSave={(saved: Transfer) => {
            setTransfers(prev => {
              const updated = editingTransfer
                ? prev.map((t) => (t.id === saved.id ? saved : t))
                : [...prev, saved];
              writeCache(updated);
              return updated;
            });
            setShowModal(false);
            setEditingTransfer(null);
          }}
        />
      )}
    </div>
  );
}

function TransferModal({ transfer, warehouses, products, onClose, onSave }: any) {
  const [formData, setFormData] = useState(transfer || {
    fromWarehouseId: '',
    toWarehouseId: '',
    productName: '',
    quantity: '',
    status: 'PENDING',
  });
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!formData.fromWarehouseId) { setInventory([]); return; }
    setLoadingInventory(true);
    fetch(`/api/inventory?warehouseId=${formData.fromWarehouseId}`)
      .then(r => r.json())
      .then(data => setInventory(Array.isArray(data) ? data : []))
      .catch(() => setInventory([]))
      .finally(() => setLoadingInventory(false));
  }, [formData.fromWarehouseId]);

  const activeWarehouses = warehouses.filter((w: any) => w.status !== 'ARCHIVED');

  // Products with available stock in selected From Warehouse
  const availableProducts = formData.fromWarehouseId
    ? products.filter((p: any) => {
        const inv = inventory.find((i: any) => i.productId === p.id);
        return inv && inv.availableQuantity > 0;
      })
    : products;

  const selectedProduct = products.find((p: any) => p.name === formData.productName);
  const selectedInventory = selectedProduct
    ? inventory.find((i: any) => i.productId === selectedProduct.id)
    : null;
  const maxQty = selectedInventory?.availableQuantity ?? null;

  const unitPrice = selectedProduct?.price || 0;
  const totalPrice = unitPrice > 0 && formData.quantity ? unitPrice * Number(formData.quantity) : 0;

  const sameWarehouse = formData.fromWarehouseId && formData.toWarehouseId &&
    formData.fromWarehouseId === formData.toWarehouseId;
  const qtyExceedsStock = maxQty !== null && formData.quantity !== '' && Number(formData.quantity) > maxQty;
  const isSubmitDisabled = !!sameWarehouse || !!qtyExceedsStock;

  const handleFromWarehouseChange = (warehouseId: string) => {
    // Reset product when warehouse changes so stale selection doesn't carry over
    setFormData((prev: any) => ({ ...prev, fromWarehouseId: warehouseId, productName: '', quantity: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;
    setSaving(true);
    try {
      const url = transfer ? `/api/stock-transfers/${transfer.id}` : '/api/stock-transfers';
      const method = transfer ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const saved = await response.json();
        onSave(saved);
      }
    } catch (error) {
      console.error('Failed to save transfer:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{transfer ? 'Edit Transfer' : 'New Stock Transfer'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
              <select
                value={formData.fromWarehouseId}
                onChange={(e) => handleFromWarehouseChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select warehouse...</option>
                {activeWarehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
              <select
                value={formData.toWarehouseId}
                onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${sameWarehouse ? 'border-red-400' : ''}`}
                required
              >
                <option value="">Select warehouse...</option>
                {activeWarehouses
                  .filter((w: any) => w.id !== formData.fromWarehouseId)
                  .map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
              </select>
              {sameWarehouse && (
                <p className="mt-1 text-xs text-red-600">Cannot transfer to the same warehouse.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
                {formData.fromWarehouseId && !loadingInventory && availableProducts.length === 0 && (
                  <span className="ml-2 text-xs text-yellow-600 font-normal">No stock available</span>
                )}
              </label>
              <select
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value, quantity: '' })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={loadingInventory || (formData.fromWarehouseId !== '' && availableProducts.length === 0)}
              >
                <option value="">
                  {loadingInventory ? 'Loading...' : 'Select product...'}
                </option>
                {availableProducts.map((p: any) => {
                  const inv = inventory.find((i: any) => i.productId === p.id);
                  const qty = inv?.availableQuantity ?? '';
                  return (
                    <option key={p.id} value={p.name}>
                      {p.name}{qty !== '' ? ` (Stock: ${qty})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
                {maxQty !== null && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">Available: {maxQty}</span>
                )}
              </label>
              <input
                type="number"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || '' })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${qtyExceedsStock ? 'border-red-400' : ''}`}
                required
                min="1"
                max={maxQty ?? undefined}
              />
              {qtyExceedsStock && (
                <p className="mt-1 text-xs text-red-600">
                  Cannot exceed available stock ({maxQty}).
                </p>
              )}
            </div>
          </div>

          {totalPrice > 0 && (
            <div className="flex items-center justify-between bg-blue-600 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-white">
                Unit Price: ₹{unitPrice.toFixed(2)} × {formData.quantity}
              </span>
              <span className="text-lg font-bold text-white">
                Total: ₹{totalPrice.toFixed(2)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button type="submit" disabled={isSubmitDisabled || saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving ? <><FiLoader className="w-4 h-4 animate-spin" />Saving...</> : <>{transfer ? 'Update' : 'Create'} Transfer</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
