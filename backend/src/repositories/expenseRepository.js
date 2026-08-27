const db = require('../db');

class ExpenseRepository {
  async create(userId, categoryId, amount, description, expenseDate) {
    const result = await db.query(
      'INSERT INTO expenses (user_id, category_id, amount, description, expense_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, categoryId, amount, description, expenseDate]
    );
    return result.rows[0];
  }

  async findById(id, userId) {
    const result = await db.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  }

  async findAll(userId, filters = {}) {
    let query = 'SELECT e.*, c.name as category_name FROM expenses e JOIN categories c ON e.category_id = c.id WHERE e.user_id = $1';
    const params = [userId];
    let paramCount = 2;

    if (filters.categoryId) {
      query += ` AND e.category_id = $${paramCount}`;
      params.push(filters.categoryId);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND e.expense_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND e.expense_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ' ORDER BY e.expense_date DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  async update(id, userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    });

    values.push(id, userId);

    const result = await db.query(
      `UPDATE expenses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  }

  async getSummary(userId, startDate, endDate) {
    const result = await db.query(
      `SELECT
        c.id, c.name, c.color,
        COALESCE(SUM(e.amount), 0) as total,
        COUNT(e.id) as count
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $1 AND e.expense_date >= $2 AND e.expense_date <= $3
      WHERE c.user_id = $1
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }
}

module.exports = new ExpenseRepository();
