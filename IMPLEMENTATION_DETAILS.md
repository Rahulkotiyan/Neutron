# Implementation Summary: Profile Navigation & Follow Feature

## Feature Overview

Users can now click on post authors' avatars or names to view their profiles and follow/unfollow them.

## Files Modified: 6

### 1. **frontend/src/components/PostCard.jsx**

**Changes:**

- Added `import { useNavigate } from "react-router-dom";`
- Added `const navigate = useNavigate();` inside component
- Made avatar clickable: Added `onClick={() => navigate(\`/profile/${post.author?.\_id}\`)}`
- Made author name clickable: Added `onClick={() => navigate(\`/profile/${post.author?.\_id}\`)}`

**Lines affected:** ~3-5 new lines added to component initialization and ~10 lines in JSX

---

### 2. **frontend/src/components/ProfilePage.jsx**

**Major Changes:**

1. **State & Props:**

   - Kept existing state: `viewingUser`, `isFollowing`, `followLoading`
   - Used existing: `useParams()` to get `userId` parameter

2. **Core Logic:**

   - Added: `const isOwnProfile = !userId;` - Determines if viewing own or other profile
   - Updated: All API calls to use path parameters: `/api/profile/${userId}` instead of query params
   - Updated: Follow endpoints to use: `/api/profile/${userId}/follow` and `//api/profile/${userId}/unfollow`

3. **API Methods Modified:**

   - `fetchStats()`: Changed endpoint from `?userId=` to `/${userId}/`
   - `fetchUserProfile()`: Changed endpoint from `?userId=` to `/${userId}/`
   - `fetchUserPostsForProfile()`: Changed endpoint from `?userId=` to `/${userId}/`
   - `handleFollowToggle()`: Updated to use `/api/profile/${userId}/follow` pattern

4. **UI Changes:**
   - Header: Shows correct user name based on `viewingUser` or `currentUser`
   - Avatar: Displays correct user's initial
   - Profile info: Shows viewed user's information
   - Follow Button: Only shows when `!isOwnProfile`
   - Edit Form: Only shows when `isOwnProfile` (added `isOwnProfile &&` condition)
   - New: Read-only "About" section for other users' profiles
   - Tabs: "about" tab conditionally renders edit form or read-only display

**Lines affected:** ~80 lines modified/added (about 10% of file)

---

### 3. **backend/controllers/profileController.js**

**New Functions Added (4):**

1. **`getUserProfileById()`** - Lines 227-265

   - Gets a specific user's profile by userId param
   - Returns `isFollowing` status
   - Accessible: `GET /api/profile/:userId`

2. **`getUserStatsById()`** - Lines 268-295

   - Gets follower/following/post counts for a user
   - Populates followers and following arrays
   - Accessible: `GET /api/profile/:userId/stats`

3. **`followUserById()`** - Lines 298-328

   - Follows a user by userId param
   - Updates both users' records bidirectionally
   - Accessible: `POST /api/profile/:userId/follow`

4. **`unfollowUserById()`** - Lines 331-336 (continues to end)
   - Unfollows a user by userId param
   - Updates both users' records bidirectionally
   - Accessible: `POST /api/profile/:userId/unfollow`

**Total additions:** ~110 lines of new code

---

### 4. **backend/controllers/postController.js**

**New Function Added (1):**

1. **`getUserPostsById()`** - Lines 232-250
   - Gets posts for a specific user by userId param
   - Populates author and comments data
   - Accessible: `GET /api/posts/user/:userId`

**Total additions:** ~20 lines of new code

---

### 5. **backend/routes/profileRoutes.js**

**New Routes Added (4):**

```javascript
// Line: After existing routes

router.get("/:userId", verifyToken, profileController.getUserProfileById);
router.get("/:userId/stats", verifyToken, profileController.getUserStatsById);
router.post("/:userId/follow", verifyToken, profileController.followUserById);
router.post(
  "/:userId/unfollow",
  verifyToken,
  profileController.unfollowUserById
);
```

**Total additions:** 5 lines of new routes

---

### 6. **backend/routes/postRoutes.js**

**New Route Added (1):**

```javascript
// Line: After /user/profile route

router.get("/user/:userId", verifyToken, postController.getUserPostsById);
```

**Total additions:** 2 lines of new route

---

## API Endpoints Summary

### New Profile Endpoints

| Method | Endpoint                        | Purpose                     |
| ------ | ------------------------------- | --------------------------- |
| GET    | `/api/profile/:userId`          | Get specific user's profile |
| GET    | `/api/profile/:userId/stats`    | Get specific user's stats   |
| POST   | `/api/profile/:userId/follow`   | Follow a user               |
| POST   | `/api/profile/:userId/unfollow` | Unfollow a user             |

