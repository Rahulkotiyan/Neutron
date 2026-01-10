# 🎨 Premium HomePage - Visual & Feature Reference

## 🏗️ Page Layout Architecture

### Desktop View (≥1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                  │
├──────────┬──────────────────────────────┬──────────────────────┤
│          │                              │                      │
│ SIDEBAR  │                              │  TRENDING SECTION    │
│ (Fixed)  │                              │  (Fixed, Sticky)     │
│          │                              │                      │
│ - Home   │    MAIN FEED                 │  - Trending Topics   │
│ - Groups │                              │  - Top Posts         │
│ - Market │    ┌──────────────────────┐  │  - Communities       │
│ - Notices│    │ Create Post Box       │  │  - Premium Tips      │
│ - Notes  │    └──────────────────────┘  │                      │
│ - etc    │                              │  └──────────────────┘
│          │    ┌──────────────────────┐  │
│          │    │ [HOT][NEW][TOP][BEST]│  │
│          │    │ [CONTROVERSIAL]      │  │
│          │    └──────────────────────┘  │
│          │                              │
│          │    ┌──────────────────────┐  │
│          │    │ Post Card 1          │  │
│          │    │ 🔥📊💬                │  │
│          │    └──────────────────────┘  │
│          │                              │
│          │    ┌──────────────────────┐  │
│          │    │ Post Card 2          │  │
│          │    │ 🔥📊💬                │  │
│          │    └──────────────────────┘  │
│          │                              │
│          │    ... More Posts ...        │
│          │                              │
└──────────┴──────────────────────────────┴──────────────────────┘
```

### Tablet View (768px - 1024px)

```
┌──────────────────────────────────────────┐
│          HEADER (Hamburger)              │
├──────────────────────────────────────────┤
│                                          │
│         MAIN FEED (Full Width)           │
│                                          │
│    ┌──────────────────────────────┐     │
│    │ Create Post Box              │     │
│    └──────────────────────────────┘     │
│                                          │
│    ┌──────────────────────────────┐     │
│    │ [HOT][NEW][TOP]              │     │
│    │ [BEST][CONTROVERSIAL]        │     │
│    └──────────────────────────────┘     │
│                                          │
│    ┌──────────────────────────────┐     │
│    │ Post Cards                   │     │
│    │                              │     │
│    │ More Posts...                │     │
│    └──────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

### Mobile View (<768px)

```
┌──────────────────────────┐
│    HEADER (☰ | Logo)     │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │ Create Post Box    │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ [HOT][NEW][TOP]    │  │
│  │ [BEST][CONTRV.]    │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Post Card 1        │  │
│  │ 🔥📊💬              │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Post Card 2        │  │
│  │ 🔥📊💬              │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

---

## 🎯 Sorting Algorithms Visual

### Algorithm Comparison Matrix

```
┌────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Algorithm      │ Weight   │ Weight   │ Weight   │ Result   │
│                │ Likes    │ Comments │ Reposts  │ Formula  │
├────────────────┼──────────┼──────────┼──────────┼──────────┤
│ 🔥 HOT (Def)   │ 2.0x     │ 1.0x     │ 1.5x     │ Balanced │
│ 🕐 NEW         │ Time     │ Time     │ Time     │ Latest   │
│ ⬆️ TOP         │ 1.0x     │ 0x       │ 0x       │ Upvotes  │
│ ✨ BEST        │ 1.0x     │ 0.5x     │ -1.0x    │ Quality  │
│ 💣 CONTROVERSIAL│min(↑↓)  │ both     │ both     │ Polarize │
└────────────────┴──────────┴──────────┴──────────┴──────────┘

🔥 HOT Score Example:
  Post: 50 likes, 20 comments, 10 reposts
  Score = (50 × 2) + (20 × 1) + (10 × 1.5)
        = 100 + 20 + 15 = 135 points

💣 CONTROVERSIAL Score Example:
  Post: 100 likes, 80 dislikes, 150 comments
  Score = min(100, 80) × engagement
        = 80 (highly polarized)
```

---

## 🎨 Create Post Section

```
┌─────────────────────────────────────────────────┐
│  Gradient: Blue → Purple (Semi-transparent)     │
│                                                  │
│  ┌──────┐                                        │
│  │ Avatar│  What's happening?!          [Post]   │
│  │   ☺️  │  ─────────────────────────────────   │
│  └──────┘  📷  😊                                │
│                                                  │
└─────────────────────────────────────────────────┘

Interactions:
- Click text → Opens CreatePostModal
- Click Post button → Submit
- Image/Emoji buttons → Visual cues for users
```

---

## 📊 Post Card Breakdown

```
┌─────────────────────────────────────────────────────┐
│ Post Card (Gradient BG + Border)                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────┐                                             │
│  │🟢 ☺️ │ User Name        @handle  ✓ MOD           │
│  │  •  │ [College Badge]  [Tag Badge]               │
│  └─────┘ Jan 15, 2024 • 👁️ 1.2K views             │
│                                                      │
│  Post Title (If Exists)                             │
│  ─────────────────────────                          │
│  Post content text here...                          │
│  More content...                                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔥 2.5K engagement • ↑ 87% upvote rate  🏆  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [⬆️ 234] | [💬 45 Comments] | [🔄 12] | [📤 Share]│
│                                                      │
│  💬 Comments Section (if expanded)                 │
│  ┌─────────────────────────────────────────────┐  │
│  │ You: [Type comment...]            [Send]    │  │
│  │                                             │  │
│  │ Comment 1: User A - "Great post!"           │  │
│  │ Comment 2: User B - "Thanks for sharing"    │  │
│  └─────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘

