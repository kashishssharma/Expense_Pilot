/**
 * In-Memory Sliding Window Rate Limiter Middleware.
 * Prevents brute-force authentication attacks on login and registration routes.
 *
 * Interview Note: Implemented as a lightweight sliding window counter per IP 
 * to demonstrate rate-limiting mechanics without adding external Redis dependencies.
 */
const config = require('../config');
const Logger = require('../config/logger');

const requests = new Map();

function authRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.max;

  if (!requests.has(ip)) {
    requests.set(ip, []);
  }

  const timestamps = requests.get(ip).filter(ts => now - ts < windowMs);

  if (timestamps.length >= maxRequests) {
    Logger.warn(`Rate limit exceeded for IP: ${ip} on route ${req.path}`);
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    });
  }

  timestamps.push(now);
  requests.set(ip, timestamps);

  next();
}

// Cleanup stale IP entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  for (const [ip, timestamps] of requests.entries()) {
    const valid = timestamps.filter(ts => now - ts < windowMs);
    if (valid.length === 0) {
      requests.delete(ip);
    } else {
      requests.set(ip, valid);
    }
  }
}, 10 * 60 * 1000).unref();

module.exports = { authRateLimiter };
