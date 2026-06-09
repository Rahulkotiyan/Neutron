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
  300, // 300 requests
  'Too many API requests, please try again later.',
  'api-general'
);

// Very strict rate limiting for auth endpoints
const authRateLimit = memoryRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests
  'Too many authentication attempts, please try again later.',
  'api-auth'
);

// Upload rate limiting
const uploadRateLimit = memoryRateLimit(
  60 * 60 * 1000, // 1 hour
  20, // 20 uploads
  'Too many uploads, please try again later.',
  'api-upload'
);

// Search rate limiting
const searchRateLimit = memoryRateLimit(
  60 * 1000, // 1 minute
  50, // 50 searches
  'Too many search requests, please slow down.',
  'api-search'
);

// Create post rate limiting
const createPostRateLimit = memoryRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 posts
  'Too many posts created, please wait before posting again.',
  'api-create-post'
);

// Read operations rate limiting (more lenient)
const readRateLimit = memoryRateLimit(
  15 * 60 * 1000, // 15 minutes
  500, // 500 requests
  'Too many read requests, please slow down.',
  'api-read'
);

// Message rate limiting
const messageRateLimit = memoryRateLimit(
  60 * 1000, // 1 minute
  30, // 30 messages
  'Too many messages, please slow down.',
  'api-messages'
);

module.exports = {
  memoryRateLimit,
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  searchRateLimit,
  createPostRateLimit,
  readRateLimit,
  messageRateLimit,
};
