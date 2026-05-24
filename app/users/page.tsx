'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiShield, FiUsers, FiToggleLeft, FiToggleRight, FiX, FiLoader } from 'react-icons/fi';
import { useAuth, type UserPermissions } from '@/components/AuthContext';

interface Role {
  id: string;
  name: string;
  key: string;
  description: string;
  isSystem: boolean;
  isAdmin: boolean;
  permissions: UserPermissions;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastLogin: string;
  permissions?: UserPermissions;
}

const PAGE_CONFIG = [
  { key: 'dashboard',        label: 'Dashboard',        actions: false },
  { key: 'products',         label: 'Products',          actions: true  },
  { key: 'inventory',        label: 'Inventory',         actions: false },
  { key: 'stock-management', label: 'Stock Management',  actions: true  },
  { key: 'stock-transfers',  label: 'Stock Transfers',   actions: true  },
  { key: 'alerts',           label: 'Low Stock Alerts',  actions: false },
  { key: 'reports',          label: 'Reports',           actions: false },
  { key: 'suppliers',        label: 'Suppliers',         actions: true  },
  { key: 'supply-receipts',  label: 'Supply Receipts',   actions: true  },
  { key: 'stock-issues',     label: 'Stock Issues',      actions: true  },
  { key: 'contractors',      label: 'Contractors',       actions: true  },
  { key: 'warehouses',       label: 'Warehouses',        actions: true  },
  { key: 'users',            label: 'User Management',   actions: true  },
  { key: 'audit-logs',       label: 'Audit & Logs',      actions: false },
];

const emptyPermissions = (): UserPermissions =>
  Object.fromEntries(PAGE_CONFIG.map(p => [p.key, { view: false, ...(p.actions ? { add: false, edit: false, delete: false } : {}) }]));

const USERS_CACHE_KEY = 'erp-users';
const ROLES_CACHE_KEY = 'erp-roles';

