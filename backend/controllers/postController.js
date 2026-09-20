const crypto = require('crypto');
const { getDb, schema } = require('../db');
const { eq, and, or, inArray, lt, desc, sql, ne } = require('drizzle-orm');
const { alias } = require('drizzle-orm/sqlite-core');
const { getIO } = require('../socket/socketHandler');
const analytics = require('../utils/analytics');

const now = () => new Date().toISOString();

const addId = (obj) => { if (obj && !obj._id) obj._id = obj.id; return obj; };
const mapIds = (arr) => { arr.forEach(addId); return arr; };

// A post is anonymous when the CONFESSION/ANONYMOUS tag sets is_anonymous
// (also covers legacy rows that only have the tag set).
// Never expose the real author identity for these posts — leak-proofing.
const isAnonymousPost = (r) => r && (
  r.isAnonymous === 1 || r.isAnonymous === true ||
  r.tag === "CONFESSION" || r.tag === "ANONYMOUS"
);

const feedCache = new Map();
const FEED_CACHE_TTL = 30000; // 30 seconds

async function attachComments(db, posts) {
  if (!posts.length) return posts;
  const postIds = posts.map(p => p.id);

  const countRows = await db.select({
    postId: schema.comments.postId,
    count: sql`COUNT(*)`.as('count'),
  }).from(schema.comments)
    .where(and(
      inArray(schema.comments.postId, postIds),
      eq(schema.comments.isDeleted, 0)
    ))
    .groupBy(schema.comments.postId);

  const totalCountByPost = {};
  for (const r of countRows) totalCountByPost[r.postId] = Number(r.count);

  const placeholders = postIds.map(id => sql`${id}`);
  const allComments = await db.all(sql`
    SELECT c.id, c.post_id AS postId, c.user_id AS userId, c.text, c.image,
           c.created_at AS createdAt,
           u.name AS userName, u.handle AS userHandle, u.avatar AS userAvatar
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) AS rn
      FROM comments
      WHERE post_id IN (${sql.join(placeholders, sql`, `)}) AND is_deleted = 0
    ) c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.rn <= 3
  `);

  const keptCommentIds = allComments.map(c => c.id);

  const allReplies = keptCommentIds.length ? await db.select({
    id: schema.replies.id, commentId: schema.replies.commentId, userId: schema.replies.userId,
    text: schema.replies.text, image: schema.replies.image,
    isDeleted: schema.replies.isDeleted, createdAt: schema.replies.createdAt,
    userName: schema.users.name, userHandle: schema.users.handle, userAvatar: schema.users.avatar,
  }).from(schema.replies)
    .leftJoin(schema.users, eq(schema.replies.userId, schema.users.id))
    .where(inArray(schema.replies.commentId, keptCommentIds)) : [];

  const repliesByComment = {};
  for (const r of allReplies) {
    if (!r.isDeleted) {
      if (!repliesByComment[r.commentId]) repliesByComment[r.commentId] = [];
      repliesByComment[r.commentId].push({ _id: r.id, id: r.id, user: { _id: r.userId, id: r.userId, name: r.userName, handle: r.userHandle, avatar: r.userAvatar }, text: r.text, image: r.image, createdAt: r.createdAt, likes: [] });
    }
  }

  const commentsByPost = {};
  for (const c of allComments) {
    if (!commentsByPost[c.postId]) commentsByPost[c.postId] = [];
    commentsByPost[c.postId].push({ _id: c.id, id: c.id, user: { _id: c.userId, id: c.userId, name: c.userName, handle: c.userHandle, avatar: c.userAvatar }, text: c.text, image: c.image, createdAt: c.createdAt, likes: [], replies: repliesByComment[c.id] || [] });
  }

  return posts.map(p => addId({ ...p, comments: commentsByPost[p.id] || [], hasMoreComments: (totalCountByPost[p.id] || 0) > 3 }));
}

async function attachAuthor(db, rows, authorField = 'author') {
  if (!rows.length) return rows;
  const authorIds = [...new Set(rows.map(r => r[authorField]))].filter(Boolean);
  if (!authorIds.length) return rows;
  const authors = await db.select({ id: schema.users.id, name: schema.users.name, handle: schema.users.handle, avatar: schema.users.avatar })
    .from(schema.users).where(inArray(schema.users.id, authorIds));
  const authorMap = {};
  for (const a of authors) authorMap[a.id] = a;
  return rows.map(r => addId({
    ...r,
    // Anonymous posts must never carry the author's real identity to clients.
    author: isAnonymousPost(r) ? null : (authorMap[r[authorField]] || null),
  }));
}

