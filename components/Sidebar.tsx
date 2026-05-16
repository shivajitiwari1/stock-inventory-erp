'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiMenu, FiX, FiHome, FiPackage, FiBox, FiTrendingUp,
  FiUsers, FiActivity, FiBarChart, FiAlertCircle,
  FiLogOut, FiLogIn, FiSun, FiMoon, FiRepeat,
  FiFileText, FiArrowUpRight, FiBriefcase, FiBell,
} from 'react-icons/fi';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { LoginModal } from './LoginModal';
import { useSidebar } from './SidebarContext';

export const Sidebar: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const pathname = usePathname();
  const { user, logout, hasPermission, canView } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOpen, isMobile, toggle, close } = useSidebar();

  const menuItems = [
    { href: '/',                  label: 'Dashboard',       icon: FiHome,         roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/products',          label: 'Products',        icon: FiPackage,      roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/inventory',         label: 'Inventory',       icon: FiBox,          roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/stock-management',  label: 'Stock Management',icon: FiTrendingUp,   roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/stock-transfers',   label: 'Stock Transfer',  icon: FiRepeat,       roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/alerts',            label: 'Low Stock Alerts',icon: FiAlertCircle,  roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/reports',           label: 'Reports',         icon: FiBarChart,     roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/suppliers',         label: 'Suppliers',       icon: FiUsers,        roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/supply-receipts',  label: 'Supply Receipts',  icon: FiFileText,      roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/stock-issues',     label: 'Stock Issues',     icon: FiArrowUpRight,  roles: ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { href: '/contractors',      label: 'Contractors',      icon: FiBriefcase,     roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/warehouses',        label: 'Warehouses',      icon: FiBox,          roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    { href: '/users',             label: 'User Management', icon: FiUsers,        roles: ['ADMIN'] },
    { href: '/notifications',     label: 'Notifications',   icon: FiBell,         roles: ['ADMIN'] },
    { href: '/audit-logs',        label: 'Audit & Logs',    icon: FiActivity,     roles: ['ADMIN'] },
  ];

  const showLabel = !isMobile && isOpen || isMobile;

  const NavItem = ({ href, label, icon: Icon }: any) => {
    const isActive = pathname === href;
    const pageKey = href === '/' ? 'dashboard' : href.slice(1);
    const hasAccess = !user || canView(pageKey);
    if (!hasAccess) return null;
    return (
      <Link
        href={href}
        onClick={() => isMobile && close()}
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
  };

  const sidebarWidth = isMobile ? 'w-72' : isOpen ? 'w-64' : 'w-20';
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
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-700 shrink-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">Stock ERP</h1>
          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300"
          >
            {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavItem key={item.href} {...item} />
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
    </>
  );
};

export default Sidebar;
