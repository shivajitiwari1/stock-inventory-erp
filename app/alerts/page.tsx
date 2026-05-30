'use client';

import { useEffect, useState, useRef } from 'react';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';

interface AlertItem {
  id: string;
  productId: string;
  warehouseId: string;
  productName: string;
  warehouseName: string;
  availableQuantity: number;
  minQuantity: number;
}

function MinQtyEdit({ item, onUpdated }: { item: AlertItem; onUpdated: (productId: string, newMin: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.minQuantity.toString());
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    const newMin = parseInt(value) || 0;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${item.productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minQuantity: newMin }),
      });
      if (res.ok) {
        onUpdated(item.productId, newMin);
        setEditing(false);
      }
    } catch {}
    setSaving(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <span>{item.minQuantity}</span>
        <button onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="text-gray-400 hover:text-blue-600 ml-1">
          <FiEdit2 className="w-3 h-3" />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <input ref={inputRef} type="number" min="0" value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="w-16 px-1 py-0.5 border border-blue-400 rounded text-right text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-800 disabled:opacity-40">
        <FiCheck className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => { setEditing(false); setValue(item.minQuantity.toString()); }} className="text-gray-400 hover:text-red-600">
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AlertsPage() {
  const [lowStock, setLowStock] = useState<AlertItem[]>([]);
  const [outOfStock, setOutOfStock] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleMinQtyUpdate = (productId: string, newMin: number) => {
    const update = (list: AlertItem[]) => list.map(i => i.productId === productId ? { ...i, minQuantity: newMin } : i);
    setLowStock(prev => update(prev));
    setOutOfStock(prev => update(prev));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, prodRes, whRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/products'),
          fetch('/api/warehouses'),
        ]);
        const [inventory, products, warehouses] = await Promise.all([
          invRes.json(),
          prodRes.json(),
          whRes.json(),
        ]);

        const enriched = (inventory || []).map((item: any) => {
          const product = (products || []).find((p: any) => p.id === item.productId) || {};
          const warehouse = (warehouses || []).find((w: any) => w.id === item.warehouseId) || {};
          return {
            ...item,
            productName: product.name || item.productId,
            warehouseName: warehouse.name || item.warehouseId,
            minQuantity: product.minQuantity || 0,
          };
        });

        setLowStock(enriched.filter((item: any) =>
          item.minQuantity > 0 && item.availableQuantity > 0 && item.availableQuantity <= item.minQuantity
        ));
        setOutOfStock(enriched.filter((item: any) => item.availableQuantity === 0));
      } catch (error) {
        console.error('Failed to fetch alerts data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <p className="mt-2 text-gray-600">Track low stock and out of stock conditions across your warehouses.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="mt-3 text-3xl font-semibold text-yellow-600">{lowStock.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="mt-3 text-3xl font-semibold text-red-600">{outOfStock.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Alert Items</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{lowStock.length + outOfStock.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Low Stock Alerts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Warehouse</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Available</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Qty</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStock.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-gray-400">No low stock alerts.</td></tr>
                ) : lowStock.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{item.warehouseName}</td>
                    <td className="px-6 py-4 text-sm text-right text-yellow-600 font-semibold">{item.availableQuantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      <MinQtyEdit item={item} onUpdated={handleMinQtyUpdate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Out of Stock Alerts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Warehouse</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outOfStock.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-400">No out of stock items.</td></tr>
                ) : outOfStock.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{item.warehouseName}</td>
                    <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">Out of Stock</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
