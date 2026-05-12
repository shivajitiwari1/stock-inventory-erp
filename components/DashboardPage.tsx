'use client';

import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import type { DashboardData } from '@/lib/dashboard';

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setDashboardData(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Failed to load dashboard data.
      </div>
    );
  }

  return <Dashboard data={dashboardData} />;
};

export default DashboardPage;
