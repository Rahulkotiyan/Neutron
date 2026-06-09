const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, or, inArray, lt, desc, sql, ne } = require('drizzle-orm');
const { getIO } = require('../socket/socketHandler');
const analytics = require('../utils/analytics');

const now = () => new Date().toISOString();

const addId = (obj) => { if (obj && !obj._id) obj._id = obj.id; return obj; };
const mapIds = (arr) => { arr.forEach(addId); return arr; };

async function attachComments(db, posts) {
  if (!posts.length) return posts;
  const postIds = posts.map(p => p.id);
  const allComments = await db.select({
    id: schema.comments.id, postId: schema.comments.postId, userId: schema.comments.userId,
    text: schema.comments.text, image: schema.comments.image,
    isDeleted: schema.comments.isDeleted, createdAt: schema.comments.createdAt,
    userName: schema.users.name, userHandle: schema.users.handle, userAvatar: schema.users.avatar,
  }).from(schema.comments)
    .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
    .where(inArray(schema.comments.postId, postIds));

  const commentIds = allComments.map(c => c.id);
  const allReplies = commentIds.length ? await db.select({
    id: schema.replies.id, commentId: schema.replies.commentId, userId: schema.replies.userId,
    text: schema.replies.text, image: schema.replies.image,
    isDeleted: schema.replies.isDeleted, createdAt: schema.replies.createdAt,
    userName: schema.users.name, userHandle: schema.users.handle, userAvatar: schema.users.avatar,
  }).from(schema.replies)
    .leftJoin(schema.users, eq(schema.replies.userId, schema.users.id))
    .where(inArray(schema.replies.commentId, commentIds)) : [];

  const repliesByComment = {};
  for (const r of allReplies) {
    if (!r.isDeleted) {
      if (!repliesByComment[r.commentId]) repliesByComment[r.commentId] = [];
      repliesByComment[r.commentId].push({ _id: r.id, id: r.id, user: { _id: r.userId, id: r.userId, name: r.userName, handle: r.userHandle, avatar: r.userAvatar }, text: r.text, image: r.image, createdAt: r.createdAt, likes: [] });
    }
  }

  const commentsByPost = {};
  for (const c of allComments) {
    if (!c.isDeleted) {
      if (!commentsByPost[c.postId]) commentsByPost[c.postId] = [];
      commentsByPost[c.postId].push({ _id: c.id, id: c.id, user: { _id: c.userId, id: c.userId, name: c.userName, handle: c.userHandle, avatar: c.userAvatar }, text: c.text, image: c.image, createdAt: c.createdAt, likes: [], replies: repliesByComment[c.id] || [] });
    }
  }

  return posts.map(p => addId({ ...p, comments: commentsByPost[p.id] || [] }));
}

async function attachAuthor(db, rows, authorField = 'author') {
  if (!rows.length) return rows;
  const authorIds = [...new Set(rows.map(r => r[authorField]))].filter(Boolean);
  if (!authorIds.length) return rows;
  const authors = await db.select({ id: schema.users.id, name: schema.users.name, handle: schema.users.handle, avatar: schema.users.avatar })
    .from(schema.users).where(inArray(schema.users.id, authorIds));
  const authorMap = {};
  for (const a of authors) authorMap[a.id] = a;
  return rows.map(r => addId({ ...r, author: authorMap[r[authorField]] || null }));
}

