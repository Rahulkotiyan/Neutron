// Shared CORS allowlist resolution for Express + Socket.IO.
// Reads FRONTEND_URL (comma-separated) and ALLOWED_ORIGINS, normalizes each
// entry (trim, strip trailing slashes, lower-case scheme+host), and dedupes.

const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

const normalizeOrigin = (origin) => {
  let o = String(origin || '').trim();
  if (!o) return null;
  // Strip trailing slashes: "https://www.neutronapp.me/" -> "https://www.neutronapp.me"
  o = o.replace(/\/+$/, '');
  // Case-insensitive scheme/host comparison
  return o.toLowerCase();
};

const normalizeOrigins = (raw) => {
  if (!raw) return [];
  const seen = new Set();
  const result = [];
  for (const entry of String(raw).split(',')) {
    const normalized = normalizeOrigin(entry);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
};

const getAllowedOrigins = () => {
  const origins = normalizeOrigins(
    [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS].filter(Boolean).join(','),
  );
  // In production there is no safe localhost fallback — an empty allowlist
  // rejects every browser origin, so surface a loud warning instead.
  if (!origins.length) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[CORS] No FRONTEND_URL / ALLOWED_ORIGINS configured. ' +
          'All cross-origin browser requests will be blocked. Set ' +
          'FRONTEND_URL to your frontend domain(s), e.g. ' +
          'https://www.neutronapp.me,https://neutronapp.me',
      );
    }
    origins.push(...DEV_ORIGINS);
  }
  return origins;
};

module.exports = { getAllowedOrigins, normalizeOrigins, DEV_ORIGINS };