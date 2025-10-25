import React from 'react';
import { useState, useEffect } from 'react';
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import { productApi } from '../api/productApi';
import { orderApi } from '../api/orderApi';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const [productStats, setProductStats] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [products, orders] = await Promise.all([
        productApi.getStats(),
        orderApi.getStats()
      ]);
      
      setProductStats(products.data);
      setOrderStats(orders.data);
      
      // Set sales/revenue trend data if provided by backend
      if (orders.data.salesTrend) {
        setSalesData(orders.data.salesTrend);
      }
      
      // Set category distribution data if provided by backend
      if (products.data.categoryDistribution) {
        setCategoryData(products.data.categoryDistribution);
      }
      
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your inventory and sales</p>
        </div>
        <button className="btn btn-primary">
          <TrendingUp className="w-5 h-5" />
          Generate Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={productStats?.totalProducts || 0}
          icon={Package}
          color="blue"
          subtitle="Active inventory items"
        />
        <StatCard
          title="Total Orders"
          value={orderStats?.totalOrders || 0}
          icon={ShoppingCart}
          color="green"
          subtitle={`${orderStats?.pendingOrders || 0} pending`}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(orderStats?.totalSalesAmount || 0)}
          icon={DollarSign}
          color="purple"
          subtitle="Total sales amount"
        />
        <StatCard
          title="Low Stock Items"
          value={productStats?.lowStockProducts || 0}
          icon={AlertTriangle}
          color="red"
          subtitle="Needs reordering"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Purchases Chart */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sales vs Purchases</h2>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#667eea" />
                <Bar dataKey="purchases" fill="#764ba2" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No sales data available
            </div>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend</h2>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#667eea" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No revenue data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Distribution */}
        <div className="card lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Product Distribution</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No category data available
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Completed Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{orderStats?.completedOrders || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Inventory Value</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(productStats?.totalInventoryValue || 0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Out of Stock</p>
                  <p className="text-2xl font-bold text-purple-900">{productStats?.outOfStock || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Pending Orders</p>
                  <p className="text-2xl font-bold text-orange-900">{orderStats?.pendingOrders || 0}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}