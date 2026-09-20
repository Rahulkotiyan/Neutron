const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, inArray, desc, sql } = require('drizzle-orm');

const now = () => new Date().toISOString();

// Simple in-memory cache with TTL
const cache = new Map();
const getCached = (key, ttlMs = 300000) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) { cache.delete(key); return null; }
  return entry.data;
};
const setCached = (key, data) => cache.set(key, { data, ts: Date.now() });

const formatUser = (u) => ({
  _id: u.id, name: u.name, email: u.email, handle: u.handle, username: u.username,
  avatar: u.avatar, banner: u.banner, college: u.college, branch: u.branch,
  semester: u.semester, year: u.year, city: u.city, state: u.state,
  skills: u.skills ? JSON.parse(u.skills) : [], bio: u.bio, shortBio: u.shortBio,
  phoneNumber: u.phoneNumber, externalLink: u.externalLink,
  isAdmin: u.isAdmin === 1, isActive: u.isActive !== 0,
  hasProfile: u.hasProfile === 1, createdAt: u.createdAt,
});

exports.createProfile = async (req, res) => {
  try {
    const { name, username, college, branch, year, about } = req.body;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.id, req.user.id)).limit(1);
    if (!users.length) return res.status(404).json({ message: "User not found" });
    const user = users[0];

    if (username) {
      const existing = await db.select().from(schema.users).where(eq(schema.users.username, username.toLowerCase())).limit(1);
      if (existing.length && existing[0].id !== user.id) return res.status(400).json({ message: "Username is already taken" });
    }

    const updates = {};
    if (req.files) {
      if (req.files.avatar) updates.avatar = req.files.avatar[0].path;
      if (req.files.banner) updates.banner = req.files.banner[0].path;
    }
    if (name) updates.name = name;
    if (username) { updates.username = username.toLowerCase(); updates.handle = "@" + username; }
    if (college) updates.college = college;
    if (branch) updates.branch = branch;
    if (year) updates.year = year;
    if (about) updates.bio = about;
    updates.hasProfile = 1;
    updates.updatedAt = now();

    await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id));
    const updated = (await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1))[0];
    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ message: "Error creating profile" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.id, req.user.id)).limit(1);
    if (!users.length) return res.status(404).json({ message: "User not found" });
    res.json(formatUser(users[0]));
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, username, college, branch, semester, year, city, state, skills, bio, shortBio, phoneNumber, externalLink } = req.body;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.id, req.user.id)).limit(1);
    if (!users.length) return res.status(404).json({ message: "User not found" });
    const user = users[0];

    if (username && username !== user.username) {
      const existing = await db.select().from(schema.users).where(eq(schema.users.username, username.toLowerCase())).limit(1);
      if (existing.length && existing[0].id !== user.id) return res.status(400).json({ message: "Username is already taken" });
    }

    const updates = {};
    if (req.files) {
      if (req.files.avatar) updates.avatar = req.files.avatar[0].path;
      if (req.files.banner) updates.banner = req.files.banner[0].path;
    }
    if (name) updates.name = name;
    if (username) { updates.username = username.toLowerCase(); updates.handle = "@" + username; }
    if (college) updates.college = college;
    if (branch) updates.branch = branch;
    if (semester) updates.semester = semester;
    if (year) updates.year = year;
    if (city) updates.city = city;
    if (state) updates.state = state;
    if (skills) {
      const arr = Array.isArray(skills) ? skills.filter(s => s.trim()).map(s => s.trim()) : skills.split(",").map(s => s.trim()).filter(s => s);
      updates.skills = JSON.stringify(arr);
    }
    if (bio) updates.bio = bio;
    if (shortBio) updates.shortBio = shortBio;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (externalLink) updates.externalLink = externalLink;
    updates.hasProfile = 1;
    updates.updatedAt = now();

    await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id));
    const updated = (await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1))[0];
    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const db = getDb();
    const user = req.user;

    const [followers, following, postCount] = await Promise.all([
      db.select({ id: schema.userFollows.followerId }).from(schema.userFollows).where(eq(schema.userFollows.followingId, user.id)),
      db.select({ id: schema.userFollows.followingId }).from(schema.userFollows).where(eq(schema.userFollows.followerId, user.id)),
      db.select({ count: sql`COUNT(*)` }).from(schema.posts).where(eq(schema.posts.author, user.id)),
    ]);

    res.json({
      followers: followers.map(f => ({ _id: f.id })),
      following: following.map(f => ({ _id: f.id })),
      followersCount: followers.length,
      followingCount: following.length,
      postsCount: parseInt(postCount[0]?.count || 0),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user stats" });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const db = getDb();
    const currentUser = req.user;
    if (!currentUser) return res.status(404).json({ message: "Current user not found" });

    const target = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!target.length) return res.status(404).json({ message: "User to follow not found" });

    const existing = await db.select().from(schema.userFollows)
      .where(and(eq(schema.userFollows.followerId, currentUser.id), eq(schema.userFollows.followingId, userId))).limit(1);

    if (!existing.length) {
      await db.insert(schema.userFollows).values({ followerId: currentUser.id, followingId: userId });
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(), recipient: userId, sender: currentUser.id,
        type: "FOLLOW", title: "New Follower",
        message: `${currentUser.name} started following you`,
        relatedEntityType: "USER", relatedEntityId: currentUser.id,
        createdAt: now(),
      });
    }

    res.json({ message: "User followed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error following user" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const db = getDb();
    const currentUser = req.user;
    if (!currentUser) return res.status(404).json({ message: "Current user not found" });

    const target = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!target.length) return res.status(404).json({ message: "User to unfollow not found" });

    await db.delete(schema.userFollows)
      .where(and(eq(schema.userFollows.followerId, currentUser.id), eq(schema.userFollows.followingId, userId)));

    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

exports.getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentUser = req.user;
    const isFollowing = currentUser ? (await db.select().from(schema.userFollows)
      .where(and(eq(schema.userFollows.followerId, currentUser.id), eq(schema.userFollows.followingId, userId))).limit(1)).length > 0 : false;

    res.json({ ...formatUser(user), userId: user.id, isFollowing });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

exports.getUserStatsById = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    const [followers, following, postCount] = await Promise.all([
      db.select({ id: schema.users.id, name: schema.users.name, avatar: schema.users.avatar })
        .from(schema.userFollows).leftJoin(schema.users, eq(schema.userFollows.followerId, schema.users.id))
        .where(eq(schema.userFollows.followingId, userId)),
      db.select({ id: schema.users.id, name: schema.users.name, avatar: schema.users.avatar })
        .from(schema.userFollows).leftJoin(schema.users, eq(schema.userFollows.followingId, schema.users.id))
        .where(eq(schema.userFollows.followerId, userId)),
      db.select({ count: sql`COUNT(*)` }).from(schema.posts).where(eq(schema.posts.author, userId)),
    ]);

    res.json({
      followers: followers || [], following: following || [],
      followersCount: followers.length, followingCount: following.length,
      postsCount: parseInt(postCount[0]?.count || 0),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user stats" });
  }
};

exports.followUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    const currentUser = req.user;
    if (!currentUser) return res.status(404).json({ message: "Current user not found" });

    const target = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (!target.length) return res.status(404).json({ message: "User to follow not found" });

    const existing = await db.select().from(schema.userFollows)
      .where(and(eq(schema.userFollows.followerId, currentUser.id), eq(schema.userFollows.followingId, userId))).limit(1);

    if (!existing.length) {
      await db.insert(schema.userFollows).values({ followerId: currentUser.id, followingId: userId });
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(), recipient: userId, sender: currentUser.id,
        type: "FOLLOW", title: "New Follower",
        message: `${currentUser.name} started following you`,
        relatedEntityType: "USER", relatedEntityId: currentUser.id,
        createdAt: now(),
      });
    }

    res.json({ message: "User followed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error following user" });
  }
};

