const cache = new Map();
const DEFAULT_TTL = 60 * 1000;

const getCacheKey = (req) => {
  if (req.user?._id) return `${req.originalUrl}|${req.user._id}`;
  return req.originalUrl;
};

exports.cacheMiddleware = (ttl = DEFAULT_TTL, swrTtl = 0) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = getCacheKey(req);
    const cached = cache.get(key);

    if (cached) {
      const age = Date.now() - cached.ts;
      // Fresh cache hit
      if (age < ttl) {
        return res.json(cached.data);
      }
      // Stale-while-revalidate: serve stale data, next request gets fresh
      if (age < ttl + swrTtl) {
        return res.json(cached.data);
      }
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, ts: Date.now() });
      originalJson(data);
    };
    next();
  };
};

exports.clearCache = (pattern) => {
  if (!pattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
};

exports.clearOnSuccess = (...patternFns) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      originalJson(data);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patternFns.forEach(fn => {
          const pattern = typeof fn === 'function' ? fn(req) : fn;
          if (pattern) exports.clearCache(pattern);
        });
      }
    };
    next();
  };
};