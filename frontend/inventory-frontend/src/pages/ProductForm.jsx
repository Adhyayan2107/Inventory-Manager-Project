import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Package } from 'lucide-react';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { supplierApi } from '../api/supplierApi';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    supplier: '',
    price: '',
    costPrice: '',
    quantity: '',
    minStockLevel: '10',
    unit: 'pcs',
    location: '',
    status: 'active',
    imageUrl: ''
  });

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDropdowns();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadDropdowns = async () => {
    try {
      const [categoriesRes, suppliersRes] = await Promise.all([
        categoryApi.getAll(),
        supplierApi.getAll()
      ]);
      setCategories(categoriesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Error loading dropdowns:', error);
    }
  };

  const loadProduct = async () => {
    try {
      const { data } = await productApi.getById(id);
      setFormData({
        name: data.name,
        sku: data.sku,
        description: data.description || '',
        category: data.category?._id || '',
        supplier: data.supplier?._id || '',
        price: data.price,
        costPrice: data.costPrice,
        quantity: data.quantity,
        minStockLevel: data.minStockLevel,
        unit: data.unit,
        location: data.location || '',
        status: data.status,
        imageUrl: data.imageUrl || ''
      });
    } catch (error) {
      setError('Error loading product');
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await productApi.update(id, formData);
      } else {
        await productApi.create(formData);
      }
      navigate('/products');
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update product information' : 'Create a new product in your inventory'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="name"
              required
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU *</label>
            <input
              type="text"
              name="sku"
              required
              className="form-input"
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g., PRD-001"
              disabled={isEdit}
            />
          </div>

          <div className="md:col-span-2 form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows="3"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Product description"
            />
          </div>

          {/* Category & Supplier */}
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              name="category"
              required
              className="form-input"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select
              name="supplier"
              className="form-input"
              value={formData.supplier}
              onChange={handleChange}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(sup => (
                <option key={sup._id} value={sup._id}>{sup.name}</option>
              ))}
            </select>
          </div>

          {/* Pricing */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pricing</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Cost Price *</label>
            <input
              type="number"
              name="costPrice"
              required
              min="0"
              step="0.01"
              className="form-input"
              value={formData.costPrice}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Selling Price *</label>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="0.01"
              className="form-input"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          {/* Inventory */}
          <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Inventory</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input
              type="number"
              name="quantity"
              required
              min="0"
              className="form-input"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit *</label>
            <input
              type="text"
              name="unit"
              required
              className="form-input"
              value={formData.unit}
              onChange={handleChange}
              placeholder="pcs, kg, liters, etc."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Stock Level *</label>
            <input
              type="number"
              name="minStockLevel"
              required
              min="0"
              className="form-input"
              value={formData.minStockLevel}
              onChange={handleChange}
              placeholder="10"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              name="location"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Warehouse A, Shelf 3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status *</label>
            <select
              name="status"
              required
              className="form-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="discontinued">Discontinued</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              name="imageUrl"
              className="form-input"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isEdit ? 'Update Product' : 'Create Product'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}