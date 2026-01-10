# Code Changes Reference

## 1. PostCard.jsx Changes

### Import Addition

```javascript
// ADD THIS LINE at the top with other imports
import { useNavigate } from "react-router-dom";
```

### Inside Component Function

```javascript
const PostCard = ({ post, currentUser, apiBaseUrl }) => {
  const navigate = useNavigate();  // ADD THIS LINE
  // rest of component...
```

### Avatar Section (In JSX)

```jsx
// CHANGE FROM:
<div className="relative">
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500...">

// TO:
<div className="relative cursor-pointer" onClick={() => navigate(`/profile/${post.author?._id}`)}>
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500...">
```

### Author Name Section (In JSX)

```jsx
// CHANGE FROM:
<p className="text-sm text-zinc-200 font-bold hover:underline cursor-pointer group-hover:text-white transition-colors">
  {post.author?.name || "Unknown User"}
</p>

// TO:
<p
  className="text-sm text-zinc-200 font-bold hover:underline cursor-pointer group-hover:text-white transition-colors"
  onClick={() => navigate(`/profile/${post.author?._id}`)}
>
  {post.author?.name || "Unknown User"}
</p>
```

---

## 2. ProfilePage.jsx Changes

### State Verification

```javascript
// These states should already exist:
const { userId } = useParams();
const [isFollowing, setIsFollowing] = useState(false);
const [followLoading, setFollowLoading] = useState(false);
const [viewingUser, setViewingUser] = useState(null);

// ADD THIS LINE:
const isOwnProfile = !userId;
```

### Update fetchStats Function

```javascript
// CHANGE FROM:
let endpoint = `${API_URL}/profile/stats`;
if (userId) {
  endpoint += `?userId=${userId}`;
}

// TO:
let endpoint = `${API_URL}/profile/stats`;
if (userId) {
  endpoint = `${API_URL}/profile/${userId}/stats`;
}

// And add this after fetching:
if (userId && res.data.isFollowing !== undefined) {
  setIsFollowing(res.data.isFollowing);
}
```

### Update fetchUserProfile Function

```javascript
// CHANGE FROM:
let endpoint = `${API_URL}/profile`;
if (userId) {
  endpoint += `?userId=${userId}`;
}

// TO:
let endpoint = `${API_URL}/profile`;
if (userId) {
  endpoint = `${API_URL}/profile/${userId}`;
}

// After fetching, add:
if (userId && res.data.isFollowing !== undefined) {
  setIsFollowing(res.data.isFollowing);
}
```

### Update fetchUserPostsForProfile Function

```javascript
// CHANGE FROM:
let endpoint = `${API_URL}/posts/user/profile`;
if (userId) {
  endpoint += `?userId=${userId}`;
}

// TO:
let endpoint = `${API_URL}/posts/user/profile`;
if (userId) {
  endpoint = `${API_URL}/posts/user/${userId}`;
}
```

### Update handleFollowToggle Function

```javascript
// CHANGE FROM:
await axios.post(`${API_URL}/profile/unfollow`, { userId }, config);

// TO:
await axios.post(`${API_URL}/profile/${userId}/unfollow`, {}, config);

// AND CHANGE FROM:
await axios.post(`${API_URL}/profile/follow`, { userId }, config);

// TO:
await axios.post(`${API_URL}/profile/${userId}/follow`, {}, config);
```

### Update Header Section (In JSX)

```jsx
// CHANGE FROM:
<h1 className="text-2xl font-bold text-white">
  {currentUser.name}
</h1>

// TO:
<h1 className="text-2xl font-bold text-white">
  {viewingUser?.name || currentUser.name}
</h1>
```

### Update Avatar Section (In JSX)

```jsx
// CHANGE FROM:
{
  currentUser.name?.charAt(0).toUpperCase();
}

// TO:
{
  (viewingUser?.name || currentUser.name)?.charAt(0).toUpperCase();
}
```

### Update Profile Name Section (In JSX)

```jsx
// CHANGE FROM:
<h2 className="text-3xl font-bold text-white">
  {currentUser.name}
</h2>

// TO:
<h2 className="text-3xl font-bold text-white">
  {viewingUser?.name || currentUser.name}
</h2>
```

### Add Follow Button (After Stats Grid)

