# Profile & Posts API Reference Guide

## Base URL

```
http://localhost:5000/api
```

All endpoints (except specified) require:

```
Headers: Authorization: Bearer {token}
```

---

## Profile Endpoints

### 1. Get Current User Profile

```http
GET /profile
```

**Response (200):**

```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "handle": "johndoe",
  "avatar": "https://...",
  "college": "AIT Bangalore",
  "branch": "Computer Science",
  "semester": "Sem 6",
  "year": "3rd Year",
  "city": "Bangalore",
  "state": "Karnataka",
  "skills": ["React", "Node.js", "MongoDB"],
  "bio": "Software developer and tech enthusiast",
  "phoneNumber": "+91-9876543210",
  "createdAt": "2023-10-15T10:30:00Z"
}
```

---

### 2. Update User Profile

```http
PUT /profile
```

**Request Body:**

```json
{
  "name": "John Doe",
  "college": "AIT Bangalore",
  "branch": "Computer Science",
  "semester": "Sem 6",
  "year": "3rd Year",
  "city": "Bangalore",
  "state": "Karnataka",
  "skills": ["React", "Node.js"],
  "bio": "Updated bio",
  "phoneNumber": "+91-9876543210"
}
```

**Response (200):** Same as Get Profile

**Errors:**

- 401: Unauthorized (no token)
- 404: User not found
- 500: Server error

---

### 3. Get User Stats

```http
GET /profile/stats
```

**Response (200):**

```json
{
  "followers": [
    {
      "_id": "follower_id",
      "name": "Jane Doe",
      "avatar": "https://..."
    }
  ],
  "following": [
    {
      "_id": "following_id",
      "name": "Bob Smith",
      "avatar": "https://..."
    }
  ],
  "followersCount": 42,
  "followingCount": 35,
  "postsCount": 12
}
```

---

### 4. Follow a User

```http
POST /profile/follow
```

**Request Body:**

```json
{
  "userId": "target_user_id"
}
```

**Response (200):**

```json
{
  "message": "User followed successfully"
}
```

**Errors:**

- 401: Unauthorized
- 404: User not found
- 500: Server error

---

### 5. Unfollow a User

```http
POST /profile/unfollow
```

**Request Body:**

```json
{
  "userId": "target_user_id"
}
```

**Response (200):**

```json
{
  "message": "User unfollowed successfully"
}
```

**Errors:**

- 401: Unauthorized
- 404: User not found
- 500: Server error

---

## Posts Endpoints

### 1. Get User's Posts

```http
GET /posts/user/profile
```

**Response (200):**

```json
[
  {
    "_id": "post_id",
    "title": "Post Title",
    "desc": "Post description with content...",
    "image": "https://cloudinary.com/...",
    "tag": "GENERAL",
    "author": {
      "_id": "author_id",
      "name": "John Doe",
      "handle": "johndoe",
      "avatar": "https://..."
    },
    "likes": ["user_id1", "user_id2"],
    "reposts": ["user_id3"],
    "comments": [
      {
        "user": {
          "_id": "commenter_id",
          "name": "Jane Doe",
          "handle": "janedoe",
          "avatar": "https://..."
        },
        "text": "Great post!",
        "createdAt": "2024-01-10T15:30:00Z"
      }
    ],
    "college": "Global",
    "createdAt": "2024-01-10T14:00:00Z"
  }
]
```

**Errors:**

- 401: Unauthorized
- 404: User not found
- 500: Server error

---

### 2. Delete Post

```http
DELETE /posts/{postId}
```

**Path Parameters:**

```
postId: The ID of the post to delete
```

**Response (200):**

```json
{
  "message": "Post deleted successfully"
}
```

**Errors:**

- 401: Unauthorized (no token)
- 403: Forbidden (not post author)
- 404: Post not found
- 500: Server error

---

### 3. Create Post (with optional file)

```http
POST /posts
Content-Type: multipart/form-data
```

