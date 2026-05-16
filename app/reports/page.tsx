'use client';

import { useEffect, useState } from 'react';

interface ReportRow {
  warehouseId: string;
  warehouseName: string;
  value: number;
  itemCount: number;
}

export default function ReportsPage() {
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [warehouseRows, setWarehouseRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

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

        const productMap: Record<string, any> = Object.fromEntries(
          (products || []).map((p: any) => [p.id, p])
        );

        let value = 0;
        let lowStock = 0;
        let outOfStock = 0;

        for (const item of inventory || []) {
          const product = productMap[item.productId] || {};
          value += (product.price || 0) * (item.availableQuantity || 0);
          if (item.availableQuantity === 0) {
            outOfStock++;
          } else if (product.minQuantity > 0 && item.availableQuantity <= product.minQuantity) {
            lowStock++;
          }
        }

        const rows: ReportRow[] = (warehouses || []).map((wh: any) => {
          const whItems = (inventory || []).filter((i: any) => i.warehouseId === wh.id);
          const whValue = whItems.reduce((sum: number, i: any) => {
            const product = productMap[i.productId] || {};
            return sum + (product.price || 0) * (i.availableQuantity || 0);
          }, 0);
          return {
            warehouseId: wh.id,
            warehouseName: wh.name,
            value: whValue,
            itemCount: whItems.length,
          };
        });

        setTotalValue(value);
        setLowStockCount(lowStock);
        setOutOfStockCount(outOfStock);
        setWarehouseRows(rows);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">View inventory reports with valuation, low-stock alerts, and warehouse performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Inventory Valuation</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="mt-3 text-3xl font-semibold text-yellow-600">{lowStockCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock Items</p>
          <p className="mt-3 text-3xl font-semibold text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Inventory Value by Warehouse</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Warehouse</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Value</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {warehouseRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400">No warehouse data found.</td>
                </tr>
              ) : warehouseRows.map((row) => (
                <tr key={row.warehouseId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.warehouseName}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">
                    ₹{row.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{row.itemCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