exports.getPosts = async (req, res) => {
  try {
    const { tag, college } = req.query;
    const db = getDb();
    const conditions = [];
    if (tag) conditions.push(eq(schema.posts.tag, tag));
    if (college && college !== "Global") conditions.push(eq(schema.posts.college, college));

    const query = db.select().from(schema.posts);
    if (conditions.length) query.where(and(...conditions));
    query.orderBy(desc(schema.posts.createdAt));

    let posts = await query;
    posts = await attachAuthor(db, posts);
    posts = await attachComments(db, posts);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

exports.getGlobalFeed = async (req, res) => {
  try {
    const { cursor, limit = 20, tag } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const db = getDb();

    const conditions = [];
    if (cursor) conditions.push(lt(schema.posts.createdAt, cursor));
    if (tag && tag !== "ALL") conditions.push(eq(schema.posts.tag, tag));

    let query = db.select().from(schema.posts);
    if (conditions.length) query.where(and(...conditions));
    query.orderBy(desc(schema.posts.createdAt)).limit(limitNum + 1);

    let posts = await query;
    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    let result = await attachAuthor(db, postsToReturn);
    result = await attachComments(db, result);
    const nextCursor = result.length > 0 ? result[result.length - 1].createdAt : null;

    res.json({ posts: result, hasMore, nextCursor });
  } catch (err) {
    console.error("Error fetching global feed:", err);
    res.status(500).json({ message: "Error fetching global feed", error: err.message });
  }
};

exports.getCollegeFeed = async (req, res) => {
  try {
    const { college } = req.params;
    const { cursor, limit = 20, tag } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    if (!college) return res.status(400).json({ message: "College parameter required" });

    const db = getDb();
    const conditions = [
      inArray(schema.posts.college, [college, "Global"]),
      ne(schema.posts.moderationStatus, "REMOVED"),
    ];
    if (cursor) conditions.push(lt(schema.posts.createdAt, cursor));
    if (tag && tag !== "ALL") conditions.push(eq(schema.posts.tag, tag));

    let posts = await db.select().from(schema.posts)
      .where(and(...conditions))
      .orderBy(desc(schema.posts.createdAt))
      .limit(limitNum + 1);

    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    let result = await attachAuthor(db, postsToReturn);
    result = await attachComments(db, result);
    const nextCursor = result.length > 0 ? result[result.length - 1].createdAt : null;

    res.json({ posts: result, hasMore, nextCursor });
  } catch (err) {
    res.status(500).json({ message: "Error fetching college feed" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, desc, tag, college, scheduledAt, eventDate, location, contactPerson, contactPhone, contactEmail, tags } = req.body;
    if (!req.user || !req.user.email) return res.status(401).json({ message: "Unauthorized" });

    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    const postsToday = (await db.select({ count: sql`COUNT(*)` }).from(schema.posts)
      .where(and(eq(schema.posts.author, user.id), sql`created_at >= ${startOfDay} AND created_at < ${endOfDay}`)))[0].count;

    if (parseInt(postsToday) >= 1) {
      return res.status(429).json({ message: "Daily posting limit reached. You can post again tomorrow.", limit: 1, postsToday: parseInt(postsToday), nextReset: endOfDay });
    }

    let imageUrl = null;
    if (req.file) imageUrl = req.file.path;

    const id = crypto.randomUUID();
    const ts = now();
    await db.insert(schema.posts).values({
      id, title: title || null, desc: desc || null, image: imageUrl, tag: tag || "GENERAL",
      author: user.id, college: college || "Global", createdAt: ts, updatedAt: ts,
      scheduledAt: scheduledAt || null, isAnonymous: tag === "CONFESSION" || tag === "ANONYMOUS" ? 1 : 0,
      eventDate: eventDate || null, location: location || null, contactPerson: contactPerson || null,
      contactPhone: contactPhone || null, contactEmail: contactEmail || null, tags: tags || null,
    });

    let post = (await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1))[0];
    const authorData = (await db.select({ name: schema.users.name, handle: schema.users.handle, avatar: schema.users.avatar }).from(schema.users).where(eq(schema.users.id, user.id)).limit(1))[0];
    post = { ...post, author: authorData, comments: [] };

    analytics.capture("post_created", user.id, { postId: post.id, tag: post.tag, college: post.college });

    res.status(201).json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    const posts = await db.select({ id: schema.posts.id, author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    const post = posts[0];
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existing = await db.select().from(schema.postLikes).where(and(eq(schema.postLikes.postId, id), eq(schema.postLikes.userId, user.id))).limit(1);

    if (existing.length) {
      await db.delete(schema.postLikes).where(and(eq(schema.postLikes.postId, id), eq(schema.postLikes.userId, user.id)));
    } else {
      await db.insert(schema.postLikes).values({ postId: id, userId: user.id });
      if (post.author !== user.id) {
        await db.insert(schema.notifications).values({
          id: crypto.randomUUID(), recipient: post.author, sender: user.id,
          type: "LIKE", title: "New Like", message: `${user.name} liked your post`,
          relatedEntityType: "POST", relatedEntityId: id, createdAt: now(),
        });
      }
    }

    const likes = await db.select().from(schema.postLikes).where(eq(schema.postLikes.postId, id));
    res.json({ likes: likes.map(l => l.userId), likesCount: likes.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.dislikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    const posts = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    const post = posts[0];
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existing = await db.select().from(schema.postDislikes).where(and(eq(schema.postDislikes.postId, id), eq(schema.postDislikes.userId, user.id))).limit(1);

    if (existing.length) {
      await db.delete(schema.postDislikes).where(and(eq(schema.postDislikes.postId, id), eq(schema.postDislikes.userId, user.id)));
    } else {
      await db.delete(schema.postLikes).where(and(eq(schema.postLikes.postId, id), eq(schema.postLikes.userId, user.id)));
      await db.insert(schema.postDislikes).values({ postId: id, userId: user.id });
    }

    const [likes, dislikes] = await Promise.all([
      db.select().from(schema.postLikes).where(eq(schema.postLikes.postId, id)),
      db.select().from(schema.postDislikes).where(eq(schema.postDislikes.postId, id)),
    ]);

    res.json({ dislikes: dislikes.map(d => d.userId), dislikesCount: dislikes.length, likes: likes.map(l => l.userId) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    if (!text || text.trim().length === 0) return res.status(400).json({ message: "Comment text is required" });
    if (text.length > 280) return res.status(400).json({ message: "Comment cannot exceed 280 characters" });

    const posts = await db.select({ id: schema.posts.id, author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    const post = posts[0];
    if (!post) return res.status(404).json({ message: "Post not found" });

    let imageUrl = null;
    if (req.file) imageUrl = req.file.path;

    const commentId = crypto.randomUUID();
    const ts = now();
    await db.insert(schema.comments).values({ id: commentId, postId: id, userId: user.id, text: text.trim(), image: imageUrl, createdAt: ts });

    if (post.author !== user.id) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(), recipient: post.author, sender: user.id,
        type: "COMMENT", title: "New Comment",
        message: `${user.name} commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        relatedEntityType: "POST", relatedEntityId: id, createdAt: now(),
      });
    }

    const comment = (await db.select({
      id: schema.comments.id, text: schema.comments.text, image: schema.comments.image,
      createdAt: schema.comments.createdAt, userId: schema.comments.userId,
      userName: schema.users.name, userHandle: schema.users.handle, userAvatar: schema.users.avatar,
    }).from(schema.comments).leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
      .where(eq(schema.comments.id, commentId)).limit(1))[0];

    const result = { _id: comment.id, user: { _id: comment.userId, name: comment.userName, handle: comment.userHandle, avatar: comment.userAvatar }, text: comment.text, image: comment.image, createdAt: comment.createdAt, likes: [], replies: [] };

    try { const io = getIO(); io.to(`post_${id}`).emit("new_comment", { postId: id, comment: result }); } catch (e) {}

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    if (!text || text.trim().length === 0) return res.status(400).json({ message: "Reply text is required" });
    if (text.length > 280) return res.status(400).json({ message: "Reply cannot exceed 280 characters" });

    const comments = await db.select({ id: schema.comments.id, userId: schema.comments.userId }).from(schema.comments)
      .where(and(eq(schema.comments.id, commentId), eq(schema.comments.postId, id))).limit(1);
    const parentComment = comments[0];
    if (!parentComment) return res.status(404).json({ message: "Parent comment not found" });

    let imageUrl = null;
    if (req.file) imageUrl = req.file.path;

    const replyId = crypto.randomUUID();
    const ts = now();
    await db.insert(schema.replies).values({ id: replyId, commentId, userId: user.id, text: text.trim(), image: imageUrl, createdAt: ts });

    if (parentComment.userId !== user.id) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(), recipient: parentComment.userId, sender: user.id,
        type: "REPLY", title: "New Reply",
        message: `${user.name} replied to your comment: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        relatedEntityType: "COMMENT", relatedEntityId: commentId, createdAt: now(),
      });
    }

    const reply = (await db.select({
      id: schema.replies.id, text: schema.replies.text, image: schema.replies.image,
      createdAt: schema.replies.createdAt, userId: schema.replies.userId,
      userName: schema.users.name, userHandle: schema.users.handle, userAvatar: schema.users.avatar,
    }).from(schema.replies).leftJoin(schema.users, eq(schema.replies.userId, schema.users.id))
      .where(eq(schema.replies.id, replyId)).limit(1))[0];

    const result = { _id: reply.id, user: { _id: reply.userId, name: reply.userName, handle: reply.userHandle, avatar: reply.userAvatar }, text: reply.text, image: reply.image, createdAt: reply.createdAt, likes: [] };

    try { const io = getIO(); io.to(`post_${id}`).emit("new_reply", { postId: id, commentId, reply: result }); } catch (e) {}

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    const existing = await db.select().from(schema.commentLikes).where(and(eq(schema.commentLikes.commentId, commentId), eq(schema.commentLikes.userId, user.id))).limit(1);
    if (existing.length) {
      await db.delete(schema.commentLikes).where(and(eq(schema.commentLikes.commentId, commentId), eq(schema.commentLikes.userId, user.id)));
    } else {
      await db.insert(schema.commentLikes).values({ commentId, userId: user.id });
    }

    const likes = await db.select().from(schema.commentLikes).where(eq(schema.commentLikes.commentId, commentId));
    res.json({ likes: likes.map(l => l.userId), likesCount: likes.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.likeReply = async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    const existing = await db.select().from(schema.replyLikes).where(and(eq(schema.replyLikes.replyId, replyId), eq(schema.replyLikes.userId, user.id))).limit(1);
    if (existing.length) {
      await db.delete(schema.replyLikes).where(and(eq(schema.replyLikes.replyId, replyId), eq(schema.replyLikes.userId, user.id)));
    } else {
      await db.insert(schema.replyLikes).values({ replyId, userId: user.id });
    }

    const likes = await db.select().from(schema.replyLikes).where(eq(schema.replyLikes.replyId, replyId));
    res.json({ likes: likes.map(l => l.userId), likesCount: likes.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    const comments = await db.select().from(schema.comments).where(and(eq(schema.comments.id, commentId), eq(schema.comments.postId, id))).limit(1);
    const comment = comments[0];
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId !== user.id) return res.status(403).json({ message: "You can only delete your own comments" });

    await db.delete(schema.replies).where(eq(schema.replies.commentId, commentId));
    await db.delete(schema.commentLikes).where(eq(schema.commentLikes.commentId, commentId));
    await db.delete(schema.comments).where(eq(schema.comments.id, commentId));
    res.json({ message: "Comment deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteReply = async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    const replies = await db.select().from(schema.replies).where(and(eq(schema.replies.id, replyId), eq(schema.replies.commentId, commentId))).limit(1);
    const reply = replies[0];
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    if (reply.userId !== user.id) return res.status(403).json({ message: "You can only delete your own replies" });

    await db.delete(schema.replyLikes).where(eq(schema.replyLikes.replyId, replyId));
    await db.delete(schema.replies).where(eq(schema.replies.id, replyId));
    res.json({ message: "Reply deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.reportComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Report reason is required" });

    const { sendReportToDiscord } = require('../utils/discordWebhook');
    await sendReportToDiscord({
      targetType: 'comment',
      targetId: commentId,
      reason,
      reporter: req.user.name || req.user.email,
    });

    res.json({ message: "Comment reported successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const comments = await db.select({
      id: schema.comments.id, text: schema.comments.text, image: schema.comments.image,
      createdAt: schema.comments.createdAt, isDeleted: schema.comments.isDeleted,
      userId: schema.comments.userId,
      userName: schema.users.name, userHandle: schema.users.handle, userAvatar: schema.users.avatar,
    }).from(schema.comments)
      .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
      .where(and(eq(schema.comments.postId, id), eq(schema.comments.isDeleted, 0)))
      .orderBy(desc(schema.comments.createdAt));

    const commentIds = comments.map(c => c.id);
    const allReplies = commentIds.length ? await db.select({
      id: schema.replies.id, commentId: schema.replies.commentId, text: schema.replies.text,
      image: schema.replies.image, createdAt: schema.replies.createdAt,
      userId: schema.replies.userId,
      userName: schema.users.name, userHandle: schema.users.handle, userAvatar: schema.users.avatar,
    }).from(schema.replies)
      .leftJoin(schema.users, eq(schema.replies.userId, schema.users.id))
      .where(inArray(schema.replies.commentId, commentIds))
      .orderBy(desc(schema.replies.createdAt)) : [];

    const repliesByComment = {};
    for (const r of allReplies) {
      if (!repliesByComment[r.commentId]) repliesByComment[r.commentId] = [];
      repliesByComment[r.commentId].push({ _id: r.id, user: { _id: r.userId, name: r.userName, handle: r.userHandle, avatar: r.userAvatar }, text: r.text, image: r.image, createdAt: r.createdAt, likes: [] });
    }

    const result = comments.map(c => ({
      _id: c.id, user: { _id: c.userId, name: c.userName, handle: c.userHandle, avatar: c.userAvatar },
      text: c.text, image: c.image, createdAt: c.createdAt, likes: [], replies: repliesByComment[c.id] || [],
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getColleges = async (req, res) => {
  try {
    const db = getDb();
    const result = await db.select({ college: schema.posts.college }).from(schema.posts)
      .where(and(sql`college IS NOT NULL`, sql`college != 'Global'`));
    const colleges = [...new Set(result.map(r => r.college))];
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ message: "Error fetching colleges" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    if (!users.length) return res.status(404).json({ message: "User not found" });

    const conditions = [eq(schema.posts.author, users[0].id)];
    if (cursor) conditions.push(lt(schema.posts.createdAt, cursor));

    let posts = await db.select().from(schema.posts)
      .where(and(...conditions))
      .orderBy(desc(schema.posts.createdAt))
      .limit(limitNum + 1);
    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    let result = await attachAuthor(db, postsToReturn);
    result = await attachComments(db, result);
    const nextCursor = result.length > 0 ? result[result.length - 1].createdAt : null;
    res.json({ posts: result, hasMore, nextCursor });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user posts" });
  }
};

exports.getUserPostsById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const db = getDb();

    const conditions = [eq(schema.posts.author, userId)];
    if (cursor) conditions.push(lt(schema.posts.createdAt, cursor));

    let posts = await db.select().from(schema.posts)
      .where(and(...conditions))
      .orderBy(desc(schema.posts.createdAt))
      .limit(limitNum + 1);
    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    let result = await attachAuthor(db, postsToReturn);
    result = await attachComments(db, result);
    const nextCursor = result.length > 0 ? result[result.length - 1].createdAt : null;
    res.json({ posts: result, hasMore, nextCursor });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user posts" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    const post = posts[0];
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author !== user.id) return res.status(403).json({ message: "You can only delete your own posts" });

    const comments = await db.select({ id: schema.comments.id }).from(schema.comments).where(eq(schema.comments.postId, id));
    const commentIds = comments.map(c => c.id);
    if (commentIds.length) {
      await db.delete(schema.replyLikes).where(inArray(schema.replyLikes.replyId, (await db.select({ id: schema.replies.id }).from(schema.replies).where(inArray(schema.replies.commentId, commentIds))).map(r => r.id)));
      await db.delete(schema.replies).where(inArray(schema.replies.commentId, commentIds));
      await db.delete(schema.commentLikes).where(inArray(schema.commentLikes.commentId, commentIds));
      await db.delete(schema.comments).where(inArray(schema.comments.id, commentIds));
    }
    await db.delete(schema.postLikes).where(eq(schema.postLikes.postId, id));
    await db.delete(schema.postDislikes).where(eq(schema.postDislikes.postId, id));
    await db.delete(schema.postReposts).where(eq(schema.postReposts.postId, id));
    await db.delete(schema.userSavedPosts).where(eq(schema.userSavedPosts.postId, id));
    await db.delete(schema.posts).where(eq(schema.posts.id, id));
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting post" });
  }
};

exports.checkDailyPostingLimit = async (req, res) => {
  try {
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    if (!users.length) return res.status(404).json({ message: "User not found" });

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const result = await db.select({ count: sql`COUNT(*)` }).from(schema.posts)
      .where(and(eq(schema.posts.author, users[0].id), sql`created_at >= ${startOfDay} AND created_at < ${endOfDay}`));

    const postsToday = parseInt(result[0]?.count || 0);
    const limit = 1;
    res.json({ canPost: postsToday < limit, postsToday, postsRemaining: Math.max(0, limit - postsToday), limit, nextReset: endOfDay });
  } catch (err) {
    res.status(500).json({ message: "Error checking posting limit" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    let posts = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    const post = posts[0];
    if (!post) return res.status(404).json({ message: "Post not found" });

    let result = await attachAuthor(db, [post]);
    result = await attachComments(db, result);
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching post" });
  }
};

exports.savePost = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, req.user.email)).limit(1);
    const user = users[0];

    const existing = await db.select().from(schema.userSavedPosts).where(and(eq(schema.userSavedPosts.userId, user.id), eq(schema.userSavedPosts.postId, id))).limit(1);
    if (existing.length) {
      await db.delete(schema.userSavedPosts).where(and(eq(schema.userSavedPosts.userId, user.id), eq(schema.userSavedPosts.postId, id)));
    } else {
      await db.insert(schema.userSavedPosts).values({ userId: user.id, postId: id });
    }

    let result = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    result = await attachAuthor(db, result);
    result = await attachComments(db, result);
    res.json(result[0] || {});
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.update(schema.posts).set({ views: sql`views + 1` }).where(eq(schema.posts.id, id));
    const posts = await db.select({ views: schema.posts.views }).from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    const newViews = posts[0]?.views || 1;

    try { const io = getIO(); if (io) io.to(`post_${id}`).emit("view_update", { postId: id, views: newViews }); } catch (e) {}

    res.json({ views: newViews });
  } catch (err) {
    res.status(500).json({ message: "Error incrementing views", error: err.message });
  }
};
