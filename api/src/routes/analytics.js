/**
 * Analytics routes — proxy requests to the Python/Django intelligence service.
 * All routes are protected by JWT authentication.
 *
 * GET /api/analytics/spending    — Spending patterns from intelligence service
 * GET /api/analytics/anomalies   — Anomaly detection
 * GET /api/analytics/predictions — Spending predictions
 * GET /api/analytics/recommendations — Personalized budget recommendations
 * GET /api/analytics/overview    — Quick stats computed locally (no ML needed)
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../db/pool');

const router = express.Router();
router.use(authenticate);

const INTELLIGENCE_URL = process.env.INTELLIGENCE_URL || 'http://localhost:8000';

// ─── Helper: Proxy to intelligence service ───────────────
async function proxyToIntelligence(path, userId, queryParams = {}) {
  const url = new URL(`${INTELLIGENCE_URL}${path}`);
  url.searchParams.set('user_id', userId);
  for (const [key, val] of Object.entries(queryParams)) {
    if (val !== undefined) url.searchParams.set(key, val);
  }

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Intelligence service error (${response.status}): ${text}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════
// GET /api/analytics/overview
// Quick dashboard stats computed directly from PostgreSQL.
// No ML — just SQL aggregations for speed.
// ═══════════════════════════════════════════════════════════
router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Total spending this month
    const monthlyTotal = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, month, year]);

    // Total spending last month (for comparison)
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastYear = month === 1 ? year - 1 : year;
    const lastMonthTotal = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [userId, lastMonth, lastYear]);

    // Spending by category this month
    const categoryBreakdown = await db.query(`
      SELECT category, SUM(amount) AS total, COUNT(*) AS count
      FROM expenses
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
      GROUP BY category ORDER BY total DESC
    `, [userId, month, year]);

    // Total expense count
    const totalCount = await db.query(
      'SELECT COUNT(*) FROM expenses WHERE user_id = $1', [userId]
    );

    // Recent 5 expenses
    const recentExpenses = await db.query(`
      SELECT id, amount, category, date, notes
      FROM expenses WHERE user_id = $1
      ORDER BY date DESC, created_at DESC LIMIT 5
    `, [userId]);

    // Monthly trend (last 6 months)
    const monthlyTrend = await db.query(`
      SELECT
        EXTRACT(YEAR FROM date) AS year,
        EXTRACT(MONTH FROM date) AS month,
        SUM(amount) AS total
      FROM expenses
      WHERE user_id = $1 AND date >= NOW() - INTERVAL '6 months'
      GROUP BY year, month
      ORDER BY year, month
    `, [userId]);

    const currentTotal = parseFloat(monthlyTotal.rows[0].total);
    const prevTotal = parseFloat(lastMonthTotal.rows[0].total);
    const changePercent = prevTotal > 0 ? Math.round(((currentTotal - prevTotal) / prevTotal) * 100) : 0;

    res.json({
      success: true,
      data: {
        currentMonth: {
          total: currentTotal,
          transactionCount: categoryBreakdown.rows.reduce((sum, r) => sum + parseInt(r.count), 0)
        },
        lastMonth: { total: prevTotal },
        changePercent,
        topCategory: categoryBreakdown.rows[0] || null,
        categoryBreakdown: categoryBreakdown.rows.map(r => ({
          category: r.category,
          total: parseFloat(r.total),
          count: parseInt(r.count)
        })),
        totalExpenses: parseInt(totalCount.rows[0].count),
        recentExpenses: recentExpenses.rows,
        monthlyTrend: monthlyTrend.rows.map(r => ({
          month: `${parseInt(r.year)}-${String(parseInt(r.month)).padStart(2, '0')}`,
          total: parseFloat(r.total)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/analytics/spending
// Proxies to Django intelligence service for ML-powered spending analysis.
// ═══════════════════════════════════════════════════════════
router.get('/spending', async (req, res, next) => {
  try {
    const data = await proxyToIntelligence('/api/analytics/spending/', req.user.id, { months: req.query.months });
    res.json(data);
  } catch (error) {
    console.error('Intelligence service error (spending):', error.message);
    res.status(502).json({ success: false, message: 'Analytics service is unavailable. Try again later.' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/analytics/anomalies
// Proxies to Django for anomaly detection.
// ═══════════════════════════════════════════════════════════
router.get('/anomalies', async (req, res, next) => {
  try {
    const data = await proxyToIntelligence('/api/analytics/anomalies/', req.user.id, { sensitivity: req.query.sensitivity });
    res.json(data);
  } catch (error) {
    console.error('Intelligence service error (anomalies):', error.message);
    res.status(502).json({ success: false, message: 'Analytics service is unavailable. Try again later.' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/analytics/predictions
// Proxies to Django for spending predictions.
// ═══════════════════════════════════════════════════════════
router.get('/predictions', async (req, res, next) => {
  try {
    const data = await proxyToIntelligence('/api/analytics/predictions/', req.user.id, { months: req.query.months });
    res.json(data);
  } catch (error) {
    console.error('Intelligence service error (predictions):', error.message);
    res.status(502).json({ success: false, message: 'Analytics service is unavailable. Try again later.' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/analytics/recommendations
// Proxies to Django for personalized budget recommendations.
// ═══════════════════════════════════════════════════════════
router.get('/recommendations', async (req, res, next) => {
  try {
    const data = await proxyToIntelligence('/api/analytics/recommendations/', req.user.id);
    res.json(data);
  } catch (error) {
    console.error('Intelligence service error (recommendations):', error.message);
    res.status(502).json({ success: false, message: 'Analytics service is unavailable. Try again later.' });
  }
});

module.exports = router;
