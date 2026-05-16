'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'INVENTORY_MANAGER' | 'STAFF';
export type UserAction = 'add' | 'edit' | 'delete';

export interface PagePermission {
  view: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
}

export interface UserPermissions {
  [page: string]: PagePermission;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  permissions?: UserPermissions;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  canView: (page: string) => boolean;
  canDo: (page: string, action: UserAction) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      const foundUser = data.users.find((u: User) => u.email === email);
      if (foundUser && foundUser.status === 'ACTIVE') {
        setUser(foundUser);
        localStorage.setItem('currentUser', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    window.location.replace('/login');
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    const hierarchy = { STAFF: 1, INVENTORY_MANAGER: 2, ADMIN: 3 };
    return hierarchy[user.role] >= hierarchy[requiredRole];
  };

  // ADMIN always has full access; others check their permissions object
  const canView = (page: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.[page]?.view ?? false;
  };

  const canDo = (page: string, action: UserAction): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.[page]?.[action] ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, canView, canDo, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
