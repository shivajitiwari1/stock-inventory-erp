'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiX } from 'react-icons/fi';

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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      setSuppliers(data.suppliers || data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      setSuppliers(suppliers.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete supplier:', error);
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
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
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{supplier.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{supplier.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{supplier.city}, {supplier.country}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => { setEditingSupplier(supplier); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 inline-block"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
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
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => { setShowModal(false); setEditingSupplier(null); }}
          onSave={(supplier: Supplier) => {
            if (editingSupplier) {
              setSuppliers(suppliers.map(s => s.id === supplier.id ? supplier : s));
            } else {
              setSuppliers([...suppliers, supplier]);
            }
            setShowModal(false);
          }}
        />
      )}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (error) {
      console.error('Failed to save supplier:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
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
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{supplier ? 'Update' : 'Add'} Supplier</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}