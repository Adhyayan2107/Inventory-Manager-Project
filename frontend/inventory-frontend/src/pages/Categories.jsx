import React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree, X, Search, AlertCircle, Layers, CheckCircle, XCircle, Tag } from 'lucide-react';
import { categoryApi } from '../api/categoryApi';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategory: '',
    isActive: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchTerm, statusFilter, categories]);

  const loadCategories = async () => {
    try {
      setError('');
      const { data } = await categoryApi.getAll();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower) ||
        category.parentCategory?.name.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(cat => cat.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(cat => !cat.isActive);
    }

    setFilteredCategories(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      if (editingCategory && formData.parentCategory === editingCategory._id) {
        setError('A category cannot be its own parent');
        setSubmitting(false);
        return;
      }

      const submitData = {
        ...formData,
        parentCategory: formData.parentCategory || null
      };

      if (editingCategory) {
        await categoryApi.update(editingCategory._id, submitData);
      } else {
        await categoryApi.create(submitData);
      }
      
      await loadCategories();
      closeModal();
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentCategory: category.parentCategory?._id || '',
      isActive: category.isActive
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    
    setDeleting(id);
    try {
      setError('');
      await categoryApi.delete(id);
      setCategories(categories.filter(c => c._id !== id));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category. It may have associated products.');
    } finally {
      setDeleting(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', parentCategory: '', isActive: true });
    setError('');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const getCategoryProductCount = (category) => {
    return category.productCount || 0;
  };

  const getTopLevelCategories = () => {
    return categories.filter(cat => !cat.parentCategory);
  };

  const getSubcategories = () => {
    return categories.filter(cat => cat.parentCategory);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading categories...</p>
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
              <FolderTree className="w-7 h-7 text-white" />
            </div>
            Categories
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            Organize your products into categories
            {filteredCategories.length !== categories.length && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                {filteredCategories.length} of {categories.length}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Categories</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{categories.length}</p>
            </div>
            <FolderTree className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Categories</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {categories.filter(c => c.isActive).length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Top Level</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {getTopLevelCategories().length}
              </p>
            </div>
            <Layers className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Subcategories</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {getSubcategories().length}
              </p>
            </div>
            <Tag className="w-10 h-10 text-orange-500 opacity-50" />
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search categories by name, description, or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 pr-10 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            className="form-input w-full md:w-44 shadow-sm focus:ring-2 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters} 
              className="btn btn-secondary shadow-sm hover:shadow-md transition-all whitespace-nowrap"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div 
            key={category._id} 
            className="card hover:shadow-xl transition-all duration-300 group border-l-4 border-indigo-500 hover:border-indigo-600"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-indigo-200 group-hover:to-purple-200 transition">
                    <FolderTree className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition">
                    {category.name}
                  </h3>
                </div>
                {category.parentCategory && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 ml-12">
                    <Layers className="w-3 h-3" />
                    <span>Parent: {category.parentCategory.name}</span>
                  </div>
                )}
              </div>
              <span className={`badge ${category.isActive ? 'badge-success' : 'badge-danger'} shadow-sm`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {category.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 bg-gray-50 p-3 rounded-lg">
                {category.description}
              </p>
            )}

            <div className="flex items-center justify-between py-3 border-t border-b mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Products</p>
                  <p className="text-sm font-bold text-gray-900">{getCategoryProductCount(category)}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                #{category._id?.slice(-6)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(category)}
                className="flex-1 btn btn-primary py-2 text-sm hover:scale-105 active:scale-95 transition-transform"
                disabled={deleting === category._id}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(category._id)}
                className="flex-1 btn btn-danger py-2 text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={deleting === category._id}
              >
                {deleting === category._id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mx-auto"></div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && !loading && (
        <div className="card text-center py-12 shadow-lg">
          <div className="max-w-md mx-auto">
            {hasActiveFilters ? (
              <>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Categories Found
                </h3>
                <p className="text-gray-500 mb-4">
                  No categories match your search or filter criteria
                </p>
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary mx-auto"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderTree className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Categories Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first category to organize products
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-primary mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Category
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FolderTree className="w-5 h-5 text-white" />
                </div>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h2>
              <button 
                onClick={closeModal} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  required
                  className="form-input focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="3"
                  className="form-input focus:ring-2 focus:ring-indigo-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description (optional)"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parent Category</label>
                <select
                  className="form-input focus:ring-2 focus:ring-indigo-500"
                  value={formData.parentCategory}
                  onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                  disabled={submitting}
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter(cat => !editingCategory || cat._id !== editingCategory._id)
                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                        {cat.parentCategory && ` (${cat.parentCategory.name})`}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Select a parent to create a subcategory
                </p>
              </div>

              <div className="form-group bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    disabled={submitting}
                  />
                  <span className="form-label mb-0">Active Category</span>
                </label>
                <p className="text-xs text-gray-500 mt-2 ml-6">
                  Inactive categories won't appear in product selection
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="submit" 
                  className="flex-1 btn btn-primary shadow-lg hover:shadow-xl"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editingCategory ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}