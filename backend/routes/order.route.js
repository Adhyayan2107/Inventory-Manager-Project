const express = require('express');
const router = express.Router();
const Order = require('../models/order.model.js');
const Product = require('../models/product.model.js');
const { protect, managerOrAdmin } = require('../middlewares/auth.middleware.js');
const { sendOrderConfirmation } = require('../utils/emailService.js');

// IMPORTANT: Stats route MUST come before /:id route
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    const totalSales = await Order.aggregate([
      { $match: { type: 'sale', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalPurchases = await Order.aggregate([
      { $match: { type: 'purchase', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Monthly sales trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            type: '$type'
          },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format sales trend data for charts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};
    
    salesTrend.forEach(item => {
      const key = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      if (!trendMap[key]) {
        trendMap[key] = { name: key, sales: 0, purchases: 0 };
      }
      if (item._id.type === 'sale') {
        trendMap[key].sales = item.total;
      } else if (item._id.type === 'purchase') {
        trendMap[key].purchases = item.total;
      }
    });

    const formattedSalesTrend = Object.values(trendMap);

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalSalesAmount: totalSales[0]?.total || 0,
      totalPurchasesAmount: totalPurchases[0]?.total || 0,
      salesTrend: formattedSalesTrend
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { type, status, paymentStatus } = req.query;
    
    let query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('supplier', 'name email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('supplier', 'name email phone')
      .populate('items.product', 'name sku price')
      .populate('createdBy', 'name email');

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, managerOrAdmin, async (req, res) => {
  try {
    const {
      type,
      supplier,
      customerName,
      customerEmail,
      items,
      tax,
      discount,
      notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        message: 'Please add at least one item to the order' 
      });
    }

    let subtotal = 0;
    const orderItems = [];
    const productUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ 
          message: `Product not found: ${item.product}` 
        });
      }

      if (type === 'sale') {
        if (product.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` 
          });
        }
      }

      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal
      });

      productUpdates.push({
        product: product,
        quantity: item.quantity
      });
    }

    const totalAmount = subtotal + (tax || 0) - (discount || 0);

    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    const orderData = {
      orderNumber,
      type,
      items: orderItems,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      totalAmount,
      notes,
      createdBy: req.user._id
    };

    if (type === 'purchase' && supplier) {
      orderData.supplier = supplier;
    } else if (type === 'sale') {
      if (customerName) orderData.customerName = customerName;
      if (customerEmail) orderData.customerEmail = customerEmail;
    }

    const order = new Order(orderData);
    const createdOrder = await order.save();

    for (const update of productUpdates) {
      if (type === 'purchase') {
        update.product.quantity += update.quantity;
      } else if (type === 'sale') {
        update.product.quantity -= update.quantity;
      }
      await update.product.save();
    }

    const emailTo = type === 'sale' ? customerEmail : req.user.email;
    if (emailTo) {
      try {
        const populatedOrder = await Order.findById(createdOrder._id)
          .populate('items.product', 'name');
        await sendOrderConfirmation(emailTo, populatedOrder);
      } catch (emailError) {
        console.error('Failed to send order confirmation:', emailError);
      }
    }

    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('supplier', 'name email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.body.status) order.status = req.body.status;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
    if (req.body.notes !== undefined) order.notes = req.body.notes;

    const updatedOrder = await order.save();

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('supplier', 'name email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name');

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product);
      
      if (product) {
        if (order.type === 'purchase') {
          product.quantity -= item.quantity;
        } else if (order.type === 'sale') {
          product.quantity += item.quantity;
        }
        await product.save();
      }
    }

    await order.deleteOne();
    res.json({ message: 'Order cancelled and inventory restored' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;