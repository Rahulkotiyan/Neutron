# Profile Navigation Feature Implementation

## Overview

This document describes the implementation of a feature that allows users to click on other users' avatars/names in posts to view their profiles and follow/unfollow them.

## Changes Made

### Frontend Changes

#### 1. PostCard Component (`frontend/src/components/PostCard.jsx`)

- **Added**: Import for `useNavigate` from React Router
- **Modified**: Avatar section to be clickable with `cursor-pointer` class
- **Modified**: Author name section to be clickable
- **Action**: Both avatar and author name now navigate to `/profile/{userId}` when clicked

```jsx
// Avatar is now clickable
<div className="relative cursor-pointer" onClick={() => navigate(`/profile/${post.author?._id}`)}>

// Author name is now clickable
<p
  className="text-sm text-zinc-200 font-bold hover:underline cursor-pointer group-hover:text-white transition-colors"
  onClick={() => navigate(`/profile/${post.author?._id}`)}
>
  {post.author?.name || "Unknown User"}
</p>
```

#### 2. ProfilePage Component (`frontend/src/components/ProfilePage.jsx`)

- **Modified**: Now handles both viewing own profile (`/profile`) and other users' profiles (`/profile/:userId`)
- **Added**: `isOwnProfile` state to determine if viewing own or another user's profile
- **Updated**: API calls to use path parameters instead of query parameters for viewing other users
- **Added**: Follow/Unfollow button display for other users' profiles
- **Added**: View-only "About" section for other users (read-only display instead of editable form)
- **Modified**: Header, avatar, and profile info to display correct user information

Key features:

- Users can only edit their own profile information
- Follow/Unfollow button appears when viewing other users' profiles
- Stats are fetched correctly for both own and other users' profiles
- User posts are displayed for both own and other users' profiles

### Backend Changes

#### 1. Profile Controller (`backend/controllers/profileController.js`)

Added four new endpoints to handle other users' profiles:

- **`getUserProfileById()`**: Get a specific user's profile by ID
  - Returns user info including `isFollowing` status
- **`getUserStatsById()`**: Get follower/following/post counts for a specific user
  - Returns followers, following, and post counts
- **`followUserById()`**: Follow a user by their ID
  - Adds user to current user's following list
  - Adds current user to target user's followers list
- **`unfollowUserById()`**: Unfollow a user by their ID
  - Removes user from current user's following list
  - Removes current user from target user's followers list

#### 2. Post Controller (`backend/controllers/postController.js`)

- **Added**: `getUserPostsById()` function to retrieve posts for a specific user by ID

#### 3. Profile Routes (`backend/routes/profileRoutes.js`)

Added new route endpoints:

```javascript
// Get another user's profile by ID (protected)
router.get("/:userId", verifyToken, profileController.getUserProfileById);

// Get another user's stats by ID (protected)
router.get("/:userId/stats", verifyToken, profileController.getUserStatsById);

// Follow user by ID (protected)
router.post("/:userId/follow", verifyToken, profileController.followUserById);

// Unfollow user by ID (protected)
router.post(
  "/:userId/unfollow",
  verifyToken,
  profileController.unfollowUserById
);
```

#### 4. Post Routes (`backend/routes/postRoutes.js`)

- **Added**: New route for getting a specific user's posts

```javascript
// Get posts for a specific user by ID (protected)
router.get("/user/:userId", verifyToken, postController.getUserPostsById);
```

### Route Configuration

The App.jsx already had the correct route configuration:

```jsx
// View own profile
<Route path="/profile" element={<ProfilePage .../>} />

// View other user's profile
<Route path="/profile/:userId" element={<ProfilePage .../>} />
```

## API Endpoints

### Profile Endpoints

- `GET /api/profile` - Get current user's profile (protected)
- `GET /api/profile/stats` - Get current user's stats (protected)
- `GET /api/profile/:userId` - Get specific user's profile (protected)
- `GET /api/profile/:userId/stats` - Get specific user's stats (protected)
- `POST /api/profile/:userId/follow` - Follow a user (protected)
- `POST /api/profile/:userId/unfollow` - Unfollow a user (protected)
- `PUT /api/profile` - Update own profile (protected)

### Post Endpoints

- `GET /api/posts/user/profile` - Get current user's posts (protected)
- `GET /api/posts/user/:userId` - Get specific user's posts (protected)

## User Flow

1. User sees a post in the feed with an author avatar/name
2. User clicks on the avatar or author name
3. User is navigated to `/profile/{userId}`
4. ProfilePage detects the `userId` parameter and fetches that user's profile data
5. User sees the other user's profile in read-only mode
6. User can see the "Follow" button if not already following
7. User clicks "Follow" to follow the user
8. Follow button changes to "Following" state
9. Stats update to reflect the new follow relationship

## Testing Recommendations

1. **Click on author avatars/names in posts**

   - Verify navigation to the correct profile page
   - Verify user information is displayed correctly

2. **Follow/Unfollow users**

   - Follow a user and verify the button state changes
   - Verify follower counts update
   - Verify the user appears in the followers list

3. **View user posts**

   - Click on a user profile and check their posts
   - Verify only that user's posts are displayed

4. **Own profile editing**

   - Verify you can only edit your own profile
   - Verify edit form is hidden for other users' profiles

5. **Error handling**
   - Try navigating to a non-existent user ID
   - Verify appropriate error messages are displayed

## Notes

- All profile-related endpoints require authentication (verifyToken middleware)
- Follow/unfollow operations are bidirectional (updates both users' records)
- The `isFollowing` status is checked when fetching another user's profile
- The feature maintains all existing functionality while adding the new cross-profile navigation