### New Post Endpoints

| Method | Endpoint                  | Purpose                   |
| ------ | ------------------------- | ------------------------- |
| GET    | `/api/posts/user/:userId` | Get specific user's posts |

### Existing Endpoints (Unchanged)

- `GET /api/profile` - Current user's profile
- `GET /api/profile/stats` - Current user's stats
- `GET /api/posts/user/profile` - Current user's posts
- `POST /api/profile/follow` - Follow via body param (old)
- `POST /api/profile/unfollow` - Unfollow via body param (old)

---

## Data Flow

### 1. User Clicks Avatar/Name

```
PostCard Component
    ↓
useNavigate hook triggered
    ↓
Navigate to /profile/{userId}
```

### 2. Profile Page Loads

```
App routes to ProfilePage with userId param
    ↓
useParams() extracts userId
    ↓
isOwnProfile = !userId (false if userId exists)
    ↓
fetchUserProfile(), fetchStats(), fetchUserPostsForProfile()
    ↓
Correct API endpoints called with userId
    ↓
Data displayed with appropriate UI (edit form hidden, follow button shown)
```

### 3. User Follows Another User

```
Click "Follow" button
    ↓
handleFollowToggle() called
    ↓
POST /api/profile/{userId}/follow
    ↓
Backend updates both users' records
    ↓
setIsFollowing(true)
    ↓
Button UI updates to "Following"
    ↓
Stats refresh
```

---

## Key Implementation Details

### 1. Route Matching Order (Important!)

In post routes, order matters:

```javascript
router.get("/user/profile", ...)      // Must be FIRST (specific)
router.get("/user/:userId", ...)      // Then generic with param
router.get("/global", ...)            // etc.
```

### 2. Authentication

All new endpoints are protected with `verifyToken` middleware.

### 3. Bidirectional Updates

When following/unfollowing:

- Current user's `following` array is updated
- Target user's `followers` array is updated
- Both changes are persisted to database

### 4. Conditional Rendering

```jsx
{
  activeTab === "about" && isOwnProfile && (
    <form>...</form> // Edit form shown only for own profile
  );
}

{
  activeTab === "about" && !isOwnProfile && (
    <div>...</div> // Read-only display shown for other profiles
  );
}

{
  !isOwnProfile && (
    <button>Follow/Following</button> // Follow button shown for other profiles
  );
}
```

### 5. isFollowing Status

- Fetched from server when getting other user's profile
- Stored in local state: `setIsFollowing(res.data.isFollowing)`
- Used to determine button display ("Follow" vs "Following")
- Updated when follow/unfollow actions complete

---

## Testing Checklist

- [ ] Click avatar → Navigate to user profile
- [ ] Click name → Navigate to user profile
- [ ] Follow button appears on other profiles
- [ ] No follow button on own profile
- [ ] Edit form visible on own profile
- [ ] Edit form hidden on other profiles
- [ ] Click follow → Button changes to "Following"
- [ ] Click following → Button changes to "Follow"
- [ ] Follower count updates
- [ ] User appears in followers list
- [ ] User disappears from followers list after unfollow
- [ ] View other user's posts
- [ ] View own posts (unchanged)

---

## Security Considerations

1. ✅ All endpoints require authentication
2. ✅ Users cannot edit other users' profiles (server-side protected)
3. ✅ Follow/unfollow operations are properly authorized
4. ✅ User data is properly validated before database operations
5. ✅ No sensitive data is exposed in API responses

---

## Performance Considerations

1. **Lazy Loading:** Profile data loads only when tab is opened
2. **Caching:** Stats are fetched on demand
3. **Populate:** Followers/following arrays are populated with only needed fields (name, avatar)
4. **Sorting:** Posts sorted by createdAt descending

---

## Backward Compatibility

- Old follow endpoints still work (`/api/profile/follow` with body param)
- Existing profiles feature continues unchanged
- No breaking changes to existing API contracts
- New routes are purely additive

---

## Total Changes Summary

- **Files Modified:** 6
- **Lines Added:** ~230
- **Lines Modified:** ~40
- **New API Endpoints:** 5
- **New Functions:** 5
- **New Components Features:** 1 (Profile navigation)

---

## Deployment Notes

1. Deploy backend first (new endpoints must exist)
2. Deploy frontend second (uses new endpoints)
3. No database migration needed
4. No environment variable changes needed
5. All changes are backward compatible
