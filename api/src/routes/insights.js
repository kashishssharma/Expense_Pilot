/**
 * Financial Insights Routes — Express service layer powered analytics & rule-based insights.
 * All routes are protected by JWT authentication.
 *
 * GET /api/insights           — Rule-based financial insights & budget recommendations
 * GET /api/analytics/overview — Dashboard stats computed directly from PostgreSQL
 * GET /api/analytics/spending — Weekly patterns and spending breakdowns
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const InsightsService = require('../services/insightsService');
const db = require('../db/pool');

const router = express.Router();
router.use(authenticate);

// ═══════════════════════════════════════════════════════════
// GET /api/insights
// Rule-based financial insights & savings advice
// ═══════════════════════════════════════════════════════════
router.get('/insights', async (req, res, next) => {
  try {
    const result = await InsightsService.generateInsights(req.user.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/analytics/overview
// Dashboard statistics computed directly from PostgreSQL
// ═══════════════════════════════════════════════════════════
router.get('/analytics/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await InsightsService.getOverviewStats(userId);

    const totalCount = await db.query(
      'SELECT COUNT(*) FROM expenses WHERE user_id = $1', [userId]
    );

    const recentExpenses = await db.query(`
      SELECT id, amount, category, date, notes
      FROM expenses WHERE user_id = $1
      ORDER BY date DESC, created_at DESC LIMIT 5
    `, [userId]);

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

    res.json({
      success: true,
      data: {
        currentMonth: {
          total: stats.monthlyTotal,
          transactionCount: stats.transactionCount
        },
        lastMonth: { total: stats.lastMonthTotal },
        changePercent: stats.changePercentage,
        topCategory: stats.topCategory,
        categoryBreakdown: stats.categoryBreakdown,
        totalExpenses: parseInt(totalCount.rows[0].count, 10),
        recentExpenses: recentExpenses.rows,
        monthlyTrend: monthlyTrend.rows.map(r => ({
          month: `${parseInt(r.year, 10)}-${String(parseInt(r.month, 10)).padStart(2, '0')}`,
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
// Weekly pattern and category spending breakdown
// ═══════════════════════════════════════════════════════════
router.get('/analytics/spending', async (req, res, next) => {
  try {
    const weeklyData = await InsightsService.getWeeklyPattern(req.user.id);
    const overview = await InsightsService.getOverviewStats(req.user.id);

    res.json({
      success: true,
      data: {
        weeklyPattern: weeklyData.weeklyPattern,
        categories: overview.categoryBreakdown,
        totalSpent: overview.monthlyTotal,
        transactionCount: overview.transactionCount
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
