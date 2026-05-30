'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiMenu, FiX, FiHome, FiPackage, FiBox, FiTrendingUp,
  FiUsers, FiActivity, FiBarChart, FiAlertCircle,
  FiLogOut, FiLogIn, FiSun, FiMoon, FiRepeat,
  FiFileText, FiArrowUpRight, FiBriefcase, FiBell, FiKey,
} from 'react-icons/fi';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { LoginModal } from './LoginModal';
import { useSidebar } from './SidebarContext';

// NavItem is defined OUTSIDE Sidebar so its reference is stable across renders.
// If defined inside, React sees a new component type on every render and
// unmounts/remounts all nav items, which triggers browser auto-scroll to the active link.
interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showLabel: boolean;
  isMobile: boolean;
  close: () => void;
  user: any;
  canView: (page: string) => boolean;
  onBeforeNavigate: () => void;
}

const NavItem = React.memo(function NavItem({
  href, label, icon: Icon, showLabel, isMobile, close, user, canView, onBeforeNavigate,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const pageKey = href === '/' ? 'dashboard' : href.slice(1);
  const hasAccess = !user || canView(pageKey);
  if (!hasAccess) return null;
  return (
    <Link
      href={href}
      onClick={() => {
        onBeforeNavigate();
        if (isMobile) close();
      }}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {showLabel && <span className="truncate">{label}</span>}
    </Link>
  );
});

export const Sidebar: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrentPassword, setCpCurrentPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const pathname = usePathname();
  const { user, logout, hasPermission, canView } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOpen, isMobile, toggle, close } = useSidebar();
  const navRef = useRef<HTMLElement>(null);
  const savedScrollTop = useRef<number>(0);

  // After navigation, restore the scroll position and hold it for 300ms to
  // prevent the browser from auto-scrolling to the newly-active focused link.
  useEffect(() => {
    if (!navRef.current) return;
    const nav = navRef.current;
    const target = savedScrollTop.current;
    nav.scrollTop = target;
    const lock = () => { nav.scrollTop = target; };
    nav.addEventListener('scroll', lock);
    const timer = setTimeout(() => nav.removeEventListener('scroll', lock), 300);
    return () => { clearTimeout(timer); nav.removeEventListener('scroll', lock); };
  }, [pathname]);

  const menuItems = [
    { href: '/',                  label: 'Dashboard',       icon: FiHome,         roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/products',          label: 'Products',        icon: FiPackage,      roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/inventory',         label: 'Inventory',       icon: FiBox,          roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/stock-management',  label: 'Stock Management',icon: FiTrendingUp,   roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/stock-transfers',   label: 'Stock Transfer',  icon: FiRepeat,       roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/alerts',            label: 'Low Stock Alerts',icon: FiAlertCircle,  roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/reports',           label: 'Reports',         icon: FiBarChart,     roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/suppliers',         label: 'Suppliers',       icon: FiUsers,        roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/supply-receipts',   label: 'Supply Receipts', icon: FiFileText,     roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/stock-issues',      label: 'Stock Issues',    icon: FiArrowUpRight, roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/contractors',       label: 'Contractors',     icon: FiBriefcase,    roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/warehouses',        label: 'Warehouses',      icon: FiBox,          roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/users',             label: 'User Management', icon: FiUsers,        roles: ['ADMIN'] },
    { href: '/notifications',     label: 'Notifications',   icon: FiBell,         roles: ['ADMIN'] },
    { href: '/audit-logs',        label: 'Audit & Logs',    icon: FiActivity,     roles: ['ADMIN'] },
  ];

  const showLabel = !isMobile && isOpen || isMobile;

  const handleBeforeNavigate = () => {
    if (navRef.current) savedScrollTop.current = navRef.current.scrollTop;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');
    if (cpNewPassword.length < 6) {
      setCpError('New password must be at least 6 characters.');
      return;
    }
    if (cpNewPassword !== cpConfirm) {
      setCpError('New passwords do not match.');
      return;
    }
    setCpLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, currentPassword: cpCurrentPassword, newPassword: cpNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCpError(data.error || 'Failed to update password.');
      } else {
        setCpSuccess('Password updated successfully!');
        setCpCurrentPassword('');
        setCpNewPassword('');
        setCpConfirm('');
        setTimeout(() => { setShowChangePassword(false); setCpSuccess(''); }, 1500);
      }
    } catch {
      setCpError('Something went wrong. Please try again.');
    } finally {
      setCpLoading(false);
    }
  };

  const sidebarWidth = isMobile ? 'w-64' : isOpen ? 'w-56' : 'w-24';
  const sidebarTranslate = isMobile
    ? isOpen ? 'translate-x-0' : '-translate-x-full'
    : 'translate-x-0';

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={close}
        />
      )}

      <aside className={`${sidebarWidth} ${sidebarTranslate} bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transition-all duration-300 fixed h-screen overflow-y-auto flex flex-col z-40`}>

        {/* Header */}
        <div className={`border-b border-gray-200 dark:border-slate-700 shrink-0 ${showLabel ? 'p-4 flex items-center justify-between' : 'px-2 py-3 flex items-start justify-between gap-1'}`}>
          {showLabel ? (
            <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">Stock ERP</h1>
          ) : (
            <h1 className="text-[11px] leading-tight font-bold text-gray-800 dark:text-slate-100">
              <span className="block">Stock</span>
              <span className="block">ERP</span>
            </h1>
          )}
          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              showLabel={showLabel}
              isMobile={isMobile}
              close={close}
              user={user}
              canView={canView}
              onBeforeNavigate={handleBeforeNavigate}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-2 shrink-0">

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors gap-3
              ${theme === 'dark'
                ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark'
              ? <FiSun className="w-5 h-5 shrink-0" />
              : <FiMoon className="w-5 h-5 shrink-0" />
            }
            {showLabel && (
              <span className="text-sm font-medium">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {/* User / Login */}
          {user ? (
            <div className="space-y-2">
              {showLabel && (
                <div className="px-4 py-2">
                  <p className="font-medium text-sm text-gray-900 dark:text-slate-100 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{user.role.replace(/_/g, ' ')}</p>
                </div>
              )}
              <button
                onClick={() => { setShowChangePassword(true); setCpError(''); setCpSuccess(''); }}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiKey className="w-5 h-5 shrink-0" />
                {showLabel && <span className="text-sm">Change Password</span>}
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiLogOut className="w-5 h-5 shrink-0" />
                {showLabel && <span className="text-sm">Logout</span>}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FiLogIn className="w-5 h-5 shrink-0" />
              {showLabel && <span className="text-sm">Login</span>}
            </button>
          )}
        </div>

        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </aside>

      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Change Password</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={cpCurrentPassword}
                  onChange={e => setCpCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={cpNewPassword}
                  onChange={e => setCpNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={cpConfirm}
                  onChange={e => setCpConfirm(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repeat new password"
                />
              </div>
              {cpError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{cpError}</p>
              )}
              {cpSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">{cpSuccess}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={cpLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {cpLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
