/**
 * Global Error Handler Middleware.
 * Standardizes API error responses and logs unhandled exceptions.
 */
const Logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  Logger.error(`Unhandled error on ${req.method} ${req.path}`, err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body format in request.' });
  }

  const statusCode = err.statusCode || 500;
  const responseMessage = statusCode === 500 ? 'Internal server error.' : err.message;

  res.status(statusCode).json({
    success: false,
    message: responseMessage
  });
}

module.exports = { errorHandler };
