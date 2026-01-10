# 📚 Component Documentation & Usage Guide

## Components Overview

### Summary Table

| Component           | Location                                    | Lines | Purpose                 | Status      |
| ------------------- | ------------------------------------------- | ----- | ----------------------- | ----------- |
| **HomePage**        | frontend/src/components/HomePage.jsx        | 401   | Main feed orchestrator  | ✅ Enhanced |
| **PostCard**        | frontend/src/components/PostCard.jsx        | 450   | Individual post display | ✅ Enhanced |
| **TrendingSection** | frontend/src/components/TrendingSection.jsx | 200   | Trending topics sidebar | ✨ New      |
| **FeedPreferences** | frontend/src/components/FeedPreferences.jsx | 180   | User preferences panel  | ✨ New      |
| **AwardsBadges**    | frontend/src/components/AwardsBadges.jsx    | 280   | Gamification system     | ✨ New      |

---

## 📖 Detailed Component Docs

### 1. HomePage.jsx

**Purpose:** Main feed component orchestrating all feed features.

**Key Props:**

```javascript
{
  refreshTrigger, // Trigger re-fetch of posts
    currentUser; // Current authenticated user object
}
```

**Key State:**

```javascript
const [posts, setPosts]                      // Array of posts
const [loading, setLoading]                  // Loading state
const [colleges, setColleges]                // Available colleges
const [filterCollege, setFilterCollege]      // Selected college filter
const [filterTag, setFilterTag]              // Selected tag filter
const [showCreateModal, setShowCreateModal]  // Modal visibility
const [sortBy, setSortBy]                    // Current sort algorithm
const [showPreferences, setShowPreferences]  // Preferences panel visibility
const [feedPreferences, setFeedPreferences]  // User preferences
```

**Key Functions:**

```javascript
fetchGlobalFeed(); // Fetches posts from API
applySorting(posts, sortType); // Applies sort algorithm
handlePostCreated(newPost); // Adds new post to feed
```

**Algorithms Included:**

- `hot`: Balanced engagement scoring
- `new`: Latest first
- `top`: Most upvoted
- `best`: Quality-ranked
- `controversial`: Polarizing content

**Rendered Components:**

- TrendingSection (desktop only)
- FeedPreferences (modal)
- PostCard (for each post)
- CreatePostModal (for new posts)

**CSS Classes Used:**

- `gradient-to-b from-zinc-950` - Background gradient
- `sticky top-24` - Sticky header
- `animate-in slide-in-from-bottom` - Post animations
- Various Tailwind classes for styling

---

### 2. PostCard.jsx

**Purpose:** Display individual post with full interactivity.

**Key Props:**

```javascript
{
  post, // Post object with full data
    currentUser, // Current user for interaction checks
    apiBaseUrl, // API base URL for calls
    onPostUpdate; // Callback when post is updated
}
```

**Key State:**

```javascript
const [likes, setLikes]                // Array of user IDs who liked
const [comments, setComments]          // Array of comments
const [reposts, setReposts]            // Array of user IDs who reposted
const [showComments, setShowComments]  // Show/hide comment section
const [newComment, setNewComment]      // Current comment being typed
const [isSubscribed, setIsSubscribed]  // Follow status
const [isSaved, setIsSaved]            // Bookmark status
const [showMore, setShowMore]          // Show full text
const [views, setViews]                // View count
```

**Key Functions:**

```javascript
handleLike(); // Like/unlike post
handleRepost(); // Repost functionality
handleComment(e); // Submit comment
getAuthToken(); // Get Firebase token
```

**Engagement Metrics Calculated:**

```javascript
const engagementScore =
  (likes × 2) + (comments × 1) + (reposts × 1.5)

const upvoteRate =
  (likes / (likes + dislikes)) × 100
```

**Features:**

- Author info with badges
- Online status indicator
- Engagement metrics display
- Vote up/down buttons
- Comment section with threading
- Save/bookmark functionality
- Share options

---

### 3. TrendingSection.jsx

**Purpose:** Display trending topics and popular posts.

**Key Props:**

```javascript
{
  posts, // Array of all posts
    currentUser; // Current user for personalization
}
```

**Key Computed Values:**

```javascript
const trendingTopics    // Extracted hashtags with counts
const trendingPosts     // Top 5 posts by engagement
```

**Features:**

- Auto-extracts hashtags from posts
- Calculates engagement scores
- Shows trending leaderboard
- Community suggestions
- Premium tips section
- Leaderboard ranking

**Sub-sections:**

1. **Trending Today** - Top 8 hashtags with post counts
2. **Top This Week** - Top 5 posts ranked by engagement
3. **Communities** - Suggestions to join
4. **Premium Tips** - Feature highlights
5. **Footer** - Links and copyright

---

### 4. FeedPreferences.jsx

**Purpose:** User customization and preferences panel.

**Key Props:**

```javascript
{
  preferences, // Current preferences object
    onPreferencesChange; // Callback when preferences change
}
```

**Preferences Available:**

