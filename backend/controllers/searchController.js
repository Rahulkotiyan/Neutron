const { getDb, schema } = require('../db');
const { like, or, eq } = require('drizzle-orm');

exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) return res.status(400).json({ message: "Query must be at least 2 characters" });

    const q = `%${query}%`;
    const db = getDb();

    const users = await db.select({
      id: schema.users.id, name: schema.users.name, handle: schema.users.handle,
      avatar: schema.users.avatar, bio: schema.users.bio, college: schema.users.college,
    }).from(schema.users)
      .where(or(like(schema.users.name, q), like(schema.users.handle, q), like(schema.users.bio, q)))
      .limit(10);

    res.json({
      users: users.map(u => ({ id: u.id, name: u.name, handle: u.handle, avatar: u.avatar, type: "user", college: u.college, bio: u.bio })),
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

    if (category !== "users") return res.status(400).json({ message: "Only user search is supported" });

    results = await db.select().from(schema.users)
      .where(or(like(schema.users.name, q), like(schema.users.handle, q), like(schema.users.bio, q)))
      .limit(20);

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Error performing search", error: err.message });
  }
};
