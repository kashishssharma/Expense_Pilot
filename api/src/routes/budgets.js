/**
 * Budget routes — CRUD for monthly category budgets.
 * All routes are protected by JWT authentication.
 *
 * GET    /api/budgets          — List all budgets for the user
 * GET    /api/budgets/summary  — Budget vs actual spending summary for current month
 * POST   /api/budgets          — Create or update a budget
 * PUT    /api/budgets/:id      — Update a budget's limit
 * DELETE /api/budgets/:id      — Delete a budget
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/pool');

const router = express.Router();
router.use(authenticate);

const budgetValidation = [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('monthly_limit').isFloat({ gt: 0 }).withMessage('Monthly limit must be a positive number')
];

// ═══════════════════════════════════════════════════════════
// GET /api/budgets
// Returns all budgets for the authenticated user along with
// the current month's actual spending per category.
// ═══════════════════════════════════════════════════════════
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Get budgets with current month spending
    const result = await db.query(`
      SELECT
        b.id, b.category, b.monthly_limit,
        COALESCE(SUM(e.amount), 0) AS current_spent
      FROM budgets b
      LEFT JOIN expenses e
        ON e.user_id = b.user_id
        AND e.category = b.category
        AND EXTRACT(MONTH FROM e.date) = $2
        AND EXTRACT(YEAR FROM e.date) = $3
      WHERE b.user_id = $1
      GROUP BY b.id, b.category, b.monthly_limit
      ORDER BY b.category
    `, [userId, month, year]);

    const budgets = result.rows.map(b => ({
      id: b.id,
      category: b.category,
      monthlyLimit: parseFloat(b.monthly_limit),
      currentSpent: parseFloat(b.current_spent),
      percentage: b.monthly_limit > 0
        ? Math.round((parseFloat(b.current_spent) / parseFloat(b.monthly_limit)) * 100)
        : 0,
      status: parseFloat(b.current_spent) >= parseFloat(b.monthly_limit) ? 'exceeded'
            : parseFloat(b.current_spent) >= parseFloat(b.monthly_limit) * 0.8 ? 'warning'
            : 'on_track'
    }));

    res.json({ success: true, data: budgets });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/budgets/summary
// Returns an overview: total budget, total spent, remaining, over-budget categories.
// ═══════════════════════════════════════════════════════════
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const result = await db.query(`
      SELECT
        b.category, b.monthly_limit,
        COALESCE(SUM(e.amount), 0) AS current_spent
      FROM budgets b
      LEFT JOIN expenses e
        ON e.user_id = b.user_id AND e.category = b.category
        AND EXTRACT(MONTH FROM e.date) = $2 AND EXTRACT(YEAR FROM e.date) = $3
      WHERE b.user_id = $1
      GROUP BY b.category, b.monthly_limit
    `, [userId, month, year]);

    const totalBudget = result.rows.reduce((sum, r) => sum + parseFloat(r.monthly_limit), 0);
    const totalSpent = result.rows.reduce((sum, r) => sum + parseFloat(r.current_spent), 0);
    const overBudget = result.rows.filter(r => parseFloat(r.current_spent) > parseFloat(r.monthly_limit));

    res.json({
      success: true,
      data: {
        month, year,
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        remaining: Math.round((totalBudget - totalSpent) * 100) / 100,
        percentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        overBudgetCategories: overBudget.map(r => ({
          category: r.category,
          limit: parseFloat(r.monthly_limit),
          spent: parseFloat(r.current_spent)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/budgets
// Creates a new budget. If the user already has a budget for this category,
// it updates the existing one (upsert).
// ═══════════════════════════════════════════════════════════
router.post('/', budgetValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { category, monthly_limit } = req.body;
    const userId = req.user.id;

    // Upsert: insert or update on conflict
    const result = await db.query(`
      INSERT INTO budgets (user_id, category, monthly_limit)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, category)
      DO UPDATE SET monthly_limit = $3
      RETURNING id, category, monthly_limit, created_at
    `, [userId, category, monthly_limit]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// PUT /api/budgets/:id
// Updates a budget's monthly limit.
// ═══════════════════════════════════════════════════════════
router.put('/:id', async (req, res, next) => {
  try {
    const { monthly_limit } = req.body;
    if (!monthly_limit || monthly_limit <= 0) {
      return res.status(400).json({ success: false, message: 'Valid monthly_limit is required.' });
    }

    const result = await db.query(
      'UPDATE budgets SET monthly_limit = $1 WHERE id = $2 AND user_id = $3 RETURNING id, category, monthly_limit',
      [monthly_limit, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE /api/budgets/:id
// ═══════════════════════════════════════════════════════════
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Budget not found.' });
    }

    res.json({ success: true, message: 'Budget deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
