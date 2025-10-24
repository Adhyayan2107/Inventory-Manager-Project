import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { productApi } from '../api/productApi';
import { supplierApi } from '../api/supplierApi';
import { formatCurrency } from '../utils/formatters';

export default function OrderForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'purchase',
    supplier: '',
    customerName: '',
    customerEmail: '',
    items: [],
    tax: 0,
    discount: 0,
    notes: ''
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        productApi.getAll(),
        supplierApi.getAll()
      ]);
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error('Error loading dropdowns:', error);
    }
  };

  const addItem = () => {
    if (!selectedProduct || !quantity || !price) {
      alert('Please select product, quantity, and price');
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    const existingItem = formData.items.find(item => item.product === selectedProduct);

    if (existingItem) {
      alert('Product already added. Remove it first to add again.');
      return;
    }

    const newItem = {
      product: selectedProduct,
      productName: product.name,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      total: parseInt(quantity) * parseFloat(price)
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    setSelectedProduct('');
    setQuantity(1);
    setPrice('');
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    const product = products.find(p => p._id === productId);
    if (product) {
      setPrice(formData.type === 'purchase' ? product.costPrice : product.price);
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + parseFloat(formData.tax || 0) - parseFloat(formData.discount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        subtotal: calculateSubtotal(),
        totalAmount: calculateTotal()
      };

      await orderApi.create(orderData);
      navigate('/orders');
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-indigo-600" />
            Create New Order
          </h1>
          <p className="text-gray-600 mt-1">Add a new purchase or sales order</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type & Details */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Order Type *</label>
              <select
                required
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="purchase">Purchase Order</option>
                <option value="sale">Sales Order</option>
              </select>
            </div>

            {formData.type === 'purchase' ? (
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select
                  className="form-input"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(sup => (
                    <option key={sup._id} value={sup._id}>{sup.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Customer name"
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="form-label">Customer Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add Items */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="form-label">Product</label>
              <select
                className="form-input"
                value={selectedProduct}
                onChange={(e) => handleProductSelect(e.target.value)}
              >
                <option value="">Select Product</option>
                {products.map(prod => (
                  <option key={prod._id} value={prod._id}>
                    {prod.name} ({prod.sku}) - Stock: {prod.quantity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div className="mt-6 table-container overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Total</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 font-medium">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="mt-4 space-y-2 text-right">
                <p className="text-gray-700">Subtotal: <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span></p>
                <div className="flex justify-end gap-4 items-center">
                  <label>Tax:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input w-32"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-4 items-center">
                  <label>Discount:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input w-32"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  />
                </div>
                <p className="text-lg font-bold text-gray-800">
                  Total: {formatCurrency(calculateTotal())}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notes and Submit */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Additional Notes</h2>
          <textarea
            className="form-input w-full h-24"
            placeholder="Add any notes about this order..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
