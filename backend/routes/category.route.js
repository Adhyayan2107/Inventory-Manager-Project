const express = require('express');
const router = express.Router();
const Category = require('../models/category.model.js');
const { protect, managerOrAdmin } = require('../middlewares/auth.middleware.js');

router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate('parentCategory', 'name')
      .sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parentCategory', 'name');

    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, managerOrAdmin, async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name,
      description,
      parentCategory
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = req.body.name || category.name;
      category.description = req.body.description || category.description;
      category.parentCategory = req.body.parentCategory !== undefined 
        ? req.body.parentCategory 
        : category.parentCategory;
      category.isActive = req.body.isActive !== undefined 
        ? req.body.isActive 
        : category.isActive;

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      await category.deleteOne();
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;