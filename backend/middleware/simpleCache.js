const cache = new Map();
const DEFAULT_TTL = 60 * 1000;

const getCacheKey = (req) => {
  if (req.user?._id) return `${req.originalUrl}|${req.user._id}`;
  return req.originalUrl;
};

exports.cacheMiddleware = (ttl = DEFAULT_TTL) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = getCacheKey(req);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < ttl) {
      return res.json(cached.data);
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