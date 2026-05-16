'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiBell, FiInfo, FiAlertTriangle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/components/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  targetUserId: string;
  targetUserName: string;
  createdByName: string;
  createdAt: string;
  dismissedBy: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const TYPE_OPTIONS = [
  { value: 'info',    label: 'Info',    icon: FiInfo,          color: 'text-blue-600'  },
  { value: 'warning', label: 'Warning', icon: FiAlertTriangle, color: 'text-amber-500' },
  { value: 'success', label: 'Success', icon: FiCheckCircle,   color: 'text-green-600' },
  { value: 'danger',  label: 'Urgent',  icon: FiAlertCircle,   color: 'text-red-600'   },
];

const typeBadge = (type: string) => {
  const t = TYPE_OPTIONS.find(o => o.value === type) || TYPE_OPTIONS[0];
  const Icon = t.icon;
  return <span className={`flex items-center gap-1 text-xs font-semibold ${t.color}`}><Icon className="w-3 h-3" />{t.label}</span>;
};

export default function NotificationsPage() {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/notifications').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([notifs, usersData]) => {
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setUsers(usersData.users || []);
    }).catch(err => console.error('Failed to load:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">Notifications</h1>
          <p className="mt-1 text-gray-600 dark:text-slate-400">Send highlighted notifications to specific users or everyone</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shrink-0">
          <FiPlus className="w-4 h-4" />
          Send Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Total Sent</p>
          <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-slate-100">{notifications.length}</p>
        </div>
        {TYPE_OPTIONS.map(t => (
          <div key={t.value} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">{t.label}</p>
            <p className={`mt-2 text-3xl font-bold ${t.color}`}>{notifications.filter(n => n.type === t.value).length}</p>
          </div>
        ))}
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                {['Type', 'Title & Message', 'Target', 'Sent', 'Seen by', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <FiBell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No notifications sent yet.</p>
                  </td>
                </tr>
              )}
              {[...notifications].reverse().map(n => {
                const totalTargets = n.targetUserId === 'ALL' ? users.length : 1;
                return (
                  <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-5 py-4">{typeBadge(n.type)}</td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-slate-300">
                      {n.targetUserId === 'ALL' ? (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">Everyone</span>
                      ) : (
                        <span>{n.targetUserName}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-slate-400">
                      <p>{new Date(n.createdAt).toLocaleDateString('en-IN')}</p>
                      <p className="text-gray-400">{n.createdByName}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-slate-300">
                      <span className={`font-semibold ${n.dismissedBy.length >= totalTargets ? 'text-green-600' : 'text-amber-500'}`}>
                        {n.dismissedBy.length}
                      </span>
                      <span className="text-gray-400 text-xs"> / {totalTargets}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(n.id)} className="text-red-600 hover:text-red-800">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SendModal
          users={users}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onSend={notif => {
            setNotifications(prev => [...prev, notif]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function SendModal({ users, currentUser, onClose, onSend }: {
  users: User[];
  currentUser: any;
  onClose: () => void;
  onSend: (n: Notification) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'danger',
    targetUserId: 'ALL',
  });
  const [saving, setSaving] = useState(false);

  const targetUserName = form.targetUserId === 'ALL'
    ? 'Everyone'
    : users.find(u => u.id === form.targetUserId)?.name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          targetUserName,
          createdBy: currentUser?.id,
          createdByName: currentUser?.name,
        }),
      });
      if (res.ok) onSend(await res.json());
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-5 text-gray-900 dark:text-slate-100">Send Notification</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Target *</label>
            <select value={form.targetUserId} onChange={e => setForm({ ...form, targetUserId: e.target.value })} className={inputCls}>
              <option value="ALL">Everyone</option>
              {users.filter(u => u.id !== currentUser?.id).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Type *</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.value} type="button"
                    onClick={() => setForm({ ...form, type: t.value as any })}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border-2 text-xs font-medium transition-colors
                      ${form.type === t.value ? `border-current ${t.color} bg-gray-50 dark:bg-slate-700` : 'border-gray-200 dark:border-slate-600 text-gray-500 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              required className={inputCls} placeholder="e.g. Stock Level Alert" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Message *</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              required rows={3} className={inputCls} placeholder="Write your notification message here..." />
          </div>

          {/* Preview */}
          {form.title && (
            <div className={`rounded-lg border-l-4 p-3 text-sm ${
              form.type === 'info'    ? 'bg-blue-50 border-blue-500 text-blue-800'   :
              form.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-800' :
              form.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
                                        'bg-red-50 border-red-500 text-red-800'
            }`}>
              <p className="font-semibold text-xs uppercase mb-0.5 opacity-60">Preview</p>
              <p className="font-semibold">{form.title}</p>
              {form.message && <p className="mt-0.5 opacity-90">{form.message}</p>}
            </div>
          )}

          <div className="flex space-x-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Sending...' : 'Send Notification'}
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
