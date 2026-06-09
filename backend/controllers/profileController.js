const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, inArray, desc, sql } = require('drizzle-orm');

const now = () => new Date().toISOString();

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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) {
      const existing = await db.select().from(schema.users).where(eq(schema.users.username, username.toLowerCase())).limit(1);
      if (existing.length && existing[0].id !== user.id) return res.status(400).json({ message: "Username is already taken" });
    }

    const updates = {};
    if (req.files) {
      if (req.files.avatar) updates.avatar = req.files.avatar[0].secure_url || req.files.avatar[0].url;
      if (req.files.banner) updates.banner = req.files.banner[0].secure_url || req.files.banner[0].url;
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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username !== user.username) {
      const existing = await db.select().from(schema.users).where(eq(schema.users.username, username.toLowerCase())).limit(1);
      if (existing.length && existing[0].id !== user.id) return res.status(400).json({ message: "Username is already taken" });
    }

    const updates = {};
    if (req.files) {
      if (req.files.avatar) updates.avatar = req.files.avatar[0].secure_url || req.files.avatar[0].url;
      if (req.files.banner) updates.banner = req.files.banner[0].secure_url || req.files.banner[0].url;
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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const currentUser = users[0];
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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const currentUser = users[0];
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
    const [users, currentUsers] = await Promise.all([
      db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1),
      db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1),
    ]);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentUser = currentUsers[0];
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
    const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    const user = users[0];
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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const currentUser = users[0];
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
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const currentUser = users[0];
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
      const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
      if (!users.length) return res.status(404).json({ message: "User not found" });
      targetId = users[0].id;
    }

    const likedPostIds = await db.select({ postId: schema.postLikes.postId }).from(schema.postLikes).where(eq(schema.postLikes.userId, targetId)).limit(limitNum);
    const dislikedPostIds = await db.select({ postId: schema.postDislikes.postId }).from(schema.postDislikes).where(eq(schema.postDislikes.userId, targetId)).limit(limitNum);
    const commentedPostIds = await db.select({ postId: schema.comments.postId }).from(schema.comments).where(eq(schema.comments.userId, targetId)).limit(limitNum).orderBy(desc(schema.comments.createdAt));
    const savedPostIds = await db.select({ postId: schema.userSavedPosts.postId }).from(schema.userSavedPosts).where(eq(schema.userSavedPosts.userId, targetId)).limit(limitNum);
    const starredToolIds = await db.select({ toolId: schema.toolStars.toolId }).from(schema.toolStars).where(eq(schema.toolStars.userId, targetId)).limit(limitNum).orderBy(desc(schema.toolStars.createdAt));
    const likedNoteIds = await db.select({ noteId: schema.notesLikes.noteId }).from(schema.notesLikes).where(eq(schema.notesLikes.userId, targetId)).limit(limitNum);

    const fetchPosts = async (ids) => {
      if (!ids.length) return [];
      const pIds = ids.map(i => i.postId);
      return db.select().from(schema.posts).leftJoin(schema.users, eq(schema.posts.author, schema.users.id))
        .where(inArray(schema.posts.id, pIds)).orderBy(desc(schema.posts.createdAt));
    };

    const [likedPosts, dislikedPosts, commentedPosts, savedPosts] = await Promise.all([
      fetchPosts(likedPostIds), fetchPosts(dislikedPostIds),
      fetchPosts(commentedPostIds), fetchPosts(savedPostIds),
    ]);

    const addId = (o) => { if (o && !o._id) o._id = o.id; return o; };

    // Fetch starred tools with star counts
    let starredTools = [];
    if (starredToolIds.length) {
      const tIds = starredToolIds.map(i => i.toolId);
      const toolRows = await db.select().from(schema.tools).where(inArray(schema.tools.id, tIds));
      const starCounts = await db.select({ toolId: schema.toolStars.toolId, cnt: sql`count(*)` })
        .from(schema.toolStars).where(inArray(schema.toolStars.toolId, tIds)).groupBy(schema.toolStars.toolId);
      const starMap = {};
      for (const s of starCounts) starMap[s.toolId] = s.cnt;
      starredTools = toolRows.map(t => addId({ ...t, starCount: starMap[t.id] || 0 }));
    }

    // Fetch liked notes with like counts
    let likedNotes = [];
    if (likedNoteIds.length) {
      const nIds = likedNoteIds.map(i => i.noteId);
      const noteRows = await db.select().from(schema.notesLibrary).where(inArray(schema.notesLibrary.id, nIds));
      const likeCounts = await db.select({ noteId: schema.notesLikes.noteId, cnt: sql`count(*)` })
        .from(schema.notesLikes).where(inArray(schema.notesLikes.noteId, nIds)).groupBy(schema.notesLikes.noteId);
      const likeMap = {};
      for (const l of likeCounts) likeMap[l.noteId] = l.cnt;
      likedNotes = noteRows.map(n => addId({ ...n, likeCount: likeMap[n.id] || 0 }));
    }

    const formatPostRows = (rows) => rows.map(r => addId({ ...r.posts, author: r.users ? { _id: r.users.id, id: r.users.id, name: r.users.name, handle: r.users.handle, avatar: r.users.avatar } : null }));

    res.json({
      likedPosts: formatPostRows(likedPosts), dislikedPosts: formatPostRows(dislikedPosts),
      comments: formatPostRows(commentedPosts), savedPosts: formatPostRows(savedPosts),
      starredTools, likedNotes,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user activity" });
  }
};

exports.getUserContent = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    let targetId;

    if (userId) {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      if (!users.length) return res.status(404).json({ message: "User not found" });
      targetId = users[0].id;
    } else {
      const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
      if (!users.length) return res.status(404).json({ message: "User not found" });
      targetId = users[0].id;
    }

    const [posts, notes, notices2, confessions] = await Promise.all([
      db.select().from(schema.posts).where(eq(schema.posts.author, targetId)).orderBy(desc(schema.posts.createdAt)),
      db.select().from(schema.notesLibrary).where(eq(schema.notesLibrary.uploaderId, targetId)).orderBy(desc(schema.notesLibrary.createdAt)),
      db.select().from(schema.notices).where(eq(schema.notices.publisherId, targetId)).orderBy(desc(schema.notices.createdAt)),
      db.select().from(schema.confessions).where(eq(schema.confessions.userId, targetId)).orderBy(desc(schema.confessions.createdAt)),
    ]);

    res.json({ posts, notes, notices: notices2, confessions });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user content" });
  }
};
