const { getDb, schema } = require('../db');
const { like, or, eq, sql } = require('drizzle-orm');

exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) return res.status(400).json({ message: "Query must be at least 2 characters" });

    const q = `%${query}%`;
    const db = getDb();

    const [users, posts, notes] = await Promise.all([
      db.select({
        id: schema.users.id, name: schema.users.name, handle: schema.users.handle,
        avatar: schema.users.avatar, bio: schema.users.bio, college: schema.users.college,
      }).from(schema.users)
        .where(or(like(schema.users.name, q), like(schema.users.handle, q), like(schema.users.bio, q)))
        .limit(10),

      db.select({
        id: schema.posts.id, title: schema.posts.title, desc: schema.posts.desc,
        tag: schema.posts.tag, college: schema.posts.college, createdAt: schema.posts.createdAt,
        authorId: schema.posts.author, authorName: schema.users.name,
        authorHandle: schema.users.handle, authorAvatar: schema.users.avatar,
      }).from(schema.posts)
        .leftJoin(schema.users, eq(schema.posts.author, schema.users.id))
        .where(or(like(schema.posts.title, q), like(schema.posts.desc, q), eq(schema.posts.tag, query.toUpperCase())))
        .limit(10),

      db.select({
        id: schema.notesLibrary.id, title: schema.notesLibrary.title,
        description: schema.notesLibrary.description, subject: schema.notesLibrary.subject,
        college: schema.notesLibrary.college,
      }).from(schema.notesLibrary)
        .where(or(like(schema.notesLibrary.title, q), like(schema.notesLibrary.description, q), like(schema.notesLibrary.subject, q)))
        .limit(10),
    ]);

    res.json({
      users: users.map(u => ({ id: u.id, name: u.name, handle: u.handle, avatar: u.avatar, type: "user", college: u.college, bio: u.bio })),
      posts: posts.map(p => ({ id: p.id, title: p.title, desc: p.desc, tag: p.tag, type: "post", author: { _id: p.authorId, name: p.authorName, handle: p.authorHandle, avatar: p.authorAvatar }, college: p.college, createdAt: p.createdAt })),
      notes: notes.map(n => ({ id: n.id, title: n.title, description: n.description, subject: n.subject, type: "note", college: n.college })),
    });
  } catch (err) {
    res.status(500).json({ message: "Error performing search", error: err.message });
  }
};

exports.searchByCategory = async (req, res) => {
  try {
    const { query, category } = req.query;
    if (!query || query.trim().length < 2) return res.status(400).json({ message: "Query must be at least 2 characters" });

    const q = `%${query}%`;
    const db = getDb();
    let results = [];

    switch (category) {
      case "users":
        results = await db.select().from(schema.users)
          .where(or(like(schema.users.name, q), like(schema.users.handle, q), like(schema.users.bio, q)))
          .limit(20);
        break;
      case "posts":
        results = await db.select({
          post: schema.posts, authorName: schema.users.name,
          authorHandle: schema.users.handle, authorAvatar: schema.users.avatar,
        }).from(schema.posts)
          .leftJoin(schema.users, eq(schema.posts.author, schema.users.id))
          .where(or(like(schema.posts.title, q), like(schema.posts.desc, q)))
          .limit(20);
        break;
      case "notes":
        results = await db.select().from(schema.notesLibrary)
          .where(or(like(schema.notesLibrary.title, q), like(schema.notesLibrary.description, q), like(schema.notesLibrary.subject, q)))
          .limit(20);
        break;
      default:
        return res.status(400).json({ message: "Invalid category" });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error performing search", error: err.message });
  }
};
