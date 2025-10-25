import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Filter, Package, AlertCircle, X, Eye, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { productApi } from '../api/productApi';
import { formatCurrency, getStatusColor, formatStatus } from '../utils/formatters';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', lowStock: false });
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [search, filters, products, sortConfig]);

  const loadProducts = async () => {
    try {
      setError('');
      const { data } = await productApi.getAll();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.category?.name.toLowerCase().includes(searchLower) ||
        product.supplier?.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(product => product.status === filters.status);
    }

    if (filters.lowStock) {
      filtered = filtered.filter(product => {
        if (product.reorderLevel && product.reorderLevel > 0) {
          return product.quantity <= product.reorderLevel;
        }
        return product.quantity <= 10;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'category') {
          aVal = a.category?.name || '';
          bVal = b.category?.name || '';
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    setDeleting(id);
    try {
      await productApi.delete(id);
      setProducts(products.filter(p => p._id !== id));
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting product. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ status: '', lowStock: false });
    setSortConfig({ key: null, direction: 'asc' });
  };

  const hasActiveFilters = search || filters.status || filters.lowStock;

  const getStockIndicator = (product) => {
    if (product.quantity === 0) return { color: 'bg-red-500', text: 'Out of Stock' };
    if (product.reorderLevel && product.quantity <= product.reorderLevel) {
      return { color: 'bg-yellow-500', text: 'Low Stock' };
    }
    return { color: 'bg-green-500', text: 'In Stock' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading products...</p>
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
              <Package className="w-7 h-7 text-white" />
            </div>
            Products
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            Manage your inventory products
            {filteredProducts.length !== products.length && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                {filteredProducts.length} of {products.length}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={() => navigate('/products/new')}
          className="btn btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{products.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(products.reduce((sum, p) => sum + (p.price * p.quantity), 0))}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Cost</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {formatCurrency(products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0))}
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {products.filter(p => {
                  if (p.reorderLevel && p.reorderLevel > 0) {
                    return p.quantity <= p.reorderLevel;
                  }
                  return p.quantity <= 10;
                }).length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500 opacity-50" />
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

      {/* Filters */}
      <div className="card shadow-md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, SKU, category, or supplier..."
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
          </div>

          <select
            className="form-input w-full lg:w-44 shadow-sm focus:ring-2 focus:ring-indigo-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg cursor-pointer hover:from-gray-100 hover:to-gray-200 transition border border-gray-200 shadow-sm">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Low Stock</span>
          </label>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters} 
              className="btn btn-secondary shadow-sm hover:shadow-md transition-all whitespace-nowrap"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="card p-0 overflow-hidden shadow-lg">
        <div className="table-container">
          <table>
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('sku')}>
                  <div className="flex items-center gap-1">
                    SKU
                    {sortConfig.key === 'sku' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Name
                    {sortConfig.key === 'name' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Category
                    {sortConfig.key === 'category' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">
                    Price
                    {sortConfig.key === 'price' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('costPrice')}>
                  <div className="flex items-center gap-1">
                    Cost
                    {sortConfig.key === 'costPrice' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center gap-1">
                    Quantity
                    {sortConfig.key === 'quantity' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Stock Status</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    {hasActiveFilters ? (
                      <div className="text-gray-500">
                        <p className="font-semibold text-lg mb-2">No products match your filters</p>
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
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="font-semibold text-lg mb-2">No products found</p>
                        <p className="text-sm mb-4">Add your first product to get started!</p>
                        <button
                          onClick={() => navigate('/products/new')}
                          className="btn btn-primary mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Add Product
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockIndicator = getStockIndicator(product);
                  return (
                    <tr key={product._id} className="hover:bg-indigo-50/50 transition-colors group">
                      <td className="font-mono text-sm bg-gray-50 group-hover:bg-indigo-50">
                        <span className="px-2 py-1 bg-white rounded border border-gray-200 inline-block">
                          {product.sku}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          {product.supplier && (
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              {product.supplier.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded">
                          {product.category?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="font-bold text-green-600 text-base">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="text-gray-600 font-medium">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${stockIndicator.color}`}></span>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className={`font-bold ${
                                product.quantity <= (product.reorderLevel || 0) 
                                  ? 'text-red-600' 
                                  : 'text-gray-900'
                              }`}>
                                {product.quantity}
                              </span>
                              <span className="text-gray-500 text-sm">{product.unit}</span>
                            </div>
                            {product.quantity <= (product.reorderLevel || 0) && (
                              <div className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Reorder at {product.reorderLevel}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(product.stockStatus)} shadow-sm`}>
                          {formatStatus(product.stockStatus)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(product.status)} shadow-sm`}>
                          {formatStatus(product.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/products/edit/${product._id}`)}
                            className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all hover:scale-110 active:scale-95"
                            title="Edit Product"
                            disabled={deleting === product._id}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            title="Delete Product"
                            disabled={deleting === product._id}
                          >
                            {deleting === product._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Summary Footer */}
      {filteredProducts.length > 0 && (
        <div className="card bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-gray-600 font-medium mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Total Value</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0))}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0))}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-red-100">
              <p className="text-xs text-red-600 font-medium mb-1">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-700">
                {filteredProducts.filter(p => {
                  if (p.reorderLevel && p.reorderLevel > 0) {
                    return p.quantity <= p.reorderLevel;
                  }
                  return p.quantity <= 10;
                }).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}