const express = require('express');
const router = express.Router();
const categoryRepository = require('../repositories/categoryRepository');

// Get all categories for user
router.get('/', async (req, res, next) => {
  try {
    const categories = await categoryRepository.findAll(req.userId);
    res.json({
      data: { categories }
    });
  } catch (err) {
    next(err);
  }
});

// Create category
router.post('/', async (req, res, next) => {
  try {
    const { name, color = '#3b82f6', icon } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await categoryRepository.create(req.userId, name, color, icon);
    res.status(201).json({
      data: { category }
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    next(err);
  }
});

// Update category
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const category = await categoryRepository.update(req.params.id, req.userId, updates);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      data: { category }
    });
  } catch (err) {
    next(err);
  }
});

// Delete category
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await categoryRepository.delete(req.params.id, req.userId);

    if (!result) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
