/**
 * Server entry point.
 * Loads environment variables, verifies DB connection, and starts Express.
 */
require('dotenv').config();
const app = require('./app');
const db = require('./db/pool');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Verify database connection
    const result = await db.query('SELECT NOW()');
    console.log(`✅ PostgreSQL connected at ${result.rows[0].now}`);

    app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