```javascript
{
  autoplay: Boolean,       // Video autoplay
  hideNSFW: Boolean,       // Hide mature content
  compactMode: Boolean,    // Dense feed layout
  showAds: Boolean         // Show sponsored content
}
```

**Advanced Settings:**

- Content Language (English, Hindi, Spanish, etc.)
- Posts per Load (5, 10, 20, 30)
- Theme (Dark Mode, Light Mode, Auto)

**Functions:**

```javascript
handlePreferenceChange(key); // Toggle preference
```

**UI Layout:**

- 2x2 grid for main preferences
- Dropdown menus for advanced settings
- Toggle switches with visual feedback
- Tip section about preference sync

---

### 5. AwardsBadges.jsx

**Purpose:** Display achievements and award management.

**Key Props:**

```javascript
{
  currentUser, // User to calculate badges for
    postData; // Array of posts for calculations
}
```

**Key State:**

```javascript
const [showAwardsModal, setShowAwardsModal]  // Award modal visibility
```

**Key Functions:**

```javascript
calculateBadges(); // Compute earned badges for user
```

**Achievement Badges (10 types):**

```javascript
{
  id: "starter",
  name: "Starter",
  icon: "🌱",
  color: "from-green-500",
  condition: posts >= 1
}
// ... and 9 more similar badges
```

**Award Types (6 types):**

```javascript
{
  id: "gold",
  name: "Gold Award",
  icon: "🥇",
  description: "Exceptional quality post",
  cost: 500,
  color: "from-yellow-500 to-yellow-600"
}
// ... and 5 more award types
```

**UI Sections:**

1. **Your Achievements** - Display earned badges
2. **Award This Post** - Award store interface
3. **Campus Leaderboard** - Ranking info

---

## 🔗 Component Integration

### How They Work Together

```
App.jsx
  ↓
HomePage.jsx (Main Controller)
  ├─ TrendingSection (Desktop Sidebar)
  ├─ FeedPreferences (Modal)
  ├─ PostCard (Repeated for each post)
  │  └─ Comment interactions
  └─ CreatePostModal (New posts)

AwardsBadges (Can be imported anywhere)
```

### Data Flow

```
HomePage
  ↓ (fetch posts)
API Backend
  ↓ (return posts)
HomePage (applies sorting)
  ↓ (split to components)
  ├→ TrendingSection (analyzes posts)
  ├→ PostCard (displays individual)
  └→ AwardsBadges (calculates achievements)
```

### State Management

```
HomePage (parent state)
  ├─ posts[]           → shared with TrendingSection & PostCard
  ├─ loading           → shown to user
  ├─ sortBy            → determines order
  ├─ filterCollege     → filters posts
  ├─ filterTag         → filters posts
  └─ feedPreferences   → customization

PostCard (local state)
  ├─ likes[]           → optimistic update
  ├─ comments[]        → local display
  └─ showComments      → UI state

FeedPreferences (controlled by HomePage)
  └─ preferences       → synced back to HomePage
```

---

## 🎯 Common Usage Patterns

### Using HomePage in App.jsx

```javascript
import HomePage from "./components/HomePage";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return <HomePage refreshTrigger={refreshTrigger} currentUser={currentUser} />;
}
```

### Importing AwardsBadges (In ProfilePage)

```javascript
import AwardsBadges from "./components/AwardsBadges";

export default function ProfilePage({ user, posts }) {
  return (
    <div>
      {/* Other profile content */}
      <AwardsBadges currentUser={user} postData={posts} />
    </div>
  );
}
```

### Creating Custom Feed Sort

```javascript
// In HomePage.jsx, add new case:
case "recent_engagement":
  return postsToSort.sort((a, b) => {
    const ageA = (Date.now() - new Date(a.createdAt)) / (1000 * 60);
    const ageB = (Date.now() - new Date(b.createdAt)) / (1000 * 60);

    const scoreA = (a.likes?.length || 0) / (ageA + 1);
    const scoreB = (b.likes?.length || 0) / (ageB + 1);

    return scoreB - scoreA;
  });
```

### Extending Badge Logic

```javascript
// In AwardsBadges.jsx, calculateBadges():
if (totalPosts >= 100) {
  badges.push({
    id: "legendary",
    name: "Legendary",
    icon: "👑",
    color: "from-purple-500",
  });
}
```

---

## 🎨 CSS & Styling

### Classes Used Across Components

**Colors:**

```css
bg-blue-600, bg-purple-500, bg-orange-500, bg-green-500
text-zinc-300, text-white, text-zinc-500
border-white/10, border-white/20
```

**Animations:**

```css
animate-in, fade-in, slide-in-from-bottom, scale-in
animate-pulse, animate-glow, animate-spin
hover:border-white/30, hover:bg-white/10
```

**Utilities:**

```css
rounded-xl, rounded-full
px-4, py-2, gap-3
flex, items-center, justify-between
```

**Custom Classes:**

