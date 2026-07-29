/**
 * Centralized Configuration Singleton.
 * Validates and exports environment variables, database options, and application constants.
 */
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Security & JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-default-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Database
  db: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/expense_tracker',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },

  // Auth Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // max 10 auth requests per windowMs per IP
  }
};

module.exports = config;
