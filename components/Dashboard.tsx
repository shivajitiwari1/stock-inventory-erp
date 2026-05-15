'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiPackage, FiTrendingUp, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { useTheme } from './ThemeContext';

export interface DashboardStats {
  totalStock: number;
  availableStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  lastUpdated: string;
}

export interface DashboardData {
  stats: DashboardStats;
  stockTrend: any[];
  categoryDistribution: any[];
  recentMovements: any[];
  products: any[];
}

const Dashboard: React.FC<{ data: DashboardData }> = ({ data }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartAxisColor   = isDark ? '#94a3b8' : '#6b7280';
  const chartGridColor   = isDark ? '#334155' : '#e5e7eb';
  const chartBgColor     = isDark ? '#1e293b' : '#ffffff';
  const chartBorderColor = isDark ? '#475569' : '#e2e8f0';
  const { products } = data;

  const StatCard = ({ icon: Icon, label, value, color, bgColor }: any) => (
    <div className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${bgColor}`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${color} w-full`}></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiPackage}
          label="Total Stock Quantity"
          value={data.stats.totalStock}
          color="from-blue-500 to-blue-600"
          bgColor="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Available Stock"
          value={data.stats.availableStock}
          color="from-green-500 to-green-600"
          bgColor="bg-gradient-to-br from-green-500 to-green-700"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Low Stock Alert"
          value={data.stats.lowStockCount}
          color="from-yellow-500 to-yellow-600"
          bgColor="bg-gradient-to-br from-yellow-500 to-yellow-700"
        />
        <StatCard
          icon={FiClock}
          label="Out of Stock Items"
          value={data.stats.outOfStockCount}
          color="from-red-500 to-red-600"
          bgColor="bg-gradient-to-br from-red-500 to-red-700"
        />
      </div>

      {/* Stock Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stock Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 min-w-0">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Stock Trend</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiTrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.stockTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="date" stroke={chartAxisColor} fontSize={11} tick={{ fill: chartAxisColor }} />
              <YAxis stroke={chartAxisColor} fontSize={11} tick={{ fill: chartAxisColor }} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartBgColor,
                  border: `1px solid ${chartBorderColor}`,
                  borderRadius: '12px',
                  color: isDark ? '#f1f5f9' : '#111827',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
              />
              <Legend wrapperStyle={{ color: chartAxisColor, fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="quantity"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: isDark ? '#1e293b' : '#ffffff' }}
                name="Available Stock"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 min-w-0">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Stock by Category</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiPackage className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.categoryDistribution}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
              <XAxis type="number" stroke={chartAxisColor} fontSize={11} tick={{ fill: chartAxisColor }} />
              <YAxis type="category" dataKey="name" stroke={chartAxisColor} fontSize={11} tick={{ fill: chartAxisColor }} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartBgColor,
                  border: `1px solid ${chartBorderColor}`,
                  borderRadius: '12px',
                  color: isDark ? '#f1f5f9' : '#111827',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                }}
              />
              <Bar dataKey="value" name="Stock" radius={[0, 4, 4, 0]}>
                {data.categoryDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">{data.stats.totalStock}</div>
              <div className="text-sm text-blue-600 font-medium">Total Stock Quantity</div>
            </div>
            <div className="p-3 bg-blue-200 rounded-xl">
              <FiPackage className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-600">
                {data.stats.totalStock > 0 ? ((data.stats.availableStock / data.stats.totalStock) * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-sm text-green-600 font-medium">Stock Availability Rate</div>
            </div>
            <div className="p-3 bg-green-200 rounded-xl">
              <FiTrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-600">{data.stats.lowStockCount + data.stats.outOfStockCount}</div>
              <div className="text-sm text-yellow-600 font-medium">Items Needing Attention</div>
            </div>
            <div className="p-3 bg-yellow-200 rounded-xl">
              <FiAlertTriangle className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Recently Added Products */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FiClock className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <table className="w-full min-w-[400px]">
            <thead className="bg-gray-50 rounded-lg">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Product</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Warehouse</th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentMovements.slice(0, 8).map((movement: any) => (
                <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900">{movement.productName}</td>
                  <td className="px-3 sm:px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      movement.type === 'STOCK_IN'
                        ? 'bg-green-100 text-green-700'
                        : movement.type === 'ADJUSTMENT'
                        ? 'bg-blue-100 text-blue-700'
                        : movement.type === 'TRANSFER'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {movement.type === 'STOCK_IN' ? 'Stock In'
                        : movement.type === 'STOCK_OUT' ? 'Stock Out'
                        : movement.type === 'ADJUSTMENT' ? 'Adj.'
                        : movement.type === 'TRANSFER' ? 'Transfer'
                        : movement.type}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-sm text-gray-900 font-medium">{movement.quantity}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-sm text-gray-600">{movement.warehouseName || 'Main Warehouse'}</td>
                  <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-sm text-gray-500">
                    {new Date(movement.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.recentMovements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No recent stock movements found.
        </div>
      )}
    </div>
  );
};

export default Dashboard;
