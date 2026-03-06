const rateLimit = require('express-rate-limit');

// Memory-based rate limiting
const memoryRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable legacy headers
    skip: (req) => {
      // Skip rate limiting for certain routes
      return req.path.includes('/health') || 
             req.path.includes('/static') ||
             process.env.NODE_ENV === 'test';
    }
  });
};

// Predefined rate limiters for different use cases

// General API rate limiting
const apiRateLimit = memoryRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many API requests, please try again later.'
);

// Strict rate limiting for sensitive endpoints
const strictRateLimit = memoryRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // 20 requests
  'Too many attempts, please try again later.'
);

// Very strict rate limiting for auth endpoints
const authRateLimit = memoryRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  'Too many authentication attempts, please try again later.'
);

// Upload rate limiting
const uploadRateLimit = memoryRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads
  'Too many uploads, please try again later.'
);

// Search rate limiting
const searchRateLimit = memoryRateLimit(
  60 * 1000, // 1 minute
  30, // 30 searches
  'Too many search requests, please slow down.'
);

// Create post rate limiting
const createPostRateLimit = memoryRateLimit(
  60 * 60 * 1000, // 1 hour
  5, // 5 posts
  'Too many posts created, please wait before posting again.'
);

// Read operations rate limiting (more lenient)
const readRateLimit = memoryRateLimit(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests
  'Too many read requests, please slow down.'
);

// Message rate limiting
const messageRateLimit = memoryRateLimit(
  60 * 1000, // 1 minute
  20, // 20 messages
  'Too many messages, please slow down.'
);

// Dynamic rate limiting based on user tier
const dynamicRateLimit = (req, res, next) => {
  const user = req.user;
  let windowMs = 15 * 60 * 1000; // 15 minutes default
  let max = 100; // 100 requests default
  let message = 'Too many requests, please try again later.';

  if (user) {
    if (user.isAdmin) {
      max = 1000; // Admins get higher limits
    } else if (user.premium) {
      max = 500; // Premium users get higher limits
    } else {
      max = 100; // Regular users
    }
  }

  const limiter = memoryRateLimit(windowMs, max, message);
  return limiter(req, res, next);
};

// Custom rate limiting with flexible options
const customRateLimit = (options) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = null,
    skip = null
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: keyGenerator || ((req) => req.ip),
    skip: skip || (() => false)
  });
};

module.exports = {
  memoryRateLimit,
  apiRateLimit,
  strictRateLimit,
  authRateLimit,
  uploadRateLimit,
  searchRateLimit,
  createPostRateLimit,
  readRateLimit,
  messageRateLimit,
  dynamicRateLimit,
  customRateLimit
};
