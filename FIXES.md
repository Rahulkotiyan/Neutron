# Neutron Performance Fixes — Implementation Checklist

## 🔴 Priority 1: Immediate Wins (< 30 min each)

| # | File | Line(s) | What to Change | Before | After | Saves |
|---|------|---------|---------------|--------|-------|-------|
| 1 | `backend/controllers/postController.js` | 24-31 | Remove redundant `COUNT(*)` query in `attachComments`. The comment data is already fetched in the previous query; derive the count from `allComments.length` grouped by postId. | Two separate queries: one for comment data, one for `COUNT(*) GROUP BY postId` | Single query; build `totalCountByPost` by iterating `allComments` and counting per `postId` | ~600ms |
| 2 | `frontend/src/main.jsx` | 7 | Move `initAnalytics()` from top-level sync call into a `useEffect` inside `App` so it doesn't block React rendering. | `initAnalytics();` called synchronously before `ReactDOM.createRoot` | Wrap in `useEffect(() => { initAnalytics(); }, [])` inside `App` | ~500-1500ms |
| 3 | `frontend/src/context/SocketContext.jsx` | 18 | Reduce Socket.io `timeout` from 10s to 3s so failed connections fail fast instead of hanging the client. | `timeout: 10000` | `timeout: 3000` | Up to 7s on failure |
| 4 | `frontend/src/context/SocketContext.jsx` | 14-16 | Add `transports: ["websocket"]` to skip the HTTP-polling fallback. If WebSocket fails, fail fast instead of retrying with polling. | `transports: ["websocket", "polling"]` | `transports: ["websocket"]` | ~1-2s on fallback |
| 5 | `frontend/src/components/Header.jsx` | `fetchUnreadCount` | Cache the unread-count response in a simple JS variable with a 60s TTL so repeated calls (mount + 30s interval) don't hit the API every time. | Every call hits `GET /notifications/unread-count` (2 DB queries) | Check cache first; if < 60s old, return cached value. | ~1.6s per poll cycle |

## 🔴 Priority 2: Medium Effort (< 1 hour each)

| # | File | Line(s) | What to Change | Before | After | Saves |
|---|------|---------|---------------|--------|-------|-------|
| 6 | `backend/middleware/authMiddleware.js` | 35-36 | Cache the `req.user` object in-memory keyed by `userId` with a 5-min TTL. Skip the `SELECT * FROM users` query when a fresh cache entry exists. | Every protected request queries `SELECT * FROM users WHERE id = ?` | Look up in-memory Map first; if miss, query DB and set cache. Invalidate on logout. | ~800ms per request × 2-3 requests |
| 7 | `backend/socket/socketHandler.js` | 24-36 | Same fix as #6 — cache the user lookup in the socket auth middleware. The JWT is already verified; the DB query is redundant. | `io.use(...)` queries DB on every socket connection `SELECT * FROM users WHERE id = ?` | Cache user object in-memory with 5-min TTL; skip DB on cache hit. | ~800ms per socket connect |
| 8 | `backend/controllers/postController.js` | 16-23 + 24-31 | Merge the comment fetch and comment-count queries into a single Drizzle query that includes an aggregated count column. | `allComments` query (data) + `countRows` query (COUNT)  → 2 round-trips | Single query: `SELECT c.*, u.name, ... FROM comments c LEFT JOIN users u ... WHERE c.post_id IN (...) ORDER BY c.created_at` — derive count from JS after. | ~600ms |
| 9 | `frontend/src/context/SocketContext.jsx` | 10-45 | Make socket initialization non-blocking: render children immediately, connect socket in a separate `useEffect` with lower priority, and don't gate rendering on `isConnected`. | `SocketProvider` wraps `<Router>`; socket connects before children render. | Render children immediately; run socket connect in `useEffect`; use a ref to track connection instead of blocking state. | ~2-3s off critical path |

## 🟡 Priority 3: Longer Term (< 2 hours each)

