/**
 * Express application setup.
 * Configures middleware, security, routes, and global error handling.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const insightsRoutes = require('./routes/insights');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Security & Middleware ──────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// Request logging format
if (config.env !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// ─── Health Check Endpoint ──────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'expense-tracker-api',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes Mounting ────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api', insightsRoutes);

// ─── 404 Route Handler ──────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ─── Global Error Handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;
