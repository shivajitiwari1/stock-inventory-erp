'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { FiMenu } from 'react-icons/fi';
import NotificationBanner from './NotificationBanner';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { isOpen, isMobile, toggle } = useSidebar();

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isLoginPage) router.replace('/login');
    if (user && isLoginPage) router.replace('/');
  }, [user, isLoading, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;
  if (!user) return null;

  const mainMargin = isMobile ? 'ml-0' : isOpen ? 'ml-56' : 'ml-16';

  return (
    <div className="min-h-screen flex w-full overflow-x-hidden">
      <Sidebar />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-20 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 gap-3">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <FiMenu className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold text-gray-800 dark:text-slate-100">Stock ERP</span>
      </div>

      <main className={`flex-1 ${mainMargin} pt-20 lg:pt-4 px-2 pb-4 lg:px-3 min-h-screen bg-gray-50 dark:bg-slate-900 transition-all duration-300 min-w-0`}>
        <NotificationBanner />
        {children}
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayout>{children}</AppLayout>
    </SidebarProvider>
  );
}
