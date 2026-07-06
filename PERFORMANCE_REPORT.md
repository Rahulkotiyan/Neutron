# Neutron Performance Analysis Report

## Table of Contents
1. Executive Summary
2. Frontend: Bundle & Build
3. Frontend: Component-by-Component Analysis
4. Frontend: Data Fetching & State Management
5. Backend: API Endpoint Performance
6. Backend: Database & Query Analysis
7. Data Flow: End-to-End Bottlenecks
8. MUST Fix (Critical)
9. BEST Fix (High Impact)
10. Fastest Data Retrieval Solutions

---

## 1. Executive Summary

**Stack:** React 19 + Vite 6 (frontend) | Express.js + Turso/libSQL + Drizzle ORM (backend)

**Top 5 bottlenecks by impact:**

| Rank | Issue | Impact | Area |
|------|-------|--------|------|
| 1 | No pagination on `getPosts`, `getUserContent`, `getNotesBySubject` | Server OOM with large datasets | Backend controllers |
| 2 | 13 redundant DB user lookups per post request (`postController.js`) | 13x unnecessary Turso round-trips | Backend controllers |
| 3 | `getUserActivity` makes 15 DB queries per request | Profile page loads slowly | Backend profileController |
| 4 | No list virtualization on feed, profile tabs, notes | Excessive DOM nodes with 100+ items | Frontend components |
| 5 | In-memory cache (`simpleCache.js`) has no eviction policy | Memory leak under sustained load | Backend middleware |

---

## 2. Frontend: Bundle & Build

### Current Split (Phase 1 already applied)

| Chunk | Size (gzip) | Contents |
|-------|-------------|----------|
| `vendor` | 263KB (87KB) | react, react-dom, react-router, axios |
| `analytics` | 197KB (66KB) | posthog-js |
| `firebase` | 157KB (33KB) | firebase/app, firebase/auth |
| `index` | 112KB (39KB) | App.jsx + all static UI components |
| `icons` | 72KB (12KB) | iconoir-react |
| `PostCard` | 67KB (17KB) | PostCard + CommentSection + ReplyModal + all sub-deps |
| `ProfilePage` | 58KB (12KB) | ProfilePage + ProfileTabs |
| `ToolsComponent` | 63KB (14KB) | ToolsComponent |
| `NotesLibraryPage` | 37KB (9KB) | NotesLibraryPage |
| `socket` | 41KB (13KB) | socket.io-client |
| `ui` | 16KB (7KB) | react-toastify |

**Initial payload (critical path):** vendor + analytics + firebase + index + icons + socket + ui = **~758KB (257KB gzipped)**

### Issues Found

1. **Single Suspense boundary for all routes** — `App.jsx:174-282` wraps ALL routes in one `<Suspense>`. If ANY lazy chunk loads, the ENTIRE content area shows a full-page spinner instead of just the route content.

2. **Static imports that could be lazy** — `LoginModal`, `CreatePostModal`, `Rightbar` are always bundled into the main chunk even though they're only visible on certain routes/actions.

3. **Preload plugin only covers HomePage + PostCard** — `FeedPage`, `ProfilePage`, `NotesLibraryPage`, `ToolsComponent`, `PostDetail`, `OnboardingPage` are not preloaded.

---

## 3. Frontend: Component-by-Component Analysis

### Critical Components (Heaviest)

#### `PostCard.jsx` (918 lines)
- **Render count:** High — each post in the feed renders one
- **Dependencies:** CommentSection, ReplyModal, ReportModal, PostDetailModal, EmojiPicker, GIFPicker, CustomDropdown — all bundled into PostCard chunk
- **useEffect count:** 5 (view tracking, following updates, intersection observer)
- **Memoized:** Yes (`memo`), but effectiveness reduced by inline callbacks from parent
- **Optimistic updates:** Yes — likes, dislikes, bookmarks
- **Data:** Receives full `post` object with nested comments/replies/author
- **Issue:** `PostCard` is wrapped in `memo`, but FeedLayout passes `post` as a new object reference on every render (due to `posts.map()` creating new arrays). The `memo` comparator doesn't deep-compare, so every post re-renders on every feed update.

