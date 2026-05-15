const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db/pool');

const router = express.Router();
router.use(authenticate);

const goalValidation = [
  body('name').trim().notEmpty().withMessage('Goal name is required'),
  body('target_amount').isFloat({ gt: 0 }).withMessage('Target amount must be a positive number'),
  body('current_amount').optional().isFloat({ min: 0 }).withMessage('Current amount must be positive or zero'),
  body('target_date').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate().withMessage('Target date must be a valid date')
];

// GET /api/goals
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/goals
router.post('/', goalValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, target_amount, current_amount = 0, target_date } = req.body;
    
    const result = await db.query(`
      INSERT INTO goals (user_id, name, target_amount, current_amount, target_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.user.id, name, target_amount, current_amount, target_date || null]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /api/goals/:id
router.put('/:id', goalValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { name, target_amount, current_amount = 0, target_date } = req.body;
    
    const result = await db.query(`
      UPDATE goals 
      SET name = $1, target_amount = $2, current_amount = $3, target_date = $4
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `, [name, target_amount, current_amount, target_date || null, req.params.id, req.user.id]);

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Goal not found.' });

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Goal not found.' });
    res.json({ success: true, message: 'Goal deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
