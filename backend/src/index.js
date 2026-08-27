require('dotenv').config();
const db = require('./db');
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