#### `FeedLayout.jsx` (285 lines)
- **API calls:** None directly — receives posts as props
- **IntersectionObserver:** Yes — infinite scroll with `rootMargin: "400px"`
- **Lazy-loads:** PostCard via `React.lazy`
- **Suspense:** Wraps each PostCard individually with SkeletonPostCard
- **Issue:** Inline callbacks (`onPostUpdate`, `setSortBy`, etc.) passed to child components create new references every render

#### `ProfileTabs.jsx` (859 lines)
- **API calls:** Multiple — fetches posts, liked, disliked, saved, comments, tools, notes in separate tabs
- **Lazy-loads:** PostCard via `React.lazy`
- **Lists:** 7 different `.map()` loops for different tab content types — NO virtualization on any
- **Issue:** Each tab switch triggers a new API fetch; data not cached between tab switches

#### `CommentSection.jsx` (717 lines)
- **Memoized:** Yes
- **Socket:** Real-time comment delivery via socket.io
- **useEffect:** 3 (initial load, click outside)
- **N+1 concern:** Loads all comments for a post without pagination

#### `Header.jsx` (290 lines)
- **Polling:** `setInterval(fetchUnreadCount, 30000)` — polls every 30s
- **Memoized:** Yes
- **Issue:** Inline callbacks from App.jsx (`toggleSidebar`, `onLogin`, `onOpenCreatePost`, `onLogout`) defeat memoization

#### `HomePage.jsx` / `FeedPage.jsx`
- **Memoization:** Uses `useMemo` for `filteredPosts`/`displayedPosts`
- **Issue:** Inline `onPostUpdate` callback passed to `FeedLayout` creates new function reference on every render

#### `Rightbar.jsx`
- **Lazy-loads:** `TimetableWidget`, `AttendanceWidget` with individual Suspense boundaries
- **Issue:** Both widgets mount immediately on landing, causing 2 extra chunk fetches + API calls

#### `OnboardingPage.jsx` (519 lines)
- **API calls:** 5 (colleges, branches, username check, profile create, etc.)
- **State:** Multi-step form with local state
- **Issue:** `iconSize={}` → fixed to `width/height` ✓

#### `NotesLibraryPage.jsx` (342 lines)
- **Lists:** `.map()` over all notes without virtualization
- **Cache-busting:** Uses `_t=Date.now()` param on every fetch — defeats any caching

#### `AttendanceTracker.jsx` / `AttendanceWidget.jsx` / `TimetableWidget.jsx`
- **Polling:** `TimetableWidget` polls every 60s with NO cleanup (memory leak)
- **Memoization:** None

#### `ToolsComponent.jsx`
- **API calls:** 15 — highest of any component
- **State:** Manages tools, categories, timetables, attendance, GPA, tasks locally
- **Optimistic updates:** Task creation
- **Issue:** Monolithic component (multiple features bundled together)

---

## 4. Frontend: Data Fetching & State Management

### API Client Inconsistency

**Problem:** 2 axios patterns coexist, ~80% of components use raw `axios` directly:

| Pattern | Used by | Token interceptor? | 401 handling? |
|---------|---------|-------------------|---------------|
| `api.get()` | ToolsComponent, FeedbackModal, ToolCard | Yes | Yes |
| `axios.get(\`${API_URL}/...\`)` | Everything else | No | No |

### No Client-Side Data Cache

No React Query, SWR, TanStack Query, or RTK Query. Data fetching is manual:
- `useEffect` + `useState(loading)` + `useState(data)` + `useState(error)` in every component
- No request deduplication (same endpoint called by sibling components)
- No background refetching
- No cache persistence
- No stale-while-revalidate on client

### Loading State Distribution

| State | Count (unique components) |
|-------|--------------------------|
| `loading` | 20+ |
| `error` | 20+ |
| `loadingMore` | 3 (FeedLayout variants) |

Every component manages these independently — no reusable hook.

### No Debounce/Throttle

Search input in Header fires on every keystroke with no debounce.

---

## 5. Backend: API Endpoint Performance

### Route Performance Table