function readCache<T>(key: string): T[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(key: string, list: T[]) {
  try { sessionStorage.setItem(key, JSON.stringify(list)); } catch {}
}

const roleBadge = (role: string) => {
  if (role === 'ADMIN') return 'bg-red-100 text-red-700';
  if (role === 'INVENTORY_MANAGER') return 'bg-blue-100 text-blue-700';
  if (role === 'STAFF') return 'bg-green-100 text-green-700';
  return 'bg-purple-100 text-purple-700';
};

// ─── Main page ───────────────────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cachedUsers = readCache<User>(USERS_CACHE_KEY);
    const cachedRoles = readCache<Role>(ROLES_CACHE_KEY);
    if (cachedUsers && cachedRoles) {
      setUsers(cachedUsers);
      setRoles(cachedRoles);
      setLoading(false);
      return;
    }
    // fall back to API
    Promise.all([fetch('/api/users'), fetch('/api/roles')])
      .then(([uRes, rRes]) => Promise.all([uRes.json(), rRes.json()]))
      .then(([uData, rData]) => {
        const usersList = uData.users || [];
        const rolesList = Array.isArray(rData) ? rData : [];
        setUsers(usersList);
        setRoles(rolesList);
        writeCache(USERS_CACHE_KEY, usersList);
        writeCache(ROLES_CACHE_KEY, rolesList);
      })
      .catch(err => console.error('Failed to fetch data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    setError(null);
    setDeletingUserId(id);
    const previous = users;
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    writeCache(USERS_CACHE_KEY, updated);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setUsers(previous);
      writeCache(USERS_CACHE_KEY, previous);
      setError('Failed to delete user. Please try again.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (currentUser?.id === user.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, status: newStatus }),
      });
      if (res.ok) {
        const saved = await res.json();
        setUsers(prev => {
          const updated = prev.map(u => u.id === saved.id ? saved : u);
          writeCache(USERS_CACHE_KEY, updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    setError(null);
    setDeletingRoleId(id);
    const previous = roles;
    const updated = roles.filter(r => r.id !== id);
    setRoles(updated);
    writeCache(ROLES_CACHE_KEY, updated);
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Cannot delete this role');
      }
    } catch (e: any) {
      setRoles(previous);
      writeCache(ROLES_CACHE_KEY, previous);
      setError(e.message || 'Failed to delete role. Please try again.');
    } finally {
      setDeletingRoleId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleName = (key: string) => roles.find(r => r.key === key)?.name || key;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">User Management</h1>
          <p className="mt-1 text-gray-600 dark:text-slate-400">Manage users, roles, and access privileges</p>
        </div>
        <button
          onClick={() => tab === 'users' ? (setEditingUser(null), setShowUserModal(true)) : (setEditingRole(null), setShowRoleModal(true))}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>{tab === 'users' ? 'Add User' : 'Add Role'}</span>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'users' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}>
          <FiUsers className="w-4 h-4" /> Users
        </button>
        <button onClick={() => setTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'roles' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}>
          <FiShield className="w-4 h-4" /> Roles
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

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <>
          {/* Stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Total</p>
              <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-slate-100">{users.length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Active</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{users.filter(u => u.status === 'ACTIVE').length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Inactive</p>
              <p className="mt-2 text-3xl font-bold text-red-500">{users.filter(u => u.status === 'INACTIVE').length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Roles</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{roles.length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search users..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" />
            </div>
          </div>

          {/* Users table */}
          <div className="rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase hidden sm:table-cell">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase hidden md:table-cell">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase hidden md:table-cell">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No users found.</td></tr>
                  )}
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 hidden sm:table-cell">{u.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleBadge(u.role)}`}>{getRoleName(u.role)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm hidden md:table-cell">
                        {currentUser?.id === u.id ? (
                          <span title="Cannot deactivate your own account" className="flex items-center gap-1.5 opacity-40 cursor-not-allowed">
                            <FiToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-medium text-green-600">{u.status}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Click to deactivate' : 'Click to activate'}
                            className="flex items-center gap-1.5 group"
                          >
                            {u.status === 'ACTIVE'
                              ? <FiToggleRight className="w-5 h-5 text-green-500 group-hover:text-green-700" />
                              : <FiToggleLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />}
                            <span className={`text-xs font-medium ${u.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}`}>{u.status}</span>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 hidden md:table-cell">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => { setEditingUser(u); setShowUserModal(true); }} className="text-blue-600 hover:text-blue-800">
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={!!deletingUserId}
                          className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {deletingUserId === u.id
                            ? <FiLoader className="w-4 h-4 animate-spin" />
                            : <FiTrash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{role.name}</h3>
                    {role.isSystem && <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full">System</span>}
                    {role.isAdmin && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Full Access</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{role.description}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Key: <code className="font-mono">{role.key}</code> · Used by {users.filter(u => u.role === role.key).length} user(s)</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditingRole(role); setShowRoleModal(true); }}
                    className="text-blue-600 hover:text-blue-800 p-1">
                    <FiEdit className="w-4 h-4" />
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      disabled={!!deletingRoleId}
                      className="text-red-600 hover:text-red-800 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deletingRoleId === role.id
                        ? <FiLoader className="w-4 h-4 animate-spin" />
                        : <FiTrash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {roles.length === 0 && (
            <div className="text-center text-gray-400 py-10">No roles found.</div>
          )}
        </div>
      )}

      {/* Modals */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          roles={roles}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSave={saved => {
            setUsers(prev => {
              const updated = editingUser
                ? prev.map(u => u.id === saved.id ? saved : u)
                : [...prev, saved];
              writeCache(USERS_CACHE_KEY, updated);
              return updated;
            });
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
          onSave={saved => {
            setRoles(prev => {
              const updated = editingRole
                ? prev.map(r => r.id === saved.id ? saved : r)
                : [...prev, saved];
              writeCache(ROLES_CACHE_KEY, updated);
              return updated;
            });
            setShowRoleModal(false);
            setEditingRole(null);
          }}
        />
      )}
    </div>
  );
};

// ─── Permission matrix (shared by User and Role modals) ───────────────────────

function PermissionMatrix({ permissions, isAdmin, onChange }: {
  permissions: UserPermissions;
  isAdmin: boolean;
  onChange: (page: string, field: 'view' | 'add' | 'edit' | 'delete') => void;
}) {
  const Checkbox = ({ checked, onToggle, disabled }: { checked: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onToggle} disabled={disabled}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mx-auto
        ${disabled ? 'opacity-30 cursor-not-allowed border-gray-300' :
          checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-slate-500 hover:border-blue-400'}`}>
      {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
    </button>
  );

  return (
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
            const perm = permissions[key] || { view: false };
            return (
              <tr key={key} className={idx % 2 === 1 ? 'bg-gray-50 dark:bg-slate-700/40' : ''}>
                <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200 font-medium">{label}</td>
                <td className="px-4 py-2.5">
                  <Checkbox checked={isAdmin || !!perm.view} disabled={isAdmin}
                    onToggle={() => !isAdmin && onChange(key, 'view')} />
                </td>
                {(['add', 'edit', 'delete'] as const).map(action => (
                  <td key={action} className="px-4 py-2.5">
                    {actions
                      ? <Checkbox checked={isAdmin || !!(perm as any)[action]} disabled={isAdmin || !perm.view}
                          onToggle={() => !isAdmin && onChange(key, action)} />
                      : <span className="block text-center text-gray-300 text-xs">—</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

function UserModal({ user, roles, onClose, onSave }: { user: User | null; roles: Role[]; onClose: () => void; onSave: (u: User) => void }) {
  const defaultRole = roles.find(r => r.key === (user?.role || 'STAFF')) || roles[0];

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'STAFF',
    status: user?.status || 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    permissions: user?.permissions || (defaultRole ? { ...defaultRole.permissions } : emptyPermissions()),
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRoleChange = (key: string) => {
    const role = roles.find(r => r.key === key);
    setForm(f => ({ ...f, role: key, permissions: role ? { ...role.permissions } : emptyPermissions() }));
  };

  const togglePerm = (page: string, field: 'view' | 'add' | 'edit' | 'delete') => {
    setForm(f => {
      const perm = { ...(f.permissions[page] || { view: false }) };
      perm[field] = !perm[field];
      if (field === 'view' && !perm.view) { perm.add = false; perm.edit = false; perm.delete = false; }
      if (field !== 'view' && perm[field]) perm.view = true;
      return { ...f, permissions: { ...f.permissions, [page]: perm } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');

    // Validate password fields
    if (!user) {
      // New user — password required
      if (password.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setPwError('Passwords do not match.'); return; }
    } else if (password) {
      // Edit user — password optional, but if provided must be valid
      if (password.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setPwError('Passwords do not match.'); return; }
    }

    setSaving(true);
    try {
      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PUT' : 'POST';
      const payload = user
        ? { ...form, ...(password ? { newPassword: password } : {}) }
        : { ...form, password };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) onSave(await res.json());
      else {
        const err = await res.json();
        setPwError(err.error || 'Failed to save user.');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = roles.find(r => r.key === form.role)?.isAdmin ?? false;
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{user ? 'Edit User' : 'Add User'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role *</label>
              <select value={form.role} onChange={e => handleRoleChange(e.target.value)} className={inputCls}>
                {roles.map(r => <option key={r.key} value={r.key}>{r.name}</option>)}
              </select>
              {isAdmin && <p className="text-xs text-red-500 mt-1">Admin role has full access to everything</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })} className={inputCls}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {user ? 'New Password' : 'Password *'}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwError(''); }}
                required={!user}
                minLength={6}
                placeholder={user ? 'Leave blank to keep current password' : 'Min. 6 characters'}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {user ? 'Confirm New Password' : 'Confirm Password *'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setPwError(''); }}
                required={!user || !!password}
                placeholder="Repeat password"
                className={inputCls}
              />
            </div>
          </div>

          {pwError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {pwError}
            </p>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Page Access & Privileges</h3>
              <span className="text-xs text-gray-400">(auto-loaded from role, customisable per user)</span>
            </div>
            <PermissionMatrix permissions={form.permissions} isAdmin={isAdmin} onChange={togglePerm} />
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

// ─── Role Modal ───────────────────────────────────────────────────────────────

function RoleModal({ role, onClose, onSave }: { role: Role | null; onClose: () => void; onSave: (r: Role) => void }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions ? { ...role.permissions } : emptyPermissions(),
  });
  const [saving, setSaving] = useState(false);

  const togglePerm = (page: string, field: 'view' | 'add' | 'edit' | 'delete') => {
    setForm(f => {
      const perm = { ...(f.permissions[page] || { view: false }) };
      perm[field] = !perm[field];
      if (field === 'view' && !perm.view) { perm.add = false; perm.edit = false; perm.delete = false; }
      if (field !== 'view' && perm[field]) perm.view = true;
      return { ...f, permissions: { ...f.permissions, [page]: perm } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = role ? `/api/roles/${role.id}` : '/api/roles';
      const method = role ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) onSave(await res.json());
      else {
        const err = await res.json();
        alert(err.error || 'Failed to save role');
      }
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = role?.isAdmin ?? false;
  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{role ? 'Edit Role' : 'Add Custom Role'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                required disabled={role?.isSystem} className={inputCls} placeholder="e.g. Site Manager" />
              {!role && <p className="text-xs text-gray-400 mt-1">Key auto-generated from name</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className={inputCls} placeholder="Brief description of this role" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Default Permissions for this Role</h3>
              {isAdmin && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Admin — full access</span>}
            </div>
            <PermissionMatrix permissions={form.permissions} isAdmin={isAdmin} onChange={togglePerm} />
          </div>

          <div className="flex space-x-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
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
