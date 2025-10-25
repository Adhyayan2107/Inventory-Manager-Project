import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, ShoppingCart, Filter, X, Search, AlertCircle, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { formatCurrency, formatDateTime, getStatusColor, formatStatus } from '../utils/formatters';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', status: '', paymentStatus: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [search, filters, orders]);

  const loadOrders = async () => {
    try {
      setError('');
      const { data } = await orderApi.getAll();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.supplier?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(order => order.type === filters.type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Payment status filter
    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    setFilteredOrders(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? Inventory will be restored.')) return;

    setDeleting(id);
    try {
      setError('');
      await orderApi.delete(id);
      setOrders(orders.filter(o => o._id !== id));
    } catch (error) {
      setError(error.response?.data?.message || 'Error cancelling order. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setError('');
      await orderApi.update(orderId, { status: newStatus });
      await loadOrders();
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating status. Please try again.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ type: '', status: '', paymentStatus: '' });
  };

  const hasActiveFilters = search || filters.type || filters.status || filters.paymentStatus;

  const getTotalSales = () => {
    return filteredOrders
      .filter(o => o.type === 'sale' && o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  const getTotalPurchases = () => {
    return filteredOrders
      .filter(o => o.type === 'purchase' && o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            Orders
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            Manage purchase and sales orders
            {filteredOrders.length !== orders.length && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                {filteredOrders.length} of {orders.length}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="btn btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{orders.length}</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(getTotalSales())}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Purchases</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(getTotalPurchases())}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Pending Orders</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <Package className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card shadow-md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by order number, customer, or supplier..."
              className="form-input pl-10 pr-10 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            className="form-input w-full lg:w-40 shadow-sm focus:ring-2 focus:ring-indigo-500"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="sale">Sale</option>
          </select>

          <select
            className="form-input w-full lg:w-44 shadow-sm focus:ring-2 focus:ring-indigo-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="form-input w-full lg:w-44 shadow-sm focus:ring-2 focus:ring-indigo-500"
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
          >
            <option value="">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card p-0 overflow-hidden shadow-lg">
        <div className="table-container">
          <table>
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th>Order #</th>
                <th>Type</th>
                <th>Customer/Supplier</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    {hasActiveFilters ? (
                      <div className="text-gray-500">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="font-semibold text-lg mb-2">No orders match your filters</p>
                        <p className="text-sm mb-4">Try adjusting your search or filter criteria</p>
                        <button
                          onClick={clearFilters}
                          className="btn btn-secondary mx-auto"
                        >
                          <X className="w-4 h-4" />
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="font-semibold text-lg mb-2">No orders found</p>
                        <p className="text-sm mb-4">Create your first order!</p>
                        <button
                          onClick={() => navigate('/orders/new')}
                          className="btn btn-primary mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          New Order
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-indigo-50/50 transition-colors group">
                    <td className="font-mono text-sm font-medium bg-gray-50 group-hover:bg-indigo-50">
                      <span className="px-2 py-1 bg-white rounded border border-gray-200 inline-block">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <span className={`badge shadow-sm ${order.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {order.type === 'purchase' ? '📦 Purchase' : '🛒 Sale'}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">
                        {order.type === 'purchase' 
                          ? order.supplier?.name || 'N/A'
                          : order.customerName || 'Walk-in Customer'}
                      </div>
                      {order.type === 'sale' && order.customerEmail && (
                        <div className="text-xs text-gray-500">{order.customerEmail}</div>
                      )}
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-medium">
                        {order.items.length} items
                      </span>
                    </td>
                    <td className="font-bold text-green-600 text-base">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <select
                        className={`badge ${getStatusColor(order.status)} cursor-pointer shadow-sm hover:shadow-md transition`}
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(order.paymentStatus)} shadow-sm`}>
                        {formatStatus(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                   
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          title="Cancel Order"
                          disabled={deleting === order._id}
                        >
                          {deleting === order._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      {filteredOrders.length > 0 && (
        <div className="card bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-gray-600 font-medium mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Sales Orders</p>
              <p className="text-2xl font-bold text-green-700">
                {filteredOrders.filter(o => o.type === 'sale').length}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Purchase Orders</p>
              <p className="text-2xl font-bold text-blue-700">
                {filteredOrders.filter(o => o.type === 'purchase').length}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-orange-100">
              <p className="text-xs text-orange-600 font-medium mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-700">
                {filteredOrders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">Completed</p>
              <p className="text-2xl font-bold text-purple-700">
                {filteredOrders.filter(o => o.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}