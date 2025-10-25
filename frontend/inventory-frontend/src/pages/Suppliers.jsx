import React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, Search, Mail, Phone, X, MapPin, Star, AlertCircle, User, Building } from 'lucide-react';
import { supplierApi } from '../api/supplierApi';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactPerson: '',
    rating: 0,
    notes: '',
    isActive: true
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [search, suppliers, sortConfig]);

  const loadSuppliers = async () => {
    try {
      setError('');
      const { data } = await supplierApi.getAll();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.email.toLowerCase().includes(searchLower) ||
        supplier.phone.toLowerCase().includes(searchLower) ||
        supplier.contactPerson?.toLowerCase().includes(searchLower) ||
        supplier.address?.city?.toLowerCase().includes(searchLower) ||
        supplier.address?.country?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'location') {
          aVal = a.address?.city || '';
          bVal = b.address?.city || '';
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredSuppliers(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingSupplier) {
        await supplierApi.update(editingSupplier._id, formData);
      } else {
        await supplierApi.create(formData);
      }
      await loadSuppliers();
      closeModal();
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      contactPerson: supplier.contactPerson || '',
      rating: supplier.rating || 0,
      notes: supplier.notes || '',
      isActive: supplier.isActive
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
    
    setDeleting(id);
    try {
      setError('');
      await supplierApi.delete(id);
      setSuppliers(suppliers.filter(s => s._id !== id));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete supplier. They may have associated products.');
    } finally {
      setDeleting(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      contactPerson: '',
      rating: 0,
      notes: '',
      isActive: true
    });
    setError('');
  };

  const getAverageRating = () => {
    if (suppliers.length === 0) return 0;
    const total = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0);
    return (total / suppliers.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading suppliers...</p>
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
              <Truck className="w-7 h-7 text-white" />
            </div>
            Suppliers
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            Manage your supplier relationships
            {filteredSuppliers.length !== suppliers.length && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                {filteredSuppliers.length} of {suppliers.length}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Suppliers</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{suppliers.length}</p>
            </div>
            <Building className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Active Suppliers</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {suppliers.filter(s => s.isActive).length}
              </p>
            </div>
            <Truck className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1 flex items-center gap-1">
                {getAverageRating()}
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </p>
            </div>
            <Star className="w-10 h-10 text-yellow-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Inactive</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {suppliers.filter(s => !s.isActive).length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-purple-500 opacity-50" />
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

      {/* Search */}
      <div className="card shadow-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, email, phone, contact person, or location..."
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

      {/* Suppliers Table */}
      <div className="card p-0 overflow-hidden shadow-lg">
        <div className="table-container">
          <table>
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Name
                    {sortConfig.key === 'name' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-1">
                    Location
                    {sortConfig.key === 'location' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="cursor-pointer hover:bg-gray-200 transition" onClick={() => handleSort('rating')}>
                  <div className="flex items-center gap-1">
                    Rating
                    {sortConfig.key === 'rating' && (
                      <span className="text-indigo-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    {search ? (
                      <div className="text-gray-500">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="font-semibold text-lg mb-2">No suppliers match your search</p>
                        <p className="text-sm mb-4">Try adjusting your search criteria</p>
                        <button
                          onClick={() => setSearch('')}
                          className="btn btn-secondary mx-auto"
                        >
                          <X className="w-4 h-4" />
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="font-semibold text-lg mb-2">No suppliers found</p>
                        <p className="text-sm mb-4">Add your first supplier to get started!</p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="btn btn-primary mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Add Supplier
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-indigo-50/50 transition-colors group">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="font-semibold text-gray-900">{supplier.name}</div>
                      </div>
                    </td>
                    <td>
                      {supplier.contactPerson ? (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-gray-400" />
                          {supplier.contactPerson}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-indigo-500" />
                        <a href={`mailto:${supplier.email}`} className="hover:text-indigo-600 transition">
                          {supplier.email}
                        </a>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-green-500" />
                        <a href={`tel:${supplier.phone}`} className="hover:text-green-600 transition">
                          {supplier.phone}
                        </a>
                      </div>
                    </td>
                    <td>
                      {supplier.address?.city && supplier.address?.country ? (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>{supplier.address.city}, {supplier.address.country}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(Math.floor(supplier.rating || 0))}</div>
                        <span className="font-medium text-gray-700">{(supplier.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${supplier.isActive ? 'badge-success' : 'badge-danger'} shadow-sm`}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all hover:scale-110 active:scale-95"
                          title="Edit Supplier"
                          disabled={deleting === supplier._id}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier._id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          title="Delete Supplier"
                          disabled={deleting === supplier._id}
                        >
                          {deleting === supplier._id ? (
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Truck className="w-6 h-6 text-indigo-600" />
                {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
              </h2>
              <button 
                onClick={closeModal} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Supplier Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter supplier name"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Contact person name"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="supplier@example.com"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 form-group">
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, street: e.target.value }
                      })}
                      placeholder="Street address"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, city: e.target.value }
                      })}
                      placeholder="City"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State/Province</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.state}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, state: e.target.value }
                      })}
                      placeholder="State"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                      placeholder="12345"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address.country}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, country: e.target.value }
                      })}
                      placeholder="Country"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-600" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Rating (0-5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      className="form-input"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                      disabled={submitting}
                    />
                    <div className="flex gap-1 mt-2">
                      {renderStars(Math.floor(formData.rating))}
                    </div>
                  </div>

                  <div className="form-group flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                        disabled={submitting}
                      />
                      <span className="form-label mb-0">Active Supplier</span>
                    </label>
                  </div>

                  <div className="md:col-span-2 form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      rows="3"
                      className="form-input"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about the supplier"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="submit" 
                  className="flex-1 btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {editingSupplier ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingSupplier ? 'Update Supplier' : 'Create Supplier'
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