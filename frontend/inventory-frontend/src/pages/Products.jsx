import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Package } from 'lucide-react';
import { productApi } from '../api/productApi';
import { formatCurrency, getStatusColor, formatStatus } from '../utils/formatters';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', lowStock: false });
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      const params = { search, ...filters, lowStock: filters.lowStock ? 'true' : undefined };
      const { data } = await productApi.getAll(params);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await productApi.delete(id);
      loadProducts();
    } catch (error) {
      alert('Error deleting product: ' + error.response?.data?.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
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
            <Package className="w-8 h-8 text-indigo-600" />
            Products
          </h1>
          <p className="text-gray-600 mt-1">Manage your inventory products</p>
        </div>
        <button 
          onClick={() => navigate('/products/new')}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="form-input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <select
            className="form-input w-40"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Low Stock Only</span>
          </label>

          <button type="submit" className="btn btn-primary">
            <Filter className="w-4 h-4" />
            Apply
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Cost</th>
                <th>Quantity</th>
                <th>Stock Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    No products found. Add your first product to get started!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id}>
                    <td className="font-mono text-sm">{product.sku}</td>
                    <td>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.supplier && (
                        <div className="text-xs text-gray-500">{product.supplier.name}</div>
                      )}
                    </td>
                    <td>{product.category?.name || 'N/A'}</td>
                    <td className="font-semibold text-green-600">{formatCurrency(product.price)}</td>
                    <td className="text-gray-600">{formatCurrency(product.costPrice)}</td>
                    <td>
                      <span className="font-medium">{product.quantity}</span>
                      <span className="text-gray-500 text-sm"> {product.unit}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(product.stockStatus)}`}>
                        {formatStatus(product.stockStatus)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(product.status)}`}>
                        {formatStatus(product.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/products/edit/${product._id}`)}
                          className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                          title="Delete Product"
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