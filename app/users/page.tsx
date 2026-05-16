'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import type { UserPermissions } from '@/components/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'STAFF';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastLogin: string;
  permissions?: UserPermissions;
}

// Pages and which actions they support
const PAGE_CONFIG = [
  { key: 'dashboard',        label: 'Dashboard',          actions: false },
  { key: 'products',         label: 'Products',           actions: true  },
  { key: 'inventory',        label: 'Inventory',          actions: false },
  { key: 'stock-management', label: 'Stock Management',   actions: true  },
  { key: 'stock-transfers',  label: 'Stock Transfers',    actions: true  },
  { key: 'alerts',           label: 'Low Stock Alerts',   actions: false },
  { key: 'reports',          label: 'Reports',            actions: false },
  { key: 'suppliers',        label: 'Suppliers',          actions: true  },
  { key: 'supply-receipts',  label: 'Supply Receipts',    actions: true  },
  { key: 'stock-issues',     label: 'Stock Issues',       actions: true  },
  { key: 'contractors',      label: 'Contractors',        actions: true  },
  { key: 'warehouses',       label: 'Warehouses',         actions: true  },
  { key: 'users',            label: 'User Management',    actions: true  },
  { key: 'audit-logs',       label: 'Audit & Logs',       actions: false },
];

const defaultPermissions = (role: string): UserPermissions => {
  if (role === 'ADMIN') return {};
  if (role === 'INVENTORY_MANAGER') {
    return {
      'dashboard':        { view: true },
      'products':         { view: true, add: true,  edit: true,  delete: false },
      'inventory':        { view: true },
      'stock-management': { view: true, add: true,  edit: true,  delete: false },
      'stock-transfers':  { view: true, add: true,  edit: true,  delete: false },
      'alerts':           { view: true },
      'reports':          { view: true },
      'suppliers':        { view: true, add: true,  edit: true,  delete: false },
      'supply-receipts':  { view: true, add: true,  edit: true,  delete: false },
      'stock-issues':     { view: true, add: true,  edit: true,  delete: false },
      'contractors':      { view: true, add: true,  edit: true,  delete: false },
      'warehouses':       { view: true, add: true,  edit: true,  delete: false },
      'users':            { view: false },
      'audit-logs':       { view: false },
    };
  }
  // STAFF
  return {
    'dashboard':        { view: true },
    'products':         { view: true,  add: false, edit: false, delete: false },
    'inventory':        { view: true },
    'stock-management': { view: true,  add: true,  edit: false, delete: false },
    'stock-transfers':  { view: false },
    'alerts':           { view: true },
    'reports':          { view: false },
    'suppliers':        { view: false },
    'supply-receipts':  { view: false },
    'stock-issues':     { view: true,  add: true,  edit: true,  delete: false },
    'contractors':      { view: false },
    'warehouses':       { view: false },
    'users':            { view: false },
    'audit-logs':       { view: false },
  };
};

const roleBadge = (role: string) => {
  if (role === 'ADMIN') return 'bg-red-100 text-red-700';
  if (role === 'INVENTORY_MANAGER') return 'bg-blue-100 text-blue-700';
  return 'bg-green-100 text-green-700';
};

const formatRole = (role: string) =>
  role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : role.charAt(0) + role.slice(1).toLowerCase();

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">User Management</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Manage users and their page-level access privileges</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Admin Users', role: 'ADMIN', color: 'text-red-600' },
          { label: 'Inventory Managers', role: 'INVENTORY_MANAGER', color: 'text-blue-600' },
          { label: 'Staff Users', role: 'STAFF', color: 'text-green-600' },
        ].map(({ label, role, color }) => (
          <div key={role} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
            <p className={`mt-3 text-3xl font-semibold ${color}`}>
              {users.filter(u => u.role === role).length}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No users found.</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleBadge(u.role)}`}>{formatRole(u.role)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{new Date(u.lastLogin).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button onClick={() => { setEditingUser(u); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800">
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
        <UserModal
          user={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSave={saved => {
            setUsers(prev => editingUser ? prev.map(u => u.id === saved.id ? saved : u) : [...prev, saved]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

function UserModal({ user, onClose, onSave }: { user: User | null; onClose: () => void; onSave: (u: User) => void }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'STAFF',
    status: user?.status || 'ACTIVE',
    permissions: user?.permissions || defaultPermissions(user?.role || 'STAFF'),
  });
  const [saving, setSaving] = useState(false);

  // When role changes to ADMIN, clear permissions (not needed); otherwise set defaults
  const handleRoleChange = (role: string) => {
    setForm(f => ({
      ...f,
      role: role as User['role'],
      permissions: role === 'ADMIN' ? {} : defaultPermissions(role),
    }));
  };

  const togglePerm = (page: string, field: 'view' | 'add' | 'edit' | 'delete') => {
    setForm(f => {
      const current = f.permissions[page] || { view: false };
      const updated = { ...current, [field]: !current[field as keyof typeof current] };
      // If view is turned off, also turn off all actions
      if (field === 'view' && !updated.view) {
        updated.add = false;
        updated.edit = false;
        updated.delete = false;
      }
      // If an action is turned on, ensure view is on
      if (field !== 'view' && updated[field as keyof typeof updated]) {
        updated.view = true;
      }
      return { ...f, permissions: { ...f.permissions, [page]: updated } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) onSave(await res.json());
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = form.role === 'ADMIN';

  const Checkbox = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mx-auto
        ${disabled ? 'opacity-30 cursor-not-allowed border-gray-300' :
          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-slate-500 hover:border-blue-400'}`}
    >
      {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-slate-100">{user ? 'Edit User' : 'Add User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role *</label>
              <select value={form.role} onChange={e => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100">
                <option value="STAFF">Staff</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as User['status'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Permission matrix */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Page Access & Privileges</h3>
              {isAdmin && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Admin has full access to everything</span>
              )}
            </div>
            <div className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700">
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-slate-300">Page</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-gray-600 dark:text-slate-300 w-16">View</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-gray-600 dark:text-slate-300 w-16">Add</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-gray-600 dark:text-slate-300 w-16">Edit</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-gray-600 dark:text-slate-300 w-16">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {PAGE_CONFIG.map(({ key, label, actions }, idx) => {
                    const perm = form.permissions[key] || { view: false };
                    const rowBg = idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-slate-700/40';
                    return (
                      <tr key={key} className={rowBg}>
                        <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium">{label}</td>
                        <td className="px-4 py-2.5">
                          <Checkbox
                            checked={isAdmin || !!perm.view}
                            onChange={() => !isAdmin && togglePerm(key, 'view')}
                            disabled={isAdmin}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          {actions ? (
                            <Checkbox
                              checked={isAdmin || !!perm.add}
                              onChange={() => !isAdmin && togglePerm(key, 'add')}
                              disabled={isAdmin || !perm.view}
                            />
                          ) : <span className="text-gray-300 text-xs text-center block">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {actions ? (
                            <Checkbox
                              checked={isAdmin || !!perm.edit}
                              onChange={() => !isAdmin && togglePerm(key, 'edit')}
                              disabled={isAdmin || !perm.view}
                            />
                          ) : <span className="text-gray-300 text-xs text-center block">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {actions ? (
                            <Checkbox
                              checked={isAdmin || !!perm.delete}
                              onChange={() => !isAdmin && togglePerm(key, 'delete')}
                              disabled={isAdmin || !perm.view}
                            />
                          ) : <span className="text-gray-300 text-xs text-center block">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex space-x-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Saving...' : user ? 'Update User' : 'Add User'}
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

export default UsersPage;