exports.getPosts = async (req, res) => {
  try {
    const { cursor, limit = 20, tag, college } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const db = getDb();
    const conditions = [
      // Moderation: removed/flagged content stays out of public feeds (not UI-only).
      ne(schema.posts.moderationStatus, "REMOVED"),
      ne(schema.posts.moderationStatus, "FLAGGED"),
    ];
    if (tag) conditions.push(eq(schema.posts.tag, tag));
    if (college && college !== "Global") conditions.push(eq(schema.posts.college, college));
    if (cursor) conditions.push(lt(schema.posts.createdAt, cursor));

    let query = db.select().from(schema.posts);
    if (conditions.length) query.where(and(...conditions));
    query.orderBy(desc(schema.posts.createdAt)).limit(limitNum + 1);

    let posts = await query;
    const hasMore = posts.length > limitNum;
    const postsToReturn = hasMore ? posts.slice(0, limitNum) : posts;
    posts = await attachAuthor(db, postsToReturn);
    posts = await attachComments(db, posts);
    const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    res.json({ posts, hasMore, nextCursor });
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

exports.getGlobalFeed = async (req, res) => {
  try {
    const { cursor, limit = 20, tag } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const cacheKey = `${cursor || "first"}:${tag || "ALL"}:${limitNum}`;

    const cached = feedCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < FEED_CACHE_TTL) {
      return res.json({ posts: cached.posts, hasMore: cached.hasMore, nextCursor: cached.nextCursor, cached: true });
    }

    const db = getDb();
    const conditions = [
      // Moderation: removed/flagged content stays out of public feeds.
      ne(schema.posts.moderationStatus, "REMOVED"),
      ne(schema.posts.moderationStatus, "FLAGGED"),
    ];
    if (cursor) conditions.push(lt(schema.posts.createdAt, cursor));
    if (tag && tag !== "ALL") conditions.push(eq(schema.posts.tag, tag));

    let postBase = db.select().from(schema.posts);
    if (conditions.length) postBase = postBase.where(and(...conditions));
    const postSq = postBase.orderBy(desc(schema.posts.createdAt)).limit(limitNum + 1).as('ps');

    const commentUser = alias(schema.users, 'cu');
    const replyUser = alias(schema.users, 'ru');

    const rows = await db.select({
      pid: postSq.id, ptitle: postSq.title, pdesc: postSq.desc, pimage: postSq.image,
      ptag: postSq.tag, pauthor: postSq.author, panonymous: postSq.isAnonymous,
      pcollege: postSq.college, pmoderation: postSq.moderationStatus,
      pscheduled: postSq.scheduledAt, pviews: postSq.views,
      peventDate: postSq.eventDate, plocation: postSq.location,
      pcontactPerson: postSq.contactPerson, pcontactPhone: postSq.contactPhone,
      pcontactEmail: postSq.contactEmail, ptags: postSq.tags,
      pcreatedAt: postSq.createdAt, pupdatedAt: postSq.updatedAt,
      auId: schema.users.id, auName: schema.users.name, auHandle: schema.users.handle, auAvatar: schema.users.avatar,
      coId: schema.comments.id, coPostId: schema.comments.postId, coUserId: schema.comments.userId,
      coText: schema.comments.text, coImage: schema.comments.image,
      coDeleted: schema.comments.isDeleted, coCreatedAt: schema.comments.createdAt,
      cuId: commentUser.id, cuName: commentUser.name, cuHandle: commentUser.handle, cuAvatar: commentUser.avatar,
      reId: schema.replies.id, reCommentId: schema.replies.commentId, reUserId: schema.replies.userId,
      reText: schema.replies.text, reImage: schema.replies.image,
      reDeleted: schema.replies.isDeleted, reCreatedAt: schema.replies.createdAt,
      ruId: replyUser.id, ruName: replyUser.name, ruHandle: replyUser.handle, ruAvatar: replyUser.avatar,
    }).from(postSq)
      .leftJoin(schema.users, eq(postSq.author, schema.users.id))
      .leftJoin(schema.comments, eq(postSq.id, schema.comments.postId))
      .leftJoin(commentUser, eq(schema.comments.userId, commentUser.id))
      .leftJoin(schema.replies, eq(schema.comments.id, schema.replies.commentId))
      .leftJoin(replyUser, eq(schema.replies.userId, replyUser.id))
      .orderBy(desc(postSq.createdAt));

    const postMap = new Map();
    const totalCommentsByPost = {};

    for (const row of rows) {
      if (!postMap.has(row.pid)) {
        postMap.set(row.pid, {
          _id: row.pid, id: row.pid, title: row.ptitle, desc: row.pdesc, image: row.pimage,
          tag: row.ptag,
          // Anonymous posts must never expose the author's real identity.
          author: (row.panonymous || row.ptag === "CONFESSION" || row.ptag === "ANONYMOUS") ? null : (row.auId ? { id: row.auId, name: row.auName, handle: row.auHandle, avatar: row.auAvatar } : null),
          isAnonymous: row.panonymous, college: row.pcollege, moderationStatus: row.pmoderation,
          scheduledAt: row.pscheduled, views: row.pviews, eventDate: row.peventDate, location: row.plocation,
          contactPerson: row.pcontactPerson, contactPhone: row.pcontactPhone, contactEmail: row.pcontactEmail,
          tags: row.ptags, createdAt: row.pcreatedAt, updatedAt: row.pupdatedAt,
          comments: [],
        });
      }
      if (row.coId) {
        totalCommentsByPost[row.pid] = (totalCommentsByPost[row.pid] || 0) + 1;
        const post = postMap.get(row.pid);
        let comment = post.comments.find(c => c.id === row.coId);
        if (!comment && !row.codeleted && post.comments.length < 3) {
          comment = {
            _id: row.coId, id: row.coId, postId: row.coPostId,
            user: row.cuId ? { id: row.cuId, name: row.cuName, handle: row.cuHandle, avatar: row.cuAvatar } : null,
            text: row.coText, image: row.coImage, createdAt: row.coCreatedAt, likes: [], replies: [],
          };
          post.comments.push(comment);
        }
        if (comment && row.reId && !row.reDeleted) {
          if (!comment._replies) comment._replies = [];
          comment._replies.push({
            _id: row.reId, id: row.reId, commentId: row.reCommentId,
            user: row.ruId ? { id: row.ruId, name: row.ruName, handle: row.ruHandle, avatar: row.ruAvatar } : null,
            text: row.reText, image: row.reImage, createdAt: row.reCreatedAt, likes: [],
          });
        }
      }
    }

    for (const p of postMap.values()) {
      for (const c of p.comments) {
        c.replies = c._replies || [];
        delete c._replies;
      }
    }

    let postsList = [...postMap.values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const hasMore = postsList.length > limitNum;
    if (hasMore) postsList = postsList.slice(0, limitNum);

    for (const p of postsList) {
      p.hasMoreComments = (totalCommentsByPost[p.id] || 0) > 3;
    }

    const nextCursor = postsList.length > 0 ? postsList[postsList.length - 1].createdAt : null;

    feedCache.set(cacheKey, { posts: postsList, hasMore, nextCursor, ts: Date.now() });

    res.json({ posts: postsList, hasMore, nextCursor });
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
      ne(schema.posts.moderationStatus, "FLAGGED"),
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
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isAdmin) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      const postsToday = (await db.select({ count: sql`COUNT(*)` }).from(schema.posts)
        .where(and(eq(schema.posts.author, user.id), sql`created_at >= ${startOfDay} AND created_at < ${endOfDay}`)))[0].count;

      if (parseInt(postsToday) >= 1) {
        return res.status(429).json({ message: "Daily posting limit reached. You can post again tomorrow.", limit: 1, postsToday: parseInt(postsToday), nextReset: endOfDay });
      }
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
    post = { ...post, author: isAnonymousPost(post) ? null : authorData, comments: [] };

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
    const user = req.user;

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
    const user = req.user;

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
    const user = req.user;

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
    const user = req.user;

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
    const user = req.user;

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
    const user = req.user;

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
    const user = req.user;

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
    const user = req.user;

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
      .where(and(sql`college IS NOT NULL`, sql`college != 'Global'`))
      .groupBy(schema.posts.college);
    res.json(result.map(r => r.college));
  } catch (err) {
    res.status(500).json({ message: "Error fetching colleges" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const db = getDb();
    const user = req.user;

    const conditions = [eq(schema.posts.author, user.id)];
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
    const user = req.user;
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
    const user = req.user;
    const isAdmin = user.isAdmin;

    if (isAdmin) {
      return res.json({ canPost: true, postsToday: 0, postsRemaining: Infinity, limit: Infinity, isAdmin: true });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const result = await db.select({ count: sql`COUNT(*)` }).from(schema.posts)
      .where(and(eq(schema.posts.author, user.id), sql`created_at >= ${startOfDay} AND created_at < ${endOfDay}`));

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
    const user = req.user;

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