**Form Data:**

```
title: "Post Title"
desc: "Post description (required)"
tag: "GENERAL"
college: "Global"
file: [image/video/document file]
```

**Response (201):**

```json
{
  "_id": "new_post_id",
  "title": "Post Title",
  "desc": "Post description",
  "image": "https://cloudinary.com/...",
  "tag": "GENERAL",
  "author": {
    "_id": "author_id",
    "name": "John Doe",
    "handle": "johndoe",
    "avatar": "https://..."
  },
  "likes": [],
  "reposts": [],
  "comments": [],
  "college": "Global",
  "createdAt": "2024-01-10T15:45:00Z"
}
```

---

### 4. Like/Unlike Post

```http
PUT /posts/{postId}/like
```

**Response (200):**

```json
{
  "likes": ["user_id1", "user_id2"],
  "likesCount": 2
}
```

---

### 5. Add Comment

```http
POST /posts/{postId}/comment
```

**Request Body:**

```json
{
  "text": "This is a comment"
}
```

**Response (200):**

```json
[
  {
    "user": {
      "_id": "commenter_id",
      "name": "Jane Doe",
      "handle": "janedoe",
      "avatar": "https://..."
    },
    "text": "This is a comment",
    "createdAt": "2024-01-10T15:50:00Z"
  }
]
```

---

### 6. Repost

```http
POST /posts/{postId}/repost
```

**Response (200):**

```json
{
  "reposts": ["user_id1"],
  "repostsCount": 1
}
```

---

## Common Error Responses

### 400 Bad Request

```json
{
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "message": "Unauthorized: User not identified"
}
```

### 403 Forbidden

```json
{
  "message": "You can only delete your own posts"
}
```

### 404 Not Found

```json
{
  "message": "Post not found"
}
```

### 500 Server Error

```json
{
  "message": "Error processing request"
}
```

---

## Frontend Usage Examples

### **Fetch User Stats**

```javascript
const token = await auth.currentUser?.getIdToken();
const res = await axios.get(`${API_URL}/profile/stats`, {
  headers: { Authorization: `Bearer ${token}` },
});
setStats(res.data);
```

### **Delete Post**

```javascript
const token = await auth.currentUser?.getIdToken();
await axios.delete(`${API_URL}/posts/${postId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

### **Get User Posts**

```javascript
const token = await auth.currentUser?.getIdToken();
const res = await axios.get(`${API_URL}/posts/user/profile`, {
  headers: { Authorization: `Bearer ${token}` },
});
setUserPosts(res.data);
```

### **Follow User**

```javascript
const token = await auth.currentUser?.getIdToken();
await axios.post(
  `${API_URL}/profile/follow`,
  { userId: targetUserId },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## Rate Limiting & Best Practices

### **Recommendations:**

1. Cache stats data for 1 minute
2. Debounce follow/unfollow actions
3. Implement optimistic updates
4. Show loading states during requests
5. Handle errors gracefully
6. Validate token before requests

### **Performance:**

- Profile stats: Fetch once on page load
- User posts: Fetch when switching to Posts tab
- Follower lists: Fetch when switching to tabs
- Avoid refetching on tab switch if already loaded

---

## Data Validation

### **Profile Update Requirements:**

```
name:         String (1-100 chars)
college:      String (0-100 chars)
branch:       String (0-100 chars)
semester:     String (0-50 chars)
year:         String (0-20 chars)
city:         String (0-50 chars)
state:        String (0-50 chars)
skills:       Array of strings (0-20 items)
bio:          String (0-500 chars)
phoneNumber:  String (0-15 chars)
```

### **Post Creation Requirements:**

```
desc:    String (1-5000 chars) - REQUIRED
title:   String (0-200 chars)
tag:     String - enum: GENERAL, ANNOUNCEMENT, etc.
college: String (0-100 chars)
file:    File (0-50MB) - optional
```

---