```css
.glass              /* Glass morphism */
/* Glass morphism */
.gradient-text      /* Gradient text effect */
.btn-hover-lift     /* Button elevation */
.card-hover; /* Card lift effect */
```

---

## 🔧 Props Reference

### Expected Post Schema

```javascript
{
  _id: String,
  title: String,
  desc: String,
  tag: String,                    // ANNOUNCEMENT, MEME, etc.
  college: String,
  author: {
    _id: String,
    name: String,
    handle: String,
    avatar: String,
    isModerator: Boolean,
    isVerified: Boolean
  },
  likes: [String],                // Array of user IDs
  dislikes: [String],
  comments: [{
    user: { name, _id },
    text: String,
    createdAt: Date
  }],
  reposts: [String],
  views: Number,
  createdAt: Date
}
```

### Expected User Schema

```javascript
{
  _id: String,
  name: String,
  email: String,
  avatar: String,
  college: String,
  handle: String,
  isVerified: Boolean,
  isModerator: Boolean,
  bio: String,
  followers: [String],            // Array of user IDs
  following: [String],
  createdAt: Date
}
```

---

## 🚀 Performance Tips

### Optimization Strategies

1. **Limit Posts Shown**

   - Use pagination
   - Show 10-20 at first
   - Load more on scroll

2. **Memoization**

   - Wrap components with React.memo
   - Prevent unnecessary re-renders

3. **Lazy Loading**

   - Load trending data separately
   - Load comments on demand

4. **Image Optimization**
   - Use next/image or similar
   - Compress avatars
   - Use CDN for serving

---

## 🧪 Testing Checklist

### Unit Tests (Per Component)

**HomePage.jsx**

- [ ] Posts load correctly
- [ ] Sorting algorithms work
- [ ] Filters apply properly
- [ ] Preferences save

**PostCard.jsx**

- [ ] Like button increments
- [ ] Comments display
- [ ] Repost works
- [ ] Bookmark toggles

**TrendingSection.jsx**

- [ ] Hashtags extracted
- [ ] Posts ranked by engagement
- [ ] Links clickable

**FeedPreferences.jsx**

- [ ] Toggles work
- [ ] Dropdowns populate
- [ ] Changes persist

**AwardsBadges.jsx**

- [ ] Badges calculate correctly
- [ ] Awards display
- [ ] Modal opens/closes

### Integration Tests

- [ ] Components render together
- [ ] Data flows correctly
- [ ] No console errors
- [ ] Responsive on all devices

---

## 📦 Dependencies

### Already Included

```
react
axios
lucide-react
firebase/auth
react-router-dom
tailwindcss
```

### No New Dependencies Added ✅

---

## 🎓 Learning Resources

### To Understand the Code

1. Read HomePage.jsx first (main logic)
2. Look at PostCard.jsx (interactive component)
3. Review TrendingSection.jsx (data analysis)
4. Check FeedPreferences.jsx (state management)
5. Study AwardsBadges.jsx (calculation logic)

### Key Concepts Used

- React Hooks (useState, useEffect)
- Array methods (sort, filter, map, reduce)
- Conditional rendering
- Event handling
- Optimistic updates
- Props drilling
- Component composition

---

## 🐛 Debugging Tips

### Console Logging

Add to any function:

```javascript
console.log("Variable name:", variableName);
```

### React DevTools

Use browser extension to:

- Inspect component tree
- Check props values
- Watch state changes
- Trace re-renders

### Network Tab

Check:

- API request/response
- Response times
- Error codes
- Data payload

---

## 🔒 Security Considerations

### Current Implementation

✅ Uses Firebase auth for tokens
✅ Authorization headers sent
✅ User ID validation
✅ No sensitive data in console

### Best Practices

- Always validate user ownership
- Check permissions before API calls
- Sanitize user input
- Use HTTPS in production

---

## 📈 Scalability Notes

### Current Limits

- Works well with 100-1000 posts
- Rendering all posts in memory
- No pagination implemented

### For Growth

- Implement pagination
- Virtual scrolling for large lists
- Server-side sorting/filtering
- Caching layer
- CDN for assets

---

## 🎯 Future Enhancement Ideas

### Phase 2

- [ ] User profiles with badges displayed
- [ ] Award notifications
- [ ] Achievement progress tracking
- [ ] Leaderboard page

### Phase 3

- [ ] Real-time notifications (WebSocket)
- [ ] User subscriptions/follows
- [ ] Custom feed algorithms
- [ ] Content recommendations (ML)

### Phase 4

- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Browser extension
- [ ] API for third-party apps

---

## 📞 Support & Help

### Common Issues

**Issue: Components not showing**

- Check imports are correct
- Verify component file exists
- Check prop passing

**Issue: Styles look wrong**

- Verify Tailwind CSS is loaded
- Check class names spelled correctly
- Clear browser cache

**Issue: Data not updating**

- Check API connection
- Verify backend is running
- Check browser console for errors

---

**Version:** 1.0  
**Last Updated:** January 2024  
**Status:** Production Ready ✅

Enjoy building with these components! 🚀