| # | File | Line(s) | What to Change | Before | After | Saves |
|---|------|---------|---------------|--------|-------|-------|
| 10 | `backend/controllers/postController.js` | 85-115 | Add an in-memory cache for the entire `getGlobalFeed` response with a 30s TTL. Key by `cursor + tag + limit`. | Every request hits the DB 5-6 times. | Cache hit serves from memory in < 1ms; cache miss populates and sets TTL. | 4-6s on cache hits |
| 11 | `backend/db/schema.js` | comments table | Add a composite index `(post_id, is_deleted, created_at DESC)` to accelerate both the comment-fetch and count queries. | No covering index for `WHERE post_id IN (...) AND is_deleted = 0 ORDER BY created_at DESC` | `CREATE INDEX idx_comments_post_feed ON comments(post_id, is_deleted, created_at DESC)` | ~300-500ms on large datasets |
| 12 | `backend/db/schema.js` | replies table | Add a composite index `(comment_id, is_deleted, created_at DESC)` for the reply-fetch query. | No covering index for reply lookups | `CREATE INDEX idx_replies_comment_feed ON replies(comment_id, is_deleted, created_at DESC)` | ~200-400ms on large datasets |
| 13 | `backend/controllers/postController.js` | 85-115 | Replace the 3 separate queries in `getGlobalFeed` (posts → authors → comments → replies) with a single Drizzle query that uses `LEFT JOIN` across all 4 tables and groups on the client. | 5-6 sequential queries | 2 queries (one for posts+authors+comment-count, one for comments+replies) — use JOINs. | ~2-3s |

## 🟢 Priority 4: Polish (< 30 min each)

| # | File | Line(s) | What to Change | Before | After | Saves |
|---|------|---------|---------------|--------|-------|-------|
| 14 | `backend/controllers/postController.js` | 40-45 | Add a `LIMIT 3` or `hasMoreComments` flag directly in the SQL instead of fetching all comments and then filtering in JS. | Fetches ALL comments for 20 posts in batch, then filters to 3 per post in JS. | Use `ROW_NUMBER() OVER (PARTITION BY post_id ...)` or separate per-post limit queries. | ~500ms on data transfer |
| 15 | `frontend/src/lib/analytics.js` | 1-15 | Lazy-load the PostHog SDK with dynamic `import()` instead of loading it eagerly at startup. | `import posthog from "posthog-js"` at module level | `const posthog = await import("posthog-js")` inside `initAnalytics()` | ~300-500ms initial bundle size |
| 16 | `backend/index.js` | — | Move `startCronJobs()` call after the server listens, not during module initialization. | `startCronJobs()` runs at `require()` time | Move inside `server.listen()` callback | ~100ms startup |

---

## Quick Reference: Files to Modify

```
backend/
├── controllers/
│   └── postController.js          → Fixes #1, #8, #10, #13, #14
├── middleware/
│   ├── authMiddleware.js          → Fix #6
│   └── rateLimiterSimple.js       → (already fixed)
├── socket/
│   └── socketHandler.js           → Fix #7
├── db/
│   └── schema.js                  → Fixes #11, #12
└── index.js                       → Fix #16

frontend/
├── src/
│   ├── main.jsx                   → Fix #2
│   ├── App.jsx                    → Fix #2 (move initAnalytics here)
│   ├── context/
│   │   └── SocketContext.jsx      → Fixes #3, #4, #9
│   ├── components/
│   │   └── Header.jsx             → Fix #5
│   └── lib/
│       └── analytics.js           → Fix #15
```

## Estimated Total Impact

| Priority | # Fixes | Total Time | Cumulative Savings |
|----------|---------|------------|-------------------|
| 🔴 Immediate | 5 | ~1 hour | ~4-6s |
| 🔴 Medium | 4 | ~3 hours | ~5-7s |
| 🟡 Long-term | 4 | ~5 hours | ~3-4s |
| 🟢 Polish | 3 | ~1 hour | ~1s |
| **Total** | **16** | **~10 hours** | **~12-15s → ~2-3s (80% faster)** |
