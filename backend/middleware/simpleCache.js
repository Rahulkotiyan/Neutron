const cache = new Map();
const DEFAULT_TTL = 60 * 1000;
const MAX_SIZE = 1000;
const CLEANUP_INTERVAL = 60 * 1000;

const cleanup = () => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts > entry.ttl + entry.swrTtl) {
      cache.delete(key);
    }
  }
  if (cache.size > MAX_SIZE) {
    const toDelete = cache.size - MAX_SIZE;
    const iter = cache.keys();
    for (let i = 0; i < toDelete; i++) {
      const key = iter.next().value;
      if (key) cache.delete(key);
    }
  }
};

const timer = setInterval(cleanup, CLEANUP_INTERVAL);
timer.unref();

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
      cached.lastUsed = Date.now();
      cache.delete(key);
      cache.set(key, cached);
      const age = Date.now() - cached.ts;
      if (age < ttl) {
        return res.json(cached.data);
      }
      if (age < ttl + swrTtl) {
        return res.json(cached.data);
      }
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (cache.size >= MAX_SIZE) {
        const lruKey = cache.keys().next().value;
        if (lruKey) cache.delete(lruKey);
      }
      cache.set(key, { data, ts: Date.now(), lastUsed: Date.now(), ttl, swrTtl });
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
