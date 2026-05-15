/**
 * Express application setup.
 * Configures middleware, routes, and error handling.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budgets');
const analyticsRoutes = require('./routes/analytics');
const goalsRoutes = require('./routes/goals');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Security & Parsing ─────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// ─── Health Check ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'expense-tracker-api', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalsRoutes);

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ────────────────────────────────
app.use(errorHandler);

module.exports = app;
