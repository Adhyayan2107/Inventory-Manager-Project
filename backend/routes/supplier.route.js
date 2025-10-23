const express = require('express');
const router = express.Router();
const Supplier = require('../models/supplier.model.js');
const { protect, managerOrAdmin } = require('../middlewares/auth.middleware');

router.get('/', protect, async (req, res) => {
  try {
    const { search, isActive } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, managerOrAdmin, async (req, res) => {
  try {
    const { name, email, phone, address, contactPerson, rating, notes } = req.body;

    const supplier = new Supplier({
      name,
      email,
      phone,
      address,
      contactPerson,
      rating,
      notes
    });

    const createdSupplier = await supplier.save();
    res.status(201).json(createdSupplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      Object.assign(supplier, req.body);
      const updatedSupplier = await supplier.save();
      res.json(updatedSupplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      await supplier.deleteOne();
      res.json({ message: 'Supplier removed' });
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;