| Route | Avg Queries | Pagination? | Cache? | Issue |
|-------|-------------|-------------|--------|-------|
| `GET /api/posts/` | 4 (unlimited posts) | NO | No (no cacheMiddleware) | CRITICAL — loads ALL posts |
| `GET /api/posts/global` | 4 (max 50) | Yes (cursor) | In-memory 30s | Good |
| `GET /api/posts/:id` | 3 | N/A | In-memory 30s | Good |
| `GET /api/posts/:id/comments` | 2 | No | In-memory 30s | Loads ALL comments |
| `GET /api/profile/activity` | 15 | Partial | In-memory 30s | Very heavy |
| `GET /api/profile/content` | 4 (unlimited) | NO | In-memory 30s | CRITICAL |
| `GET /api/notes/subject/:subject` | 3 | NO | None | No limit |
| `GET /api/tools/` | 5 | N/A | In-memory 120s | Acceptable |
| `GET /api/search/` | 1 (max 10) | No (limited) | In-memory 30s | Good |

### N+1 Analysis

| Pattern | Found? | Severity |
|---------|--------|----------|
| Classic N+1 (per-row query) | No | — |
| Batch N+1 (batched via `inArray`) | Yes (comments, authors) | Low (2-3 queries per batch) |
| Redundant user lookup via email | Yes — 13 occurrences in postController.js alone | High |
| Sequential independent queries | Yes — `getPersonalTimetable` does timetable→schedules→classes sequentially | Medium |

### Critical: Rate Limiter Disabled

`backend/middleware/rateLimiterSimple.js:16` — `skip: () => true` disables ALL rate limiting.

### Critical: Auth Middleware DB Query

`backend/middleware/authMiddleware.js:35-37` — Performs `db.select().from(schema.users).where(...)` on EVERY authenticated request, even though JWT already contains user ID. Adds 10-50ms DB latency to every protected endpoint.

---

## 6. Backend: Database & Query Analysis

### Connection
- Single `@libsql/client` instance — NO connection pooling
- Every query is a full HTTPS round-trip to Turso
- No circuit breaker or retry logic

### Indexes
- 21 indexes exist (good coverage on foreign keys and common filters)
- **Missing:** `posts.created_at` (bare ORDER BY), `posts.moderation_status` (college feed filter)

### Query Patterns
- `JSON.parse()` on TEXT columns read every request (profileController:11, timetableController:25)
- `getColleges` scans ALL posts then deduplicates in JS (`new Set(result.map(...))`) — should use `SELECT DISTINCT`
- `markAttendance` runs 3 sequential COUNT queries instead of 1 combined query with `CASE WHEN`

### Payload Size
- All feed endpoints return full nested comment/reply trees even for 20 posts
- `moderation_status`, `scheduled_at` returned to client but likely unused
- `contact_person/phone/email` returned for ALL posts, only relevant for EVENT tag
- `getUserContent` returns ALL columns for 4 tables with no field projection

---

## 7. Data Flow: End-to-End Bottlenecks

### Typical Post Fetch Flow

```
Browser requests / (landing page)
  → Downloads vendor(263KB) + firebase(157KB) + index(112KB) + icons(72KB) + ...
  → React renders App → Suspense → loads HomePage chunk (1.7KB)
  → HomePage renders FeedLayout → shows 3 SkeletonPostCards
  → GET /api/posts/global?limit=20
    → authMiddleware: DB query for user lookup (10-50ms)
    → postController.getGlobalFeed:
      1. SELECT * FROM posts WHERE ... ORDER BY created_at DESC LIMIT 21 (with no index on created_at alone)
      2. attachAuthor: SELECT id,name,handle,avatar FROM users WHERE id IN (...) — 1 query
      3. attachComments: 
         a. SELECT * FROM comments LEFT JOIN users WHERE post_id IN (...) — loads ALL comments for ALL 20 posts
         b. SELECT * FROM replies LEFT JOIN users WHERE comment_id IN (...) — loads ALL replies
      4. Response: 20 posts × (full fields + author + N comments each)
  → FeedLayout renders posts → each triggers React.lazy → loads PostCard chunk (67KB)
  → Each PostCard renders with full comment tree even if comments are collapsed
```

**Total time from request to interactive:** 4 sequential chunk downloads + 1 API round-trip + 4 DB queries + 2 JS processing loops = **~800ms-2s baseline in ideal conditions**

