# Profile Page - UI Layout & Features

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ← ProfileName (@handle)                                    │
│  Profile Header - Sticky Navigation Bar                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌────────┐                                                 │
│  │ Avatar │  Name                                           │
│  │  User  │  @handle                                        │
│  └────────┘  Bio goes here if set                          │
│              📍 Location • 🎓 College • 📅 Join Date      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │    42    │  │   1.2K   │  │    856   │                 │
│  │  Posts   │  │Followers │  │Following │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ About | Posts (42) | Followers (1.2K) | Following (856)     │
│─────────────────────────────────────────────────────────────│
│                                                              │
│  TAB CONTENT BELOW (Dynamic based on selected tab)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tab Contents

### 1. **About Tab** - Edit Profile

```
┌─────────────────────────────────────────────────────────────┐
│ Basic Information                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Full Name: [_________________________]                │   │
│ │ Phone:     [_________________________]  📞            │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Education Information                                       │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ College:  [_________________________]  💼            │   │
│ │ Branch:   [_________________________]                │   │
│ │ Year:     [Select ▼]  Semester: [Select ▼]         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Location Information                                        │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ City:     [_________________________]  📍            │   │
│ │ State:    [_________________________]                │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Skills & Bio                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Skills:   [_________________________]  🏆            │   │
│ │           (comma-separated)                          │   │
│ │ Bio:      [_____________________________]            │   │
│ │           [_____________________________]            │   │
│ │           [_____________________________]            │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│                              [Cancel] [💾 Save Changes]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. **Posts Tab** - Manage Your Posts

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌────────────────────────────────────────────────┐   │  │
│  │ │ Author Name                              ⋮     │   │  │
│  │ │ @handle                                   [🗑️]  │   │  │
│  │ │ ──────────────────────────────────────────────── │   │  │
│  │ │                                                  │   │  │
│  │ │ Post Title                                      │   │  │
│  │ │ This is the post description that can be quite  │   │  │
│  │ │ long and may contain multiple lines of text...  │   │  │
│  │ │                                                  │   │  │
│  │ │ [IMAGE DISPLAY AREA - if image exists]         │   │  │
│  │ │                                                  │   │  │
│  │ │ ┌─┬──────────────────────────────┬─┬──┐         │   │  │
│  │ │ │👆│ 45 Likes  │  💬 12 Comments │🔄│  │ Share  │   │  │
│  │ │ └─┴──────────────────────────────┴─┴──┘         │   │  │
│  │ └────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Similar post card repeats...]                       │  │
│  │ with delete button on hover                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  (No posts yet message - if empty)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. **Followers Tab** - View Followers

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌────────┐  User Name 1                              │  │
│  │ │ Avatar │  @username1                               │  │
│  │ └────────┘                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌────────┐  User Name 2                              │  │
│  │ │ Avatar │  @username2                               │  │
│  │ └────────┘                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌────────┐  User Name 3                              │  │
│  │ │ Avatar │  @username3                               │  │
│  │ └────────┘                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  (No followers yet - if empty)                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. **Following Tab** - View Following List

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌────────┐  Following User 1                         │  │
│  │ │ Avatar │  @followinguser1                          │  │
│  │ └────────┘                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌────────┐  Following User 2                         │  │
│  │ │ Avatar │  @followinguser2                          │  │
│  │ └────────┘                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  (Not following anyone yet - if empty)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Interactive Elements

### **Delete Post Button**

```
On Hover:
┌────────────────────────────────┐
│ [🗑️] Red button appears in      │
│      top-right corner of post   │
│                                │
│ Click → Confirmation dialog    │
│ "Delete this post?" [Yes/No]   │
└────────────────────────────────┘

States:
- Default: opacity-0 (hidden)
- Hover: opacity-100 (visible)
- Deleting: opacity-100 with spinner
- Deleted: Post removed from feed
```

---

## Stats Grid Colors & Interactions

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│     42       │  │    1,234     │  │      856     │
│   POSTS      │  │  FOLLOWERS   │  │  FOLLOWING   │
│              │  │              │  │              │
│ (Clickable)  │  │ (Clickable)  │  │ (Clickable)  │
│ to Posts Tab │  │ to Followers │  │ to Following │
└──────────────┘  └──────────────┘  └──────────────┘

Hover Effects:
- Border: white/10 → blue-500/30
- Background: transparent → slight highlight
- Cursor: pointer
```

---

## Error & Success Messages

```
Success Message (Green):
┌──────────────────────────────────────────────────┐
│ ✓ Profile updated successfully! 🎉              │
│ (Auto-hides after 3 seconds)                    │
└──────────────────────────────────────────────────┘

Error Message (Red):
┌──────────────────────────────────────────────────┐
│ ✗ Failed to update profile. Try again.          │
│ (Auto-hides after 3 seconds)                    │
└──────────────────────────────────────────────────┘

Post Deletion Confirmation:
┌──────────────────────────────────┐
│ Are you sure you want to delete  │
│ this post?                       │
│                                  │
│        [Cancel] [Delete]         │
└──────────────────────────────────┘
```

---

## Color Scheme

### **Primary Colors:**

```
Background:     #0f172a (dark blue)
Cards:          rgba(24, 24, 27, 0.5) (zinc-900/50)
Borders:        rgba(255, 255, 255, 0.1) (white/10)
```

### **Text Colors:**

```
Primary:        white
Secondary:      #a1a1a1 (zinc-300)
Tertiary:       #71717a (zinc-500)
Muted:          #52525b (zinc-600)
```

### **Accent Colors:**

```
Active/Hover:   #60a5fa (blue-400)
Buttons:        #2563eb (blue-600) → #1d4ed8 (blue-700 on hover)
Delete:         #dc2626 (red-600) → #b91c1c (red-700 on hover)
Success:        #22c55e (green-500)
```

---

## Responsive Design

### **Desktop (1024px+):**

- Sidebar layout with main content
- Multiple columns for stats
- Hover effects fully visible

### **Tablet (768px-1023px):**

- Single column for stats
- Full-width post cards
- Tab navigation stacks

### **Mobile (<768px):**

- Stack layout
- Vertical stats
- Touch-friendly buttons
- Simplified navigation

---

## Loading States

### **Initial Load:**

```
[Loader icon spinning] Loading profile...
```

### **Saving Profile:**

```
[Loader] Saving...
Button disabled during save
```

### **Deleting Post:**

```
[Red button with spinner]
Disabled during deletion
```

---

## Empty States

### **No Posts:**

```
💬 icon (large, muted color)
"No posts yet. Create your first post!"
```

### **No Followers:**

```
👥 icon (large, muted color)
"No followers yet"
```

### **Not Following Anyone:**

```
👥 icon (large, muted color)
"Not following anyone yet"
```
