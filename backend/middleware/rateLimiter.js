const rateLimit = require('express-rate-limit');

// Auth rate limiter: 5 requests per minute
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Checkout rate limiter: 10 requests per minute
const checkoutLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Terlalu banyak permintaan checkout. Silakan tunggu sebentar.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public API rate limiter: 100 requests per minute
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Terlalu banyak permintaan ke API. Silakan coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment callback rate limiter: 50 requests per minute
const callbackLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: {
    error: 'Terlalu banyak callback request.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  checkoutLimiter,
  apiLimiter,
  callbackLimiter
};