---

## 8. MUST Fix (Critical — blocking scale)

### 8.1 Add pagination to unbounded endpoints

**Files:** `backend/controllers/postController.js:64-83`, `backend/controllers/profileController.js:356-383`, `backend/controllers/notesController.js:312-328`

**What:** `getPosts()`, `getUserContent()`, `getNotesBySubject()` have NO limit/cursor. With 10K+ posts, these will OOM the server.

**Fix:** Add `limit` (default 20, max 50) and `cursor` (createdAt) parameters. Use same pattern as `getGlobalFeed`.

### 8.2 Remove redundant user DB lookups

**File:** `backend/controllers/postController.js` (13 occurrences), similar in other controllers

**What:** Every handler calls `db.select().from(schema.users).where(eq(schema.users.email, req.user.email))` even though `req.user.id` is already available from JWT auth middleware.

**Fix:** Use `req.user.id` directly. Remove the extra DB query.

### 8.3 Add memory eviction to simpleCache

**File:** `backend/middleware/simpleCache.js:1`

**What:** `const cache = new Map()` with no size limit or TTL eviction will leak memory.

**Fix:** Add periodic cleanup timer + max size limit (e.g., 1000 entries, LRU eviction).

### 8.4 Add list virtualization to large lists

**Files:** `FeedLayout.jsx`, `ProfileTabs.jsx`, `NotesLibraryPage.jsx`, `NotificationsDropdown.jsx`, `CommentSection.jsx`

**What:** All render full lists via `.map()` with no virtualization. A feed of 200 posts creates 200 PostCard DOM trees.

**Fix:** Use `react-window` (8KB) or `react-virtuoso` (15KB) for virtualized lists. Start with `FeedLayout` (highest traffic) and `ProfileTabs` (most lists).

### 8.5 Single Suspense boundary split

**File:** `App.jsx:174-282`

**What:** One `<Suspense>` wraps all routes. Any lazy chunk navigation shows full-page spinner.

**Fix:** Wrap each `<Route>` or `<Route element={...}>` in its own `<Suspense>` with route-specific fallback.

---

## 9. BEST Fix (High Impact — recommended)

### 9.1 Unify API client usage

**What:** 80% of components use `axios.get(\`${API_URL}/...\`)` bypassing the configured `api` instance and its token/401 interceptors.

**Fix:** Replace all `axios` imports in components with the shared `api` instance from `utils/api.js`.

### 9.2 Add debounce to search

**File:** `frontend/src/components/Header.jsx` (search input)

**What:** Fires API call on every keystroke.

**Fix:** `useDebounce` hook with 300ms delay before firing the search API call.

### 9.3 Add missing indexes

**What:** `posts.created_at` and `posts.moderation_status` have no indexes but are used in ORDER BY and WHERE filters.

**Fix:**
```sql
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_moderation ON posts(moderation_status);
```

### 9.4 Parallelize independent queries

**Files:** `backend/controllers/timetableController.js:10-26`, `backend/controllers/timetableController.js:97-99`

**What:** Sequential queries for independent data (timetable→schedules→classes, 3 separate COUNT queries).

**Fix:** Use `Promise.all()` for independent queries.

### 9.5 Limit comment loading in feed

**File:** `backend/controllers/postController.js:12-51`

**What:** `attachComments()` loads ALL comments+replies for ALL posts in a batch, with no per-post limit.

**Fix:** Add `LIMIT 3` per post for initial load, with "show all comments" link to fetch remaining.

### 9.6 Replace `getColleges` with SELECT DISTINCT

**File:** `backend/controllers/postController.js:499-509`

**What:** Scans ALL posts to extract distinct college names, then deduplicates in JS.

**Fix:**
```js
const result = await db.select({ college: schema.posts.college })
  .from(schema.posts)
  .where(and(sql`college IS NOT NULL`, sql`college != 'Global'`))
  .groupBy(schema.posts.college);
```

### 9.7 Stop passing inline callbacks to memo'd components

**File:** `App.jsx` (passing callbacks to Header, Sidebar), `FeedLayout.jsx` (passing to child components)

**What:** `memo` is defeated when parent passes inline function references.

**Fix:** Wrap callbacks in `useCallback` with stable dependencies.