```jsx
{
  /* Follow/Unfollow Button for Other Users */
}
{
  !isOwnProfile && (
    <div className="flex gap-3">
      <button
        onClick={handleFollowToggle}
        disabled={followLoading}
        className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
          isFollowing
            ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        } disabled:opacity-50`}
      >
        {followLoading ? (
          <Loader size={18} className="animate-spin" />
        ) : isFollowing ? (
          <>
            <UserCheck size={18} />
            Following
          </>
        ) : (
          <>
            <UserPlus size={18} />
            Follow
          </>
        )}
      </button>
    </div>
  );
}
```

### Update Tab Content Condition

```jsx
// CHANGE FROM:
{activeTab === "about" && (
  <form onSubmit={handleSave} className="space-y-6">

// TO:
{activeTab === "about" && isOwnProfile && (
  <form onSubmit={handleSave} className="space-y-6">
```

### Add Read-Only About Section for Other Users

```jsx
// ADD THIS NEW SECTION after the editable form section:
{
  /* View-only About Section for Other Users */
}
{
  activeTab === "about" && !isOwnProfile && (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Bio</h3>
        <p className="text-zinc-300">{formData.bio || "No bio added yet"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education Information */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase size={20} />
            Education
          </h3>
          <div className="space-y-3 text-zinc-300 text-sm">
            {formData.college && (
              <div>
                <span className="text-zinc-400">College:</span>{" "}
                {formData.college}
              </div>
            )}
            {formData.branch && (
              <div>
                <span className="text-zinc-400">Branch:</span> {formData.branch}
              </div>
            )}
            {formData.year && (
              <div>
                <span className="text-zinc-400">Year:</span> {formData.year}
              </div>
            )}
            {formData.semester && (
              <div>
                <span className="text-zinc-400">Semester:</span>{" "}
                {formData.semester}
              </div>
            )}
            {!formData.college &&
              !formData.branch &&
              !formData.year &&
              !formData.semester && (
                <div className="text-zinc-500">
                  No education information added yet
                </div>
              )}
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Location & Contact
          </h3>
          <div className="space-y-3 text-zinc-300 text-sm">
            {formData.city && (
              <div>
                <span className="text-zinc-400">City:</span> {formData.city}
              </div>
            )}
            {formData.state && (
              <div>
                <span className="text-zinc-400">State:</span> {formData.state}
              </div>
            )}
            {!formData.city && !formData.state && (
              <div className="text-zinc-500">
                No location information added yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {formData.skills && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award size={20} />
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {formData.skills.split(",").map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-200 rounded-full text-sm"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 3. profileController.js Backend Changes

### Add These 4 New Functions at the End

```javascript
// Get another user's profile by ID
exports.getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findOne({ email: req.user.email });

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current user is following this user
    const isFollowing = currentUser && currentUser.following.includes(userId);

    res.json({
      _id: user._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
      college: user.college,
      branch: user.branch,
      semester: user.semester,
      year: user.year,
      city: user.city,
      state: user.state,
      skills: user.skills || [],
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      isFollowing: isFollowing,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

// Get another user's stats by ID
exports.getUserStatsById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get post count
    const { Post } = require("../models/Schema");
    const postCount = await Post.countDocuments({ author: user._id });

    res.json({
      followers: user.followers || [],
      following: user.following || [],
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
      postsCount: postCount,
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ message: "Error fetching user stats" });
  }
};

// Follow user by ID
exports.followUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: "User to follow not found" });
    }

    // Add to current user's following
    if (!currentUser.following.includes(userId)) {
      currentUser.following.push(userId);
      await currentUser.save();
    }

    // Add to target user's followers
    if (!userToFollow.followers.includes(currentUser._id)) {
      userToFollow.followers.push(currentUser._id);
      await userToFollow.save();
    }

    res.json({ message: "User followed successfully" });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ message: "Error following user" });
  }
};

// Unfollow user by ID
exports.unfollowUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User to unfollow not found" });
    }

    // Remove from current user's following
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userId
    );
    await currentUser.save();

    // Remove from target user's followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );
    await userToUnfollow.save();

    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ message: "Error unfollowing user" });
  }
};
```

---

## 4. postController.js Backend Changes

### Add This New Function After getUserPosts

```javascript
// Get posts for a specific user by ID
exports.getUserPostsById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ author: userId })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ message: "Error fetching user posts" });
  }
};
```

---

## 5. profileRoutes.js Backend Changes

### Add These 4 Routes Before module.exports

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

---

## 6. postRoutes.js Backend Changes

### Add This Route Before module.exports

```javascript
// Get posts for a specific user by ID (protected)
router.get("/user/:userId", verifyToken, postController.getUserPostsById);
```

**Important:** Place this AFTER the `/user/profile` route to maintain correct matching order!

---

## Summary of All Changes

| File                 | Type     | Changes                                                          |
| -------------------- | -------- | ---------------------------------------------------------------- |
| PostCard.jsx         | Frontend | 1 import + 2 onClick handlers                                    |
| ProfilePage.jsx      | Frontend | ~80 lines (endpoint updates + follow button + read-only display) |
| profileController.js | Backend  | 4 new functions (~110 lines)                                     |
| postController.js    | Backend  | 1 new function (~20 lines)                                       |
| profileRoutes.js     | Backend  | 4 new routes                                                     |
| postRoutes.js        | Backend  | 1 new route                                                      |

All changes are backward compatible and additive.
