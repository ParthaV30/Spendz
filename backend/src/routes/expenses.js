const express = require('express');
const router = express.Router();
const expenseRepository = require('../repositories/expenseRepository');
const categoryRepository = require('../repositories/categoryRepository');

// Get all expenses with filters
router.get('/', async (req, res, next) => {
  try {
    const { categoryId, startDate, endDate } = req.query;

    const filters = {};
    if (categoryId) filters.categoryId = categoryId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const expenses = await expenseRepository.findAll(req.userId, filters);

    res.json({
      data: { expenses }
    });
  } catch (err) {
    next(err);
  }
});

// Create expense
router.post('/', async (req, res, next) => {
  try {
    const { categoryId, amount, description, expenseDate } = req.body;

    if (!categoryId || !amount || !expenseDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify category belongs to user
    const category = await categoryRepository.findById(categoryId, req.userId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const expense = await expenseRepository.create(
      req.userId,
      categoryId,
      amount,
      description,
      expenseDate
    );

    res.status(201).json({
      data: { expense }
    });
  } catch (err) {
    next(err);
  }
});

// Get single expense
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await expenseRepository.findById(req.params.id, req.userId);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({
      data: { expense }
    });
  } catch (err) {
    next(err);
  }
});

// Update expense
router.patch('/:id', async (req, res, next) => {
  try {
    const { amount, categoryId, description, expenseDate } = req.body;
    const updates = {};

    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }
      updates.amount = amount;
    }

    if (categoryId !== undefined) {
      const category = await categoryRepository.findById(categoryId, req.userId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      updates.category_id = categoryId;
    }

    if (description !== undefined) updates.description = description;
    if (expenseDate !== undefined) updates.expense_date = expenseDate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const expense = await expenseRepository.update(req.params.id, req.userId, updates);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({
      data: { expense }
    });
  } catch (err) {
    next(err);
  }
});

// Delete expense
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await expenseRepository.delete(req.params.id, req.userId);

    if (!result) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