### 9.8 Add polling cleanup to TimetableWidget

**File:** `frontend/src/components/TimetableWidget.jsx:15`

**What:** `setInterval(fetchData, 60000)` has no cleanup — continues after unmount.

**Fix:** Return `clearInterval(timer)` from useEffect.

### 9.9 Fix rate limiter skip function

**File:** `backend/middleware/rateLimiterSimple.js:16`

**What:** `skip: () => true` disables all rate limiting.

**Fix:** Either remove the skip or use `skip: () => process.env.NODE_ENV === 'development'`.

### 9.10 Reduce activity endpoint queries

**File:** `backend/controllers/profileController.js:281-354`

**What:** `getUserActivity` makes 15 DB queries per call.

**Fix:** Combine like-count queries with subqueries or remove rarely-used activity types. Cache the result longer (5min TTL).

---

## 10. Fastest Data Retrieval Solutions

### Tier 1: Architectural Changes (Highest Impact)

| Solution | Latency Reduction | Complexity |
|----------|------------------|------------|
| **Add Redis cache layer** between controllers and Turso | 50-100ms per request (Turso round-trip ~50ms, Redis ~1ms) | Medium |
| **Replace in-memory simpleCache with Redis** for server-side caching | Eliminates cache miss penalty + survives restarts | Medium |
| **Add CDN caching for public API responses** with longer TTL | 0ms (served from edge) for public endpoints (colleges, branches, tools) | Low |
| **Preconnect to Turso region** (aws-ap-south-1) | 20-50ms reduced network latency | Low |

### Tier 2: Query Optimization (Next Best)

| Solution | Improvement | Effort |
|----------|-------------|--------|
| **Batch user lookups** — Stop querying users by email 13x per request | 13 fewer DB queries per post request | Low |
| **Combine 3 COUNT queries into 1** in markAttendance | 2 fewer queries per attendance mark | Low |
| **Use SELECT with field projection** instead of `select()` (all columns) | Smaller payload, less memory | Low |
| **Add LIMIT to comment loading** in feed responses | Reduces response size by 80%+ for posts with many comments | Low |
| **Use DISTINCT instead of full scan + JS Set** for getColleges | Avoids scanning entire posts table | Low |

### Tier 3: Client-Side (Perceived Speed)

| Solution | Effect | Effort |
|----------|--------|--------|
| **Add React Query** for client-side caching + deduplication + background refetch | Instant data on revisit, no loading spinners | Medium |
| **Preload more lazy chunks** — add FeedPage, ProfilePage to preload plugin | Fetch in parallel with main bundle | Low |
| **Add stale-while-revalidate** to client data fetching | Show stale data immediately, refresh in background | Medium |
| **Virtualize large lists** (FeedLayout, ProfileTabs) | Render only visible items, 60fps scrolling | Medium |

### Tier 4: Infrastructure

| Solution | Benefit | Effort |
|----------|---------|--------|
| **Deploy backend closer to Turso region** | 20-50ms latency reduction | Low (config change) |
| **Add Cloudflare in front of backend** | Edge caching + DDoS protection + 0ms cache hits for public data | Low |
| **Use connection pooling** with Turso | Eliminate connection setup overhead | Medium |
| **Enable HTTP/2** on backend server | Reduced latency via multiplexing | Low |

### Recommended Implementation Order (Phase 4+)

| Step | What | Est. Time |
|------|------|-----------|
| 1 | Add pagination to unbounded endpoints (`getPosts`, `getUserContent`) | 1h |
| 2 | Remove redundant user lookups (use `req.user.id`) | 30min |
| 3 | Add cache eviction to simpleCache | 15min |
| 4 | Add missing DB indexes | 15min |
| 5 | Limit comment loading in feed responses | 30min |
| 6 | Unify API client usage across all components | 1h |
| 7 | Add list virtualization (FeedLayout first, then ProfileTabs) | 2-3h |
| 8 | Split single Suspense boundary into per-route boundaries | 30min |
| 9 | Add React Query for client-side data fetching | 4-6h |
| 10 | Deploy Redis for server-side caching + session store | 2h |
| 11 | Add Cloudflare CDN in front of backend | 1h |
