'use client';

import { useEffect, useState, useCallback } from 'react';
import { FiX, FiInfo, FiAlertTriangle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  targetUserId: string;
  createdByName: string;
  createdAt: string;
  dismissedBy: string[];
}

const typeStyles = {
  info:    { bar: 'bg-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/30',   border: 'border-blue-400',  text: 'text-blue-800 dark:text-blue-200',  icon: FiInfo          },
  warning: { bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-400', text: 'text-amber-800 dark:text-amber-200', icon: FiAlertTriangle },
  success: { bar: 'bg-green-600', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-400', text: 'text-green-800 dark:text-green-200', icon: FiCheckCircle   },
  danger:  { bar: 'bg-red-600',   bg: 'bg-red-50 dark:bg-red-900/30',     border: 'border-red-400',   text: 'text-red-800 dark:text-red-200',     icon: FiAlertCircle   },
};

export default function NotificationBanner() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const all: Notification[] = await res.json();
      // Show notifications targeted at this user or ALL, not yet dismissed by this user
      const visible = all.filter(n =>
        (n.targetUserId === 'ALL' || n.targetUserId === 'everyone' || n.targetUserId === user.id) &&
        !n.dismissedBy.includes(user.id)
      );
      setNotifications(visible);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    window.addEventListener('notification-created', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-created', fetchNotifications);
    };
  }, [fetchNotifications]);

  const dismiss = async (id: string) => {
    if (!user) return;
    // Optimistic remove
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissUserId: user.id }),
      });
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  if (!notifications.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {notifications.map(n => {
        const style = typeStyles[n.type] || typeStyles.info;
        const Icon = style.icon;
        return (
          <div key={n.id}
            className={`flex items-start gap-3 rounded-lg border ${style.bg} ${style.border} overflow-hidden shadow-sm`}>
            {/* Left color bar */}
            <div className={`w-1.5 self-stretch shrink-0 ${style.bar}`} />
            <Icon className={`w-5 h-5 mt-3 shrink-0 ${style.text}`} />
            <div className="flex-1 py-3 pr-2 min-w-0">
              <p className={`font-semibold text-sm ${style.text}`}>{n.title}</p>
              <p className={`text-sm mt-0.5 ${style.text} opacity-90`}>{n.message}</p>
              <p className={`text-xs mt-1 ${style.text} opacity-60`}>
                From {n.createdByName} · {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={() => dismiss(n.id)}
              className={`p-2 mt-1 mr-1 rounded-lg ${style.text} hover:bg-black/10 transition-colors shrink-0`}
              title="Dismiss">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
