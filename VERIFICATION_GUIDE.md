# Profile Navigation Feature - Verification Guide

## Quick Test Steps

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 2. Backend Setup

```bash
cd backend
npm install
# Start server (ensure port 5000 is available)
npm start
```

### 3. Testing the Feature

#### Test Case 1: Navigate to User Profile via Avatar Click

1. Open the application and navigate to the feed
2. Find any post with an author
3. Click on the author's **avatar**
4. Verify: You are navigated to `/profile/{userId}` with the correct user's information

#### Test Case 2: Navigate to User Profile via Name Click

1. Open the application and navigate to the feed
2. Find any post with an author
3. Click on the author's **name**
4. Verify: You are navigated to `/profile/{userId}` with the correct user's information

#### Test Case 3: Follow a User

1. Navigate to another user's profile (not your own)
2. Verify: You see a "Follow" button
3. Click the "Follow" button
4. Verify:
   - The button changes to "Following"
   - Followers count increases by 1
   - You appear in the followers list

#### Test Case 4: Unfollow a User

1. Navigate to a profile where you are already following the user
2. Verify: You see a "Following" button
3. Click the "Following" button
4. Verify:
   - The button changes to "Follow"
   - Followers count decreases by 1
   - You disappear from the followers list

#### Test Case 5: View Own Profile (No Follow Button)

1. Navigate to your own profile (`/profile`)
2. Verify:
   - No "Follow" button is displayed
   - Edit form is visible
   - You can edit your information

#### Test Case 6: View Other User's Profile (No Edit Form)

1. Navigate to another user's profile
2. Verify:
   - "About" tab shows read-only information
   - No edit form is visible
   - Cannot modify user information

#### Test Case 7: View User Posts

1. Navigate to any user's profile
2. Click on the "Posts" tab
3. Verify: Only that user's posts are displayed

#### Test Case 8: View Followers/Following

1. Navigate to any user's profile
2. Click on "Followers" count or tab
3. Verify: List of followers is displayed
4. Click on "Following" count or tab
5. Verify: List of users this person is following is displayed

### 4. Network Requests to Monitor

When testing, check the Network tab in Developer Tools for these requests:

**Getting Profile:**

- `GET /api/profile/{userId}` - Should return the user's profile data with `isFollowing` status

**Getting Stats:**

- `GET /api/profile/{userId}/stats` - Should return follower/following counts

**Getting Posts:**

- `GET /api/posts/user/{userId}` - Should return only that user's posts

**Following:**

- `POST /api/profile/{userId}/follow` - Should update both users' following/followers

**Unfollowing:**

- `POST /api/profile/{userId}/unfollow` - Should update both users' following/followers

### 5. Error Scenarios

#### Test Case: Invalid User ID

1. Navigate directly to `/profile/invalid-id-here`
2. Verify: Error message is displayed

#### Test Case: Non-existent User

1. Navigate directly to `/profile/123456789abcdef`
2. Verify: Appropriate error message or 404 is shown

### 6. Security Tests

1. **Authentication Required:**

   - Ensure all profile endpoints require authentication token
   - Try accessing without token (should get 401 error)

2. **Authorization:**
   - Verify users can only edit their own profiles
   - Other users should only see read-only information

## Expected Behavior Summary

| Action        | Own Profile   | Other Profile            |
| ------------- | ------------- | ------------------------ |
| View Info     | Editable Form | Read-Only Display        |
| Follow Button | Not Shown     | Shown (Follow/Following) |
| Edit Profile  | Enabled       | Disabled                 |
| View Posts    | All Own Posts | Only Their Posts         |
| View Stats    | Your Stats    | Their Stats              |

## Success Criteria

✅ Users can navigate to other profiles by clicking avatars/names
✅ Follow/Unfollow functionality works correctly
✅ Profile data updates in real-time
✅ Own profile remains editable
✅ Other profiles are read-only
✅ All API endpoints return correct data
✅ No authentication/authorization bypasses

## Troubleshooting

### Issue: "Cannot navigate to profile"

- Check if `useNavigate` is properly imported in PostCard
- Verify route configuration in App.jsx

### Issue: "Follow button doesn't work"

- Check if API endpoints exist in backend
- Verify auth token is being sent
- Check browser console for errors

### Issue: "Profile shows wrong user info"

- Verify userId is correctly passed in route
- Check if API is returning correct user data
- Verify useParams() is being called correctly

### Issue: "Edit form appears on other profiles"

- Verify isOwnProfile logic: `const isOwnProfile = !userId;`
- Check conditional rendering of edit form

## Files Modified

### Frontend

- `frontend/src/components/PostCard.jsx` - Added navigation
- `frontend/src/components/ProfilePage.jsx` - Added multi-user support

### Backend

- `backend/controllers/profileController.js` - Added 4 new functions
- `backend/controllers/postController.js` - Added 1 new function
- `backend/routes/profileRoutes.js` - Added 4 new routes
- `backend/routes/postRoutes.js` - Added 1 new route

## Notes

- All endpoints require authentication (Bearer token)
- Profile photos are displayed using initials if no avatar exists
- Follow relationships are bidirectional (updates both users)
- The feature integrates seamlessly with existing functionality
