'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { LoginModal } from './LoginModal';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({ children, requiredRole }) => {
  const { user, isLoading, hasPermission } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setShowLoginModal(true);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to access this page</p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Open Login
          </button>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  if (requiredRole && !hasPermission(requiredRole as any)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-800 mb-2">Permission Denied</h1>
          <p className="text-red-600">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
