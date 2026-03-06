const helmet = require('helmet');

// Advanced caching middleware factory
const cacheMiddleware = (options = {}) => {
  const {
    maxAge = 3600, // 1 hour default
    private = false,
    noStore = false,
    noCache = false,
    mustRevalidate = false,
    etag = true,
    lastModified = true,
    staleWhileRevalidate = 0,
    immutable = false
  } = options;

  return (req, res, next) => {
    if (noStore) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    } else if (noCache) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    } else {
      let cacheControl = `max-age=${maxAge}`;
      
      if (private) {
        cacheControl += ', private';
      } else {
        cacheControl += ', public';
      }
      
      if (mustRevalidate) {
        cacheControl += ', must-revalidate';
      }
      
      if (immutable) {
        cacheControl += ', immutable';
      }
      
      if (staleWhileRevalidate > 0) {
        cacheControl += `, stale-while-revalidate=${staleWhileRevalidate}`;
      }
      
      res.setHeader('Cache-Control', cacheControl);
      
      if (etag) {
        res.setHeader('ETag', `"${Date.now()}"`);
      }
      
      if (lastModified) {
        res.setHeader('Last-Modified', new Date().toUTCString());
      }
    }
    
    next();
  };
};

// Static asset caching (30 days, immutable)
const staticAssetCache = cacheMiddleware({
  maxAge: 86400 * 30, // 30 days
  public: true,
  etag: true,
  lastModified: true,
  immutable: true
});

// API response caching (5 minutes)
const apiCache = cacheMiddleware({
  maxAge: 300, // 5 minutes
  private: true,
  mustRevalidate: true,
  etag: true
});

// Long-term caching for rarely changing data
const longTermCache = cacheMiddleware({
  maxAge: 86400 * 7, // 7 days
  public: true,
  mustRevalidate: false,
  staleWhileRevalidate: 86400 // 1 day stale-while-revalidate
});

// Stale-while-revalidate for semi-static content
const staleWhileRevalidateCache = cacheMiddleware({
  maxAge: 3600, // 1 hour
  public: true,
  staleWhileRevalidate: 86400, // 1 day
  mustRevalidate: false
});

// Sensitive data - no caching
const noCache = cacheMiddleware({
  noStore: true
});

// Negotiated caching for dynamic content
const negotiatedCache = cacheMiddleware({
  maxAge: 60, // 1 minute
  private: true,
  mustRevalidate: true,
  etag: true
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'self'", "https://drive.google.com", "https://docs.google.com", "https://accounts.google.com"],
      frameAncestors: ["'self'", "https://drive.google.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Conditional caching based on request
const conditionalCache = (condition, cacheOptions) => {
  return (req, res, next) => {
    if (condition(req)) {
      return cacheMiddleware(cacheOptions)(req, res, next);
    }
    next();
  };
};

// Cache busting for development
const devCacheBust = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
};

module.exports = {
  cacheMiddleware,
  staticAssetCache,
  apiCache,
  longTermCache,
  staleWhileRevalidateCache,
  negotiatedCache,
  noCache,
  securityHeaders,
  conditionalCache,
  devCacheBust
};
