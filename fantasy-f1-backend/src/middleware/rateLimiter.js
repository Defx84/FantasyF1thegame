const rateLimit = require('express-rate-limit');

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More lenient in development
  message: JSON.stringify({ error: 'Too many requests from this IP, please try again later' }),
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // More lenient in development
  message: JSON.stringify({ error: 'Too many auth attempts, please try again later' }),
  standardHeaders: true,
  legacyHeaders: false
});

// Very strict limiter for sensitive operations
const sensitiveLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More lenient in development
  message: JSON.stringify({ error: 'Too many sensitive operations, please try again later' }),
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  sensitiveLimiter
}; 