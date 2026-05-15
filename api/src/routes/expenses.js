/**
 * Expense routes — full CRUD with filtering, search, and pagination.
 * All routes are protected by JWT authentication.
 *
 * GET    /api/expenses       — List expenses (with filters & pagination)
 * GET    /api/expenses/:id   — Get single expense
 * POST   /api/expenses       — Create expense
 * PUT    /api/expenses/:id   — Update expense
 * DELETE /api/expenses/:id   — Delete expense
 */
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/pool');

const router = express.Router();

// All expense routes require authentication
router.use(authenticate);

// ─── Validation Rules ────────────────────────────────────
const expenseValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
  body('notes').optional().trim()
];

// ═══════════════════════════════════════════════════════════
// GET /api/expenses
// Lists expenses for the authenticated user.
// Supports: ?page=1&limit=20&category=Food&startDate=2026-01-01&endDate=2026-12-31&search=coffee
// ═══════════════════════════════════════════════════════════
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, category, startDate, endDate, search, sortBy = 'date', sortOrder = 'DESC' } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let conditions = ['user_id = $1'];
    let params = [userId];
    let idx = 2;

    // Apply filters
    if (category) {
      conditions.push(`category = $${idx++}`);
      params.push(category);
    }
    if (startDate) {
      conditions.push(`date >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`date <= $${idx++}`);
      params.push(endDate);
    }
    if (search) {
      conditions.push(`(notes ILIKE $${idx} OR category ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    // Validate sort column to prevent SQL injection
    const allowedSort = ['date', 'amount', 'category', 'created_at'];
    const sort = allowedSort.includes(sortBy) ? sortBy : 'date';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total matching records
    const countResult = await db.query(`SELECT COUNT(*) FROM expenses WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Fetch paginated results
    params.push(parseInt(limit), offset);
    const result = await db.query(
      `SELECT id, amount, category, date, notes, created_at
       FROM expenses WHERE ${where}
       ORDER BY ${sort} ${order}
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/expenses/:id
// Returns a single expense by ID (must belong to the authenticated user).
// ═══════════════════════════════════════════════════════════
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, amount, category, date, notes, created_at FROM expenses WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/expenses
// Creates a new expense for the authenticated user.
// Also updates the corresponding budget's current spending.
// ═══════════════════════════════════════════════════════════
router.post('/', expenseValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { amount, category, date, notes } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      `INSERT INTO expenses (user_id, amount, category, date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, amount, category, date, notes, created_at`,
      [userId, amount, category, date, notes || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// PUT /api/expenses/:id
// Updates an existing expense (must belong to the authenticated user).
// ═══════════════════════════════════════════════════════════
router.put('/:id', expenseValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { amount, category, date, notes } = req.body;

    const result = await db.query(
      `UPDATE expenses SET amount = $1, category = $2, date = $3, notes = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, amount, category, date, notes, created_at`,
      [amount, category, date, notes || null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE /api/expenses/:id
// Deletes an expense (must belong to the authenticated user).
// ═══════════════════════════════════════════════════════════
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }

    res.json({ success: true, message: 'Expense deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
