/**
 * PostgreSQL connection pool singleton.
 * Uses centralized config and structured logging.
 */
const { Pool } = require('pg');
const config = require('../config');
const Logger = require('../config/logger');

const pool = new Pool({
  connectionString: config.db.connectionString,
  ssl: config.db.ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('connect', () => {
  Logger.info('New client connected to PostgreSQL pool');
});

pool.on('error', (err) => {
  Logger.error('Unexpected PostgreSQL pool error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
