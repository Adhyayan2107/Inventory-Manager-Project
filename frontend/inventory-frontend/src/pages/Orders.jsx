import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ShoppingCart, Filter } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { formatCurrency, formatDateTime, getStatusColor, formatStatus } from '../utils/formatters';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', paymentStatus: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      const { data } = await orderApi.getAll(filters);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? Inventory will be restored.')) return;

    try {
      await orderApi.delete(id);
      loadOrders();
    } catch (error) {
      alert('Error cancelling order: ' + error.response?.data?.message);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderApi.update(orderId, { status: newStatus });
      loadOrders();
    } catch (error) {
      alert('Error updating status: ' + error.response?.data?.message);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-indigo-600" />
            Orders
          </h1>
          <p className="text-gray-600 mt-1">Manage purchase and sales orders</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <select
            className="form-input w-40"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="sale">Sale</option>
          </select>

          <select
            className="form-input w-40"
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
            className="form-input w-40"
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
          >
            <option value="">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>

          <button
            onClick={() => setFilters({ type: '', status: '', paymentStatus: '' })}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    No orders found. Create your first order!
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-mono text-sm font-medium">{order.orderNumber}</td>
                    <td>
                      <span className={`badge ${order.type === 'purchase' ? 'badge-info' : 'badge-success'}`}>
                        {order.type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {order.type === 'purchase' 
                        ? order.supplier?.name || 'N/A'
                        : order.customerName || 'N/A'}
                    </td>
                    <td className="text-center">{order.items.length}</td>
                    <td className="font-semibold text-green-600">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <select
                        className={`badge ${getStatusColor(order.status)} cursor-pointer`}
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
                      <span className={`badge ${getStatusColor(order.paymentStatus)}`}>
                        {formatStatus(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                          title="Cancel Order"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}