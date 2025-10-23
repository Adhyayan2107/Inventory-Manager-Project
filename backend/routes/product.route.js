const express = require('express');
const router = express.Router();
const Product = require('../models/product.model.js');
const User = require('../models/user.models.js');
const { protect, managerOrAdmin } = require('../middlewares/auth.middleware.js');
const { sendLowStockAlert } = require('../utils/emailService.js');

router.get('/', protect, async (req, res) => {
  try {
    const { category, status, search, lowStock } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$minStockLevel'] };
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'name email phone')
      .populate('createdBy', 'name email');

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, managerOrAdmin, async (req, res) => {
  try {
    const {
      name, sku, description, category, supplier,
      price, costPrice, quantity, minStockLevel,
      unit, location, imageUrl
    } = req.body;

    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    const product = new Product({
      name,
      sku,
      description,
      category,
      supplier,
      price,
      costPrice,
      quantity,
      minStockLevel,
      unit,
      location,
      imageUrl,
      createdBy: req.user._id
    });

    const createdProduct = await product.save();
    
    const populatedProduct = await Product.findById(createdProduct._id)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .populate('createdBy', 'name');

    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const wasLowStock = product.quantity <= product.minStockLevel;

      Object.assign(product, req.body);
      
      const updatedProduct = await product.save();
      const isNowLowStock = updatedProduct.quantity <= updatedProduct.minStockLevel;
      
      if (!wasLowStock && isNowLowStock) {
        // Send low stock alert
        const admins = await User.find({ 
          role: { $in: ['admin', 'manager'] },
          'notifications.lowStock': true 
        });

        for (const admin of admins) {
          try {
            await sendLowStockAlert(admin.email, [updatedProduct]);
          } catch (emailError) {
            console.error('Failed to send low stock alert:', emailError);
          }
        }
      }

      const populatedProduct = await Product.findById(updatedProduct._id)
        .populate('category', 'name')
        .populate('supplier', 'name')
        .populate('createdBy', 'name');

      res.json(populatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    });
    const outOfStock = await Product.countDocuments({ quantity: 0 });
    
    const totalValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      }
    ]);

    res.json({
      totalProducts,
      lowStockProducts,
      outOfStock,
      totalInventoryValue: totalValue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;