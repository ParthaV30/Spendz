const db = require('../db');

class BudgetRepository {
  async upsert(userId, categoryId, amount, period = 'monthly') {
    const result = await db.query(
      `INSERT INTO budgets (user_id, category_id, amount, period)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category_id, period)
       DO UPDATE SET amount = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, categoryId, amount, period]
    );
    return result.rows[0];
  }

  async findByUserAndPeriod(userId, period = 'monthly') {
    const result = await db.query(
      `SELECT b.*, c.name as category_name, c.color
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = $1 AND b.period = $2
       ORDER BY c.name`,
      [userId, period]
    );
    return result.rows;
  }

  async getStatus(userId, startDate, endDate) {
    const result = await db.query(
      `SELECT
        c.id,
        c.name,
        c.color,
        COALESCE(b.amount, 0) as limit_minor,
        COALESCE(SUM(e.amount), 0) as spent_minor,
        CASE
          WHEN b.amount IS NULL THEN NULL
          ELSE COALESCE(b.amount, 0) - COALESCE(SUM(e.amount), 0)
        END as remaining_minor,
        CASE
          WHEN b.amount IS NULL OR b.amount = 0 THEN 0
          ELSE (COALESCE(SUM(e.amount), 0)::float / b.amount::float) * 100
        END as percent_used
      FROM categories c
      LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = $1
      LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $1 AND e.expense_date >= $2 AND e.expense_date <= $3
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.color, b.amount
      ORDER BY c.name`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  }
}

module.exports = new BudgetRepository();