exports.unfollowUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    const currentUser = req.user;
    if (!currentUser) return res.status(404).json({ message: "Current user not found" });

    await db.delete(schema.userFollows)
      .where(and(eq(schema.userFollows.followerId, currentUser.id), eq(schema.userFollows.followingId, userId)));

    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 30 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 30, 100);
    const db = getDb();
    let targetId;

    if (userId) {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (!users.length) return res.status(404).json({ message: "User not found" });
      targetId = users[0].id;
    } else {
      targetId = req.user.id;
    }

    const cacheKey = `activity:${targetId}:${limitNum}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // Fetch all activity IDs in parallel
    const [likedRows, dislikedRows, commentedRows, savedRows, starredRows, likedNoteRows] = await Promise.all([
      db.select({ postId: schema.postLikes.postId }).from(schema.postLikes).where(eq(schema.postLikes.userId, targetId)).limit(limitNum),
      db.select({ postId: schema.postDislikes.postId }).from(schema.postDislikes).where(eq(schema.postDislikes.userId, targetId)).limit(limitNum),
      db.select({ postId: schema.comments.postId }).from(schema.comments).where(eq(schema.comments.userId, targetId)).limit(limitNum).orderBy(desc(schema.comments.createdAt)),
      db.select({ postId: schema.userSavedPosts.postId }).from(schema.userSavedPosts).where(eq(schema.userSavedPosts.userId, targetId)).limit(limitNum),
      db.select({ toolId: schema.toolStars.toolId }).from(schema.toolStars).where(eq(schema.toolStars.userId, targetId)).limit(limitNum).orderBy(desc(schema.toolStars.createdAt)),
      db.select({ noteId: schema.notesLikes.noteId }).from(schema.notesLikes).where(eq(schema.notesLikes.userId, targetId)).limit(limitNum),
    ]);

    const likedSet = new Set(likedRows.map(r => r.postId));
    const dislikedSet = new Set(dislikedRows.map(r => r.postId));
    const commentedSet = new Set(commentedRows.map(r => r.postId));
    const savedSet = new Set(savedRows.map(r => r.postId));
    const allPostIds = [...new Set([...likedSet, ...dislikedSet, ...commentedSet, ...savedSet])].filter(Boolean);

    const addId = (o) => { if (o && !o._id) o._id = o.id; return o; };

    // Single batch query for all posts instead of 4 separate fetchPosts calls
    let allPostRows = [];
    if (allPostIds.length) {
      allPostRows = await db.select().from(schema.posts)
        .leftJoin(schema.users, eq(schema.posts.author, schema.users.id))
        .where(inArray(schema.posts.id, allPostIds))
        .orderBy(desc(schema.posts.createdAt));
    }

    const formatPostRows = (rows) => rows.map(r => addId({
      ...r.posts,
      // Anonymous posts must never carry the author's real identity to clients.
      author: (r.posts.isAnonymous === 1 || r.posts.isAnonymous === true || r.posts.tag === "CONFESSION" || r.posts.tag === "ANONYMOUS") ? null : (r.users ? { _id: r.users.id, id: r.users.id, name: r.users.name, handle: r.users.handle, avatar: r.users.avatar } : null),
    }));

    // Partition the single result by type
    const likedPosts = formatPostRows(allPostRows.filter(r => likedSet.has(r.posts.id)));
    const dislikedPosts = formatPostRows(allPostRows.filter(r => dislikedSet.has(r.posts.id)));
    const commentedPosts = formatPostRows(allPostRows.filter(r => commentedSet.has(r.posts.id)));
    const savedPosts = formatPostRows(allPostRows.filter(r => savedSet.has(r.posts.id)));

    // Fetch starred tools with star counts
    let starredTools = [];
    if (starredRows.length) {
      const tIds = starredRows.map(i => i.toolId);
      const toolRows = await db.select().from(schema.tools).where(inArray(schema.tools.id, tIds));
      const starCounts = await db.select({ toolId: schema.toolStars.toolId, cnt: sql`count(*)` })
        .from(schema.toolStars).where(inArray(schema.toolStars.toolId, tIds)).groupBy(schema.toolStars.toolId);
      const starMap = {};
      for (const s of starCounts) starMap[s.toolId] = s.cnt;
      starredTools = toolRows.map(t => addId({ ...t, starCount: starMap[t.id] || 0 }));
    }

    // Fetch liked notes with like counts
    let likedNotes = [];
    if (likedNoteRows.length) {
      const nIds = likedNoteRows.map(i => i.noteId);
      const noteRows = await db.select().from(schema.notesLibrary).where(inArray(schema.notesLibrary.id, nIds));
      const likeCounts = await db.select({ noteId: schema.notesLikes.noteId, cnt: sql`count(*)` })
        .from(schema.notesLikes).where(inArray(schema.notesLikes.noteId, nIds)).groupBy(schema.notesLikes.noteId);
      const likeMap = {};
      for (const l of likeCounts) likeMap[l.noteId] = l.cnt;
      likedNotes = noteRows.map(n => addId({ ...n, likeCount: likeMap[n.id] || 0 }));
    }

    const result = { likedPosts, dislikedPosts, comments: commentedPosts, savedPosts, starredTools, likedNotes };
    setCached(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user activity" });
  }
};

exports.getUserContent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const db = getDb();
    let targetId;

    if (userId) {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (!users.length) return res.status(404).json({ message: "User not found" });
      targetId = users[0].id;
    } else {
      targetId = req.user.id;
    }

    const paginatedQuery = (table, field) => {
      let q = db.select().from(table).where(eq(table[field], targetId));
      if (cursor) q = q.where(lt(table.createdAt, cursor));
      return q.orderBy(desc(table.createdAt)).limit(limitNum + 1);
    };

    const toResult = (rows) => {
      const hasMore = rows.length > limitNum;
      const items = hasMore ? rows.slice(0, limitNum) : rows;
      const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : null;
      return { items, hasMore, nextCursor };
    };

    const [posts, notes, notices2, confessions] = await Promise.all([
      paginatedQuery(schema.posts, 'author'),
      paginatedQuery(schema.notesLibrary, 'uploaderId'),
      paginatedQuery(schema.notices, 'publisherId'),
      paginatedQuery(schema.confessions, 'userId'),
    ]);

    res.json({
      posts: toResult(posts), notes: toResult(notes),
      notices: toResult(notices2), confessions: toResult(confessions),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user content" });
  }
};
