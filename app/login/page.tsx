'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { FiMail, FiLock, FiLogIn, FiShield } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/');
      } else {
        setError('Invalid email or account is inactive.');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-7">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <FiShield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Stock Inventory ERP</h1>
                <p className="text-blue-200 text-sm mt-0.5">Sign in to your account</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-7 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <FiLogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Demo Accounts — click to fill
              </p>
              <div className="space-y-2">
                {[
                  { email: 'john@inventory.com',  role: 'Admin',   color: 'bg-red-100 text-red-700' },
                  { email: 'jane@inventory.com',  role: 'Manager', color: 'bg-blue-100 text-blue-700' },
                  { email: 'bob@inventory.com',   role: 'Staff',   color: 'bg-green-100 text-green-700' },
                ].map(({ email: demoEmail, role, color }) => (
                  <button
                    key={demoEmail}
                    type="button"
                    onClick={() => fillDemo(demoEmail)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left group"
                  >
                    <span className="text-sm text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100">
                      {demoEmail}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{role}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">Any password works for demo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