Color Coding:
- Liked: 🔥 Orange background
- Saved: 🔖 Yellow highlight
- Trending: 🚀 Purple glow
```

---

## 🏆 Engagement Metrics Display

```
┌────────────────────────────────────────────┐
│ Engagement Score Indicator                 │
├────────────────────────────────────────────┤
│                                            │
│  Post A:  🔥 2.5K engagement  ↑ 87%       │
│  Post B:  🔥 834 engagement   ↑ 72%       │
│  Post C:  🔥 156 engagement   ↑ 64%       │
│                                            │
│  Calculation:                              │
│  ──────────────                            │
│  Engagement = (Likes × 2) +                │
│               (Comments × 1) +             │
│               (Reposts × 1.5)              │
│                                            │
│  Upvote Rate = Upvotes / Total Votes      │
│              = (Likes) / (Likes + Dislikes)│
│                                            │
└────────────────────────────────────────────┘
```

---

## 🎮 Gamification System

### Achievement Badges Progression

```
Level 1: Getting Started 🌱
├─ 🌱 Starter (1+ posts)
└─ ❤️ Well Liked (10+ likes)

Level 2: Active Contributor 🔥
├─ 🔥 Active Member (10+ posts)
├─ 💬 Conversationalist (5+ comments)
└─ 💖 Loved (100+ likes)

Level 3: Power User ⚡
├─ ⚡ Power User (50+ posts)
├─ 🧠 Thought Leader (50+ comments)
└─ ⭐ Superstar (500+ likes)

Level 4: Influencer 🚀
├─ 🚀 Going Viral (1+ trending posts)
├─ 📈 Consistent (all engagement types)
└─ 👑 Legendary (100+ posts with engagement)

Display Format:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    🌱        │ │    🔥        │ │    ⚡        │
│  Starter     │ │Active Member │ │ Power User   │
│  Unlocked ✓  │ │  Unlocked ✓  │ │ Unlocked ✓   │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Award Store Interface

```
┌───────────────────────────────────────┐
│ Award This Post 💰 500 coins available │
├───────────────────────────────────────┤
│                                       │
│ [🥇 Gold      500 coins] [Award]      │
│ [🥈 Silver    250 coins] [Award]      │
│ [🥉 Bronze    100 coins] [Award]      │
│ [🔥 Fire      150 coins] [Award]      │
│ [❤️ Heart     100 coins] [Award]      │
│ [🧠 Brain     200 coins] [Award]      │
│                                       │
└───────────────────────────────────────┘
```

---

## 🌈 Trending Section (Sidebar)

```
┌─────────────────────────────────┐
│ 🔥 Trending Today               │
├─────────────────────────────────┤
│                                 │
│ #1 Trending #exam              │
│     └─ 24 posts                │
│     └─ "Exams starting next... │
│                                 │
│ #2 Trending #placement         │
│     └─ 18 posts                │
│     └─ "Company X hiring..."   │
│                                 │
│ #3 Trending #sports            │
│     └─ 12 posts                │
│     └─ "Football match today"  │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🏆 Top This Week                │
├─────────────────────────────────┤
│                                 │
│ 1️⃣ Post Title                   │
│    ❤️ 234 | 💬 12 | 👁️ 2.3K    │
│                                 │
│ 2️⃣ Post Title                   │
│    ❤️ 189 | 💬 8 | 👁️ 1.8K     │
│                                 │
│ 3️⃣ Post Title                   │
│    ❤️ 156 | 💬 5 | 👁️ 1.2K     │
│                                 │
│ 4️⃣ Post Title                   │
│    ❤️ 123 | 💬 3 | 👁️ 856      │
│                                 │
│ 5️⃣ Post Title                   │
│    ❤️ 98 | 💬 2 | 👁️ 612       │
│                                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 👥 Communities for You          │
├─────────────────────────────────┤
│                                 │
│ [🎓 Academic Help] → Join       │
│ [🎉 Campus Events] → Join       │
│ [🤝 Make Friends] → Join        │
│ [💼 Career Tips] → Join         │
│                                 │
└─────────────────────────────────┘
```

---

## 🎛️ Feed Preferences Panel

