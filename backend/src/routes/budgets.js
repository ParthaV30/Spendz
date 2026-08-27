const express = require('express');
const router = express.Router();
const budgetRepository = require('../repositories/budgetRepository');

// Get budget status for a date range
router.get('/status', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate required' });
    }

    const status = await budgetRepository.getStatus(req.userId, startDate, endDate);

    const budgets = status.map(b => ({
      categoryId: b.id,
      categoryName: b.name,
      categoryColor: b.color,
      limitMinor: parseInt(b.limit_minor),
      spentMinor: parseInt(b.spent_minor),
      remainingMinor: b.remaining_minor ? parseInt(b.remaining_minor) : null,
      percentUsed: parseFloat(b.percent_used),
      status: parseFloat(b.percent_used) > 100 ? 'exceeded' : parseFloat(b.percent_used) >= 80 ? 'warning' : 'ok'
    }));

    res.json({
      data: { budgets }
    });
  } catch (err) {
    next(err);
  }
});

// Upsert budget
router.put('/', async (req, res, next) => {
  try {
    const { categoryId, amount, period = 'monthly' } = req.body;

    if (!categoryId || !amount) {
      return res.status(400).json({ error: 'categoryId and amount required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const budget = await budgetRepository.upsert(req.userId, categoryId, amount, period);

    res.json({
      data: { budget }
    });
  } catch (err) {
    next(err);
  }
});

// Delete budget
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await budgetRepository.delete(req.params.id, req.userId);

    if (!result) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
