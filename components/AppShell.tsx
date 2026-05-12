'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isLoginPage) {
      router.replace('/login');
    }
    if (user && isLoginPage) {
      router.replace('/');
    }
  }, [user, isLoading, isLoginPage, router]);

  // Show spinner while auth state is being restored from localStorage
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600" />
      </div>
    );
  }

  // Login page — no sidebar, no wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not authenticated — blank while redirect happens
  if (!user) return null;

  // Authenticated — full app layout
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 md:p-8 lg:p-10 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        {children}
      </main>
    </div>
  );
}