```
┌──────────────────────────────────────────────┐
│ Feed Preferences                             │
│ Customize your feed experience               │
├──────────────────────────────────────────────┤
│                                              │
│ ⚙️ BASIC SETTINGS                            │
│                                              │
│ [⚡] Autoplay Videos                         │
│      Videos will start playing automatically│
│                                              │
│ [👁️] Hide NSFW Content                      │
│      Hide mature content from your feed      │
│                                              │
│ [📐] Compact Mode                            │
│      Show more posts with less whitespace   │
│                                              │
│ [📢] Show Sponsored                          │
│      See sponsored posts and recommendations│
│                                              │
├──────────────────────────────────────────────┤
│ ⚙️ ADVANCED SETTINGS                         │
│                                              │
│ Language: [English ▼]                        │
│ Posts per Load: [10 posts ▼]                 │
│ Theme: [Dark Mode ▼]                         │
│                                              │
│ 💡 These preferences sync across all devices│
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme & Badges

### Tag Colors

```
┌──────────────────────────────────────┐
│ 📌 ANNOUNCEMENT                       │ Red/Orange
│ ❓ QUESTION                            │ Blue
│ 😂 MEME                                │ Purple
│ 📍 LOST_FOUND                          │ Yellow
│ 🎪 EVENT                               │ Green
│ 📢 OFFICIAL                            │ Blue (Bright)
│ 🗣️ GENERAL                             │ Grey
│ 🔐 CONFESSION                          │ Pink
└──────────────────────────────────────┘

### Status Indicators
```

🟢 Online (Solid green)
🟡 Away (Yellow)
🔴 Offline (Red)
● With gradient pulse animation

```

### Badge Types
```

College Badge: Blue background, white text
Tag Badge: Colored background, white text
Verified: Blue checkmark (✓)
Moderator: Green "MOD" label
Premium: Purple gradient badge
Trending: Orange fire badge 🔥

```

---

## 📊 Statistics Bar (Bottom of Feed)

```

┌─────────────────────────────────────────────────┐
│ 🔥 234 Hot Posts | 🌍 8 Colleges Active | ⬆️ 15.2K│
└─────────────────────────────────────────────────┘

Meaning:

- 🔥 Number of posts shown
- 🌍 Active colleges in feed
- ⬆️ Total upvotes on all posts

```

---

## ⌚ Time Display Format

```

Relative Time (How posts show time):

- Just now
- 5m ago
- 2h ago
- Yesterday
- Jan 15, 2024
- 2 months ago

Display Example:
Created: Jan 15, 2024 • 👁️ 1.2K views
└─ Shows date and view count

```

---

## 🔄 Loading States

```

Initial Load:
┌──────────────────────────┐
│ ⏳ Loading... │
│ │
│ Fetching Premium Feed │
│ Updating algorithms │
│ │
└──────────────────────────┘

Skeleton/Placeholder:
┌──────────────────────────┐
│ ░░░ ░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░ │
│ │
│ ░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░ │
└──────────────────────────┘

Empty State:
┌──────────────────────────┐
│ │
│ 🌍 │
│ No posts found │
│ │
│ Be the first to share! │
│ [Create Post] │
│ │
└──────────────────────────┘

```

---

## 🎯 Interaction Feedback

### Button States

```

UPVOTE BUTTON:
Default: ⬆️ [234] (Grey text)
Hover: ⬆️ [234] (Orange highlight)
Clicked: ⬆️ [235] 🔥 (Orange fill, count +1)

SAVE BUTTON:
Default: 🔖 (Grey)
Hover: 🔖 (Yellow highlight)
Saved: 🔖 ✓ (Yellow fill)

COMMENT BUTTON:
Default: 💬 [12] (Grey)
Hover: 💬 [12] (White)
Active: 💬 Comments ▼ (Expanded)

REPOST BUTTON:
Default: 🔄 [5] (Grey)
Hover: 🔄 [5] (Green highlight)
Reposted: 🔄 [6] ✓ (Green fill, count +1)

```

---

## 🚀 Animation Timeline

```

Page Load Sequence:

1. Header appears (fade-in: 0.3s)
2. Sidebar slides in (slide-in-left: 0.4s)
3. Create post box fades (fade-in: 0.5s)
4. Filters appear (slide-in-top: 0.6s)
5. Posts stagger-load (slide-in-bottom: 0.5s each, stagger 50ms)
6. Trending section loads (fade-in: 0.7s)

Post Interaction:

1. Click like → Button glow (300ms)
2. Counter update → Number shake (200ms)
3. Heart animate → Pulse effect (500ms)

```

---

## 📝 Typography Reference

```

Font Sizes:

- Title: 2xl (20px)
- Heading: lg (18px)
- Body: base (16px)
- Small: sm (14px)
- Tiny: xs (12px)

Font Weights:

- Regular: 400
- Medium: 500
- Bold: 700

Color Hierarchy:

- Primary Text: White
- Secondary: zinc-300
- Tertiary: zinc-500
- Muted: zinc-600

```

---

## 🎊 Summary

This visual reference shows:
✅ Complete layout architecture
✅ All color schemes and badges
✅ Interaction feedback patterns
✅ Animation sequences
✅ Component breakdowns
✅ Responsive design layouts
✅ Loading and empty states
✅ Gamification display

Use this as a quick reference while building or customizing your premium feed!

**Happy developing! 🚀**
```
