'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

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
}

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trRes, whRes] = await Promise.all([
          fetch('/api/stock-transfers'),
          fetch('/api/warehouses'),
        ]);
        const [trData, whData] = await Promise.all([trRes.json(), whRes.json()]);
        setTransfers(trData || []);
        setWarehouses(whData || []);
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
    try {
      await fetch(`/api/stock-transfers/${id}`, { method: 'DELETE' });
      setTransfers(transfers.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete transfer:', error);
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Transfer ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
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
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{transfer.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{warehouseName(transfer.fromWarehouseId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{warehouseName(transfer.toWarehouseId)}</td>
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(transfer.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2 text-center">
                    <button
                      onClick={() => { setEditingTransfer(transfer); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 inline-block"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transfer.id)}
                      className="text-red-600 hover:text-red-800 inline-block"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
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
          onClose={() => { setShowModal(false); setEditingTransfer(null); }}
          onSave={(saved: Transfer) => {
            if (editingTransfer) {
              setTransfers(transfers.map((t) => (t.id === saved.id ? saved : t)));
            } else {
              setTransfers([...transfers, saved]);
            }
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function TransferModal({ transfer, warehouses, onClose, onSave }: any) {
  const [formData, setFormData] = useState(transfer || {
    fromWarehouseId: '',
    toWarehouseId: '',
    productName: '',
    quantity: 0,
    status: 'PENDING',
  });

  const sameWarehouse = formData.fromWarehouseId && formData.toWarehouseId &&
    formData.fromWarehouseId === formData.toWarehouseId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sameWarehouse) return;
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-6">{transfer ? 'Edit Transfer' : 'New Stock Transfer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
              <select
                value={formData.fromWarehouseId}
                onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
              <select
                value={formData.toWarehouseId}
                onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
          </div>
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
          {sameWarehouse && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Source and destination warehouse cannot be the same.
            </p>
          )}
          <div className="flex space-x-2">
            <button type="submit" disabled={!!sameWarehouse}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
              {transfer ? 'Update' : 'Create'} Transfer
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
