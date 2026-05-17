'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiArchive, FiRefreshCw } from 'react-icons/fi';

interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager: string;
  capacity: number;
  currentUsage: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  address?: string;
  phone?: string;
  archivedAt?: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      const data = await response.json();
      setWarehouses(data.warehouses || data || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = await res.json();
        setWarehouses(warehouses.map(w => w.id === id ? updated : w));
      }
    } catch (error) {
      console.error('Failed to archive warehouse:', error);
    } finally {
      setArchiveTarget(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWarehouses(warehouses.map(w => w.id === id ? updated : w));
      }
    } catch (error) {
      console.error('Failed to restore warehouse:', error);
    }
  };

  const filteredWarehouses = warehouses
    .filter(w => showArchived ? true : w.status !== 'ARCHIVED')
    .filter(w =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === 'ARCHIVED' && b.status !== 'ARCHIVED') return 1;
      if (a.status !== 'ARCHIVED' && b.status === 'ARCHIVED') return -1;
      return 0;
    });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-2 text-gray-600">Manage warehouse locations, capacity, and stock storage.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
            <div
              onClick={() => setShowArchived(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showArchived ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showArchived ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            Show Archived
          </label>
          <button
            onClick={() => { setEditingWarehouse(null); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Manager</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWarehouses.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No warehouses found.</td></tr>
              )}
              {filteredWarehouses.map((warehouse: any) => {
                const isArchived = warehouse.status === 'ARCHIVED';
                const usagePercent = warehouse.capacity > 0 ? (warehouse.currentUsage / warehouse.capacity) * 100 : 0;
                return (
                  <tr key={warehouse.id} className={`hover:bg-gray-50 ${isArchived ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{warehouse.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{warehouse.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{warehouse.manager}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{warehouse.capacity}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        <span className="text-gray-900">{warehouse.currentUsage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        warehouse.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        warehouse.status === 'ARCHIVED' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {warehouse.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {isArchived ? (
                        <button
                          onClick={() => handleRestore(warehouse.id)}
                          title="Restore warehouse"
                          className="text-green-600 hover:text-green-800 inline-block"
                        >
                          <FiRefreshCw className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingWarehouse(warehouse); setShowModal(true); }}
                            className="text-blue-600 hover:text-blue-800 inline-block"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setArchiveTarget(warehouse.id)}
                            className="text-red-600 hover:text-red-800 inline-block"
                            title="Archive warehouse"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <WarehouseModal
          warehouse={editingWarehouse}
          onClose={() => { setShowModal(false); setEditingWarehouse(null); }}
          onSave={(warehouse: Warehouse) => {
            if (editingWarehouse) {
              setWarehouses(warehouses.map(w => w.id === warehouse.id ? warehouse : w));
            } else {
              setWarehouses([...warehouses, warehouse]);
            }
            setShowModal(false);
          }}
        />
      )}
      {archiveTarget && (
        <ArchiveConfirmModal
          onConfirm={() => handleArchive(archiveTarget)}
          onCancel={() => setArchiveTarget(null)}
        />
      )}
    </div>
  );
}

function ArchiveConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Archive Warehouse</h2>
          <button type="button" onClick={onCancel} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Archive this warehouse? It will be hidden from the active list but all stock data is preserved.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 font-medium"
          >
            Archive
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function WarehouseModal({ warehouse, onClose, onSave }: any) {
  const [formData, setFormData] = useState(warehouse || {
    name: '',
    location: '',
    manager: '',
    address: '',
    phone: '',
    capacity: 0,
    currentUsage: 0,
    status: 'ACTIVE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = warehouse ? `/api/warehouses/${warehouse.id}` : '/api/warehouses';
      const method = warehouse ? 'PUT' : 'POST';
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
      console.error('Failed to save warehouse:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{warehouse ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Warehouse Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            <input type="text" placeholder="Manager Name" value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            <input type="number" placeholder="Current Usage" value={formData.currentUsage} onChange={(e) => setFormData({ ...formData, currentUsage: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <textarea placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <div className="flex space-x-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{warehouse ? 'Update' : 'Add'} Warehouse</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
