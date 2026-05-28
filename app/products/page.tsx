'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/components/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  unitType: string;
  price: number;
  quantity?: number;
  image: string;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
}

const CACHE_KEY = 'erp-products';

function readCache<T>(): T[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(list: T[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

export default function ProductsPage() {
  const { canDo } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache<Product>();
    if (cached) {
      setProducts(cached);
      setLoading(false);
      Promise.all([fetch('/api/inventory'), fetch('/api/warehouses')])
        .then(([invRes, whRes]) => Promise.all([invRes.json(), whRes.json()]))
        .then(([invData, whData]) => { setInventory(invData || []); setWarehouses(whData || []); })
        .catch(err => console.error('Failed to fetch data:', err));
    } else {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, invRes, whRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/inventory'),
        fetch('/api/warehouses'),
      ]);
      const [prodData, invData, whData] = await Promise.all([prodRes.json(), invRes.json(), whRes.json()]);
      const list = prodData || [];
      setProducts(list);
      writeCache(list);
      setInventory(invData || []);
      setWarehouses(whData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (product: Product) => {
    const rows = inventory.filter((i: any) => i.productId === product.id);
    const available = rows.reduce((s: number, i: any) => s + (i.availableQuantity || 0), 0);
    if (available === 0) return 'out';
    if (product.minQuantity > 0 && available <= product.minQuantity) return 'low';
    return 'healthy';
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setError(null);
    setDeletingId(id);
    const previous = products;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    writeCache(updated);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setProducts(previous);
      writeCache(previous);
      setError('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-slate-100">Product Management</h1>
        {canDo('products', 'add') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Product</span>
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

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Product</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase hidden md:table-cell">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase hidden md:table-cell">Min Qty</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredProducts.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No products found.</td></tr>
              )}
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-blue-600 font-semibold">{product.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-slate-100">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 dark:text-slate-400">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-slate-100 hidden md:table-cell">₹{(product.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-slate-100 hidden md:table-cell">{product.minQuantity || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    {(() => {
                      const s = getStockStatus(product);
                      return (
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          s === 'out' ? 'bg-red-100 text-red-700' :
                          s === 'low' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {s === 'out' ? 'Out of Stock' : s === 'low' ? 'Low Stock' : 'In Stock'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {canDo('products', 'edit') && (
                      <button onClick={() => setEditingProduct(product)} className="text-blue-600 hover:text-blue-800">
                        <FiEdit className="w-4 h-4" />
                      </button>
                    )}
                    {canDo('products', 'delete') && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={!!deletingId}
                        className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === product.id
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

      {(showAddModal || editingProduct) && (
        <ProductModal
          product={editingProduct}
          warehouses={warehouses.filter((w: any) => w.status !== 'ARCHIVED')}
          onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
          onSave={saved => {
            const isNew = !editingProduct;
            setProducts(prev => {
              const updated = isNew
                ? [...prev, saved]
                : prev.map(i => i.id === saved.id ? saved : i);
              writeCache(updated);
              return updated;
            });
            if (isNew) {
              // Bust stock management and inventory caches so new product appears immediately
              try {
                sessionStorage.removeItem('erp-stock-management');
                sessionStorage.removeItem('erp-inventory');
              } catch {}
            }
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, warehouses, onClose, onSave }: { product?: Product | null; warehouses: any[]; onClose: () => void; onSave: (p: Product) => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    unitType: product?.unitType || 'PCS',
    price: product ? product.price.toString() : '',
    minQuantity: product?.minQuantity ? product.minQuantity.toString() : '',
  });
  const [warehouseId, setWarehouseId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          minQuantity: parseInt(formData.minQuantity) || 0,
          warehouseId: warehouseId || undefined,
        }),
      });
      if (response.ok) onSave(await response.json());
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={inputCls} required placeholder="Product name" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unit Type</label>
              <select value={formData.unitType} onChange={e => setFormData({ ...formData, unitType: e.target.value })}
                className={inputCls}>
                <option value="PCS">PCS</option>
                <option value="KG">KG</option>
                <option value="BOX">BOX</option>
                <option value="LTR">LTR</option>
                <option value="MTR">MTR</option>
                <option value="BAG">BAG</option>
                <option value="TON">TON</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Min Quantity</label>
              <input type="number" min="0" value={formData.minQuantity}
                onChange={e => setFormData({ ...formData, minQuantity: e.target.value })}
                className={inputCls} placeholder="e.g. 10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Price (₹)</label>
            <input type="number" step="0.01" min="0" value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              className={inputCls} placeholder="e.g. 500.00" />
          </div>

          {!product && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Warehouse</label>
              <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} className={inputCls}>
                <option value="">All Warehouses</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className={inputCls} rows={3} placeholder="Optional description" />
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-medium">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
