'use client';

import { useEffect, useState, useMemo } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  productName: string;
  sku: string;
  category: string;
  warehouseName: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  minQuantity: number;
  lastUpdated: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, prodRes, whRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/products'),
          fetch('/api/warehouses'),
        ]);
        const [invData, products, warehouses] = await Promise.all([
          invRes.json(), prodRes.json(), whRes.json(),
        ]);

        const enriched = (invData || []).map((item: any) => {
          const product = (products || []).find((p: any) => p.id === item.productId) || {};
          const warehouse = (warehouses || []).find((w: any) => w.id === item.warehouseId) || {};
          return {
            ...item,
            productName: product.name || 'Unknown Product',
            sku: product.sku || '-',
            category: product.category || 'Unknown',
            warehouseName: warehouse.name || 'Unknown Warehouse',
            minQuantity: product.minQuantity || 0,
          };
        });

        setInventory(enriched);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derived filter options
  const warehouses = useMemo(() => [...new Set(inventory.map(i => i.warehouseName))], [inventory]);
  const categories = useMemo(() => [...new Set(inventory.map(i => i.category))], [inventory]);

  // Filtered list
  const filtered = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = !search ||
        item.productName.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchWarehouse = !warehouseFilter || item.warehouseName === warehouseFilter;
      const matchCategory = !categoryFilter || item.category === categoryFilter;
      const status = item.availableQuantity === 0 ? 'out'
        : item.availableQuantity <= item.minQuantity ? 'low' : 'good';
      const matchStatus = !statusFilter || status === statusFilter;
      return matchSearch && matchWarehouse && matchCategory && matchStatus;
    });
  }, [inventory, search, warehouseFilter, categoryFilter, statusFilter]);

  // Summary stats (from filtered list)
  const totalQty = filtered.reduce((s, i) => s + i.totalQuantity, 0);
  const availableQty = filtered.reduce((s, i) => s + i.availableQuantity, 0);

  // Actual last updated from data
  const lastUpdated = inventory.length
    ? new Date(Math.max(...inventory.map(i => new Date(i.lastUpdated || 0).getTime())))
        .toLocaleDateString()
    : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-2 text-gray-600">Monitor stock levels across all warehouses</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg text-sm shrink-0">
          Last Updated: {lastUpdated}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Showing Items</p>
          <p className="text-4xl font-bold mt-2">{filtered.length}</p>
          <p className="text-blue-200 text-xs mt-1">of {inventory.length} total</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Total Quantity</p>
          <p className="text-4xl font-bold mt-2">{totalQty}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
          <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">Available Quantity</p>
          <p className="text-4xl font-bold mt-2">{availableQty}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* Warehouse filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400 w-4 h-4 shrink-0" />
            <select
              value={warehouseFilter}
              onChange={e => setWarehouseFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="good">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          {/* Clear filters */}
          {(search || warehouseFilter || categoryFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setWarehouseFilter(''); setCategoryFilter(''); setStatusFilter(''); }}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Inventory Details</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" />In Stock</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full inline-block" />Low Stock</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />Out of Stock</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">SKU</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Warehouse</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Available</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Reserved</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Min Qty</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Updated</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    No inventory records found{search || warehouseFilter || categoryFilter || statusFilter ? ' for the selected filters' : ''}.
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const status = item.availableQuantity === 0 ? 'out'
                  : item.availableQuantity <= item.minQuantity ? 'low' : 'good';
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{item.sku}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.warehouseName}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{item.availableQuantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">{item.reservedQuantity || 0}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{item.totalQuantity}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">{item.minQuantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        status === 'good' ? 'bg-green-100 text-green-700' :
                        status === 'low'  ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                      }`}>
                        {status === 'good' ? 'In Stock' : status === 'low' ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer row count */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Showing {filtered.length} of {inventory.length} records
          </div>
        )}
      </div>
    </div>
  );
}
