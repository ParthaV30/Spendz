const db = require('../db');
const bcrypt = require('bcryptjs');

class UserRepository {
  async create(email, password, name) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await db.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await db.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async verifyPassword(hashedPassword, plainPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new UserRepository();
