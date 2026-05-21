'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { FiEdit, FiX } from 'react-icons/fi';

interface AttributeQuantityRule {
  key: string;
  value: string;
  quantity: number;
}

interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  productName: string;
  sku: string;
  category: string;
  warehouseName: string;
  warehouseArchived: boolean;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  minQuantity: number;
  attributeQuantityRules: AttributeQuantityRule[];
}

const CACHE_KEY = 'erp-stock-management';

function readCache(): InventoryItem[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(list: InventoryItem[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch {}
}

export default function StockManagementPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const { canDo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showArchivedWh, setShowArchivedWh] = useState(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setInventory(cached);
      setLoading(false);
      return;
    }
    fetchInventory();
  }, []);

  const enrich = (raw: any[], products: any[], warehouses: any[]): InventoryItem[] =>
    raw.map((item) => {
      const product = products.find((p: any) => p.id === item.productId) || {};
      const warehouse = warehouses.find((w: any) => w.id === item.warehouseId) || {};
      return {
        id: item.id,
        productId: item.productId,
        warehouseId: item.warehouseId,
        totalQuantity: item.totalQuantity || 0,
        availableQuantity: item.availableQuantity || 0,
        reservedQuantity: item.reservedQuantity || 0,
        damagedQuantity: item.damagedQuantity || 0,
        lostQuantity: item.lostQuantity || 0,
        productName: product.name || item.productId,
        sku: product.sku || '-',
        category: product.category || '-',
        warehouseName: warehouse.name || item.warehouseId,
        warehouseArchived: warehouse.status === 'ARCHIVED',
        minQuantity: product.minQuantity || 0,
        attributeQuantityRules: product.attributeQuantityRules || [],
      };
    });

  const fetchInventory = async () => {
    try {
      const [invRes, prodRes, whRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/products'),
        fetch('/api/warehouses'),
      ]);
      const [invData, products, warehouses] = await Promise.all([
        invRes.json(), prodRes.json(), whRes.json(),
      ]);
      const enrichedList = enrich(invData || [], products || [], warehouses || []);
      writeCache(enrichedList);
      setInventory(enrichedList);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStock = inventory.reduce((s, i) => s + i.totalQuantity, 0);
  const availableStock = inventory.reduce((s, i) => s + i.availableQuantity, 0);
  const reservedStock = inventory.reduce((s, i) => s + i.reservedQuantity, 0);
  const lowStockCount = inventory.filter(i => i.availableQuantity > 0 && i.availableQuantity <= i.minQuantity).length;
  const outOfStockCount = inventory.filter(i => i.availableQuantity === 0).length;

  const displayInventory = showArchivedWh
    ? inventory
    : inventory.filter(item => !item.warehouseArchived);

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
          <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
          <p className="mt-2 text-gray-600">Manage stock levels and monitor inventory status across warehouses.</p>
        </div>
        <label
          onClick={() => setShowArchivedWh(v => !v)}
          className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 shrink-0"
        >
          <div className={`relative w-10 h-5 rounded-full transition-colors ${showArchivedWh ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showArchivedWh ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          Show Archived
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Items', value: inventory.length, color: 'text-gray-900' },
          { label: 'Total Stock', value: totalStock, color: 'text-gray-900' },
          { label: 'Available', value: availableStock, color: 'text-green-600' },
          { label: 'Reserved', value: reservedStock, color: 'text-blue-600' },
          { label: 'Low / Out', value: lowStockCount + outOfStockCount, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-3 text-3xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Inventory table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Inventory Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Warehouse</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Available</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Reserved</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Min Qty</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayInventory.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">No inventory records found.</td></tr>
              ) : displayInventory.map((item) => {
                const status = item.availableQuantity === 0 ? 'out'
                  : item.availableQuantity <= item.minQuantity ? 'low' : 'healthy';
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.warehouseArchived ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{item.warehouseName}</span>
                        {item.warehouseArchived && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700">
                            ARCHIVED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{item.availableQuantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 hidden md:table-cell">{item.reservedQuantity}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{item.totalQuantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500 hidden md:table-cell">{item.minQuantity}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        status === 'out' ? 'bg-red-100 text-red-700' :
                        status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'Healthy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {canDo('stock-management', 'edit') && (
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <StockAdjustmentModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            setInventory(prev => {
              const newList = prev.map(i => i.id === updated.id ? updated : i);
              writeCache(newList);
              return newList;
            });
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function StockAdjustmentModal({ item, onClose, onSave }: {
  item: InventoryItem;
  onClose: () => void;
  onSave: (updated: InventoryItem) => void;
}) {
  const [availableQuantity, setAvailable] = useState(item.availableQuantity);
  const [reservedQuantity, setReserved] = useState(item.reservedQuantity);
  const [variantQtys, setVariantQtys] = useState<AttributeQuantityRule[]>(
    item.attributeQuantityRules.map(r => ({ ...r }))
  );

  const hasVariants = variantQtys.length > 0;
  const variantTotal = variantQtys.reduce((s, v) => s + v.quantity, 0);
  const totalQuantity = availableQuantity + reservedQuantity;
  const variantMismatch = hasVariants && variantTotal !== availableQuantity;

  // Auto-distribute remaining qty proportionally across variants
  const autoBalance = () => {
    if (!hasVariants || availableQuantity === 0) return;
    const total = variantQtys.reduce((s, v) => s + v.quantity, 0) || variantQtys.length;
    let remaining = availableQuantity;
    const balanced = variantQtys.map((v, i) => {
      if (i === variantQtys.length - 1) return { ...v, quantity: remaining };
      const share = Math.round((v.quantity / total) * availableQuantity);
      remaining -= share;
      return { ...v, quantity: share };
    });
    setVariantQtys(balanced);
  };

  const updateVariant = (i: number, qty: number) => {
    const updated = [...variantQtys];
    updated[i] = { ...updated[i], quantity: Math.max(0, qty) };
    setVariantQtys(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invRes = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          warehouseId: item.warehouseId,
          availableQuantity,
          reservedQuantity,
          totalQuantity,
          damagedQuantity: item.damagedQuantity,
          lostQuantity: item.lostQuantity,
        }),
      });

      if (!invRes.ok) return;
      const saved = await invRes.json();

      if (hasVariants) {
        await fetch(`/api/products/${item.productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attributeQuantityRules: variantQtys }),
        });
      }

      // Build the fully updated enriched item — keep all non-inventory fields from the original
      onSave({
        ...item,
        availableQuantity: saved.availableQuantity,
        reservedQuantity: saved.reservedQuantity,
        totalQuantity: saved.totalQuantity,
        damagedQuantity: saved.damagedQuantity,
        lostQuantity: saved.lostQuantity,
        attributeQuantityRules: variantQtys,
      });
    } catch (error) {
      console.error('Failed to update inventory:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold">Adjust Stock</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">{item.productName} — {item.warehouseName}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Qty</label>
              <input type="number" value={availableQuantity} min="0"
                onChange={e => setAvailable(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserved Qty</label>
              <input type="number" value={reservedQuantity} min="0"
                onChange={e => setReserved(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-2.5 rounded-lg flex justify-between text-sm font-medium">
            <span className="text-gray-500">Total Quantity</span>
            <span className="text-gray-900">{totalQuantity}</span>
          </div>

          {hasVariants && (
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-purple-800">Variant Distribution</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    variantMismatch ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {variantMismatch
                      ? `${variantTotal} ≠ ${availableQuantity} available`
                      : `✓ Balanced (${variantTotal})`}
                  </span>
                  {variantMismatch && (
                    <button type="button" onClick={autoBalance}
                      className="text-xs text-purple-700 underline hover:text-purple-900">
                      Auto-balance
                    </button>
                  )}
                </div>
              </div>

              {variantQtys.map((rule, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-purple-700 font-medium w-36 shrink-0">
                    {rule.key}: {rule.value}
                  </span>
                  <input type="number" value={rule.quantity} min="0"
                    onChange={e => updateVariant(i, parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-sm" />
                  <span className="text-xs text-gray-400 w-10 text-right shrink-0">
                    {availableQuantity > 0 ? `${Math.round((rule.quantity / availableQuantity) * 100)}%` : '0%'}
                  </span>
                </div>
              ))}
              <p className="text-xs text-purple-500">
                Variant quantities must sum to Available ({availableQuantity}). Use Auto-balance to distribute proportionally.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={hasVariants && variantMismatch}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              Update Stock
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
