const { validationResult } = require('express-validator');

/**
 * Validation Middleware — Intercepts request validation errors from express-validator
 * and returns standardized 400 Bad Request responses before hitting the service layer.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

module.exports = { validate };
