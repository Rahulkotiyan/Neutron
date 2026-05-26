const admin = require("../config/firebase");
const jwt = require("jsonwebtoken");
const { getDb, schema } = require("../db");
const { eq } = require("drizzle-orm");

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required for security");

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    let userId;
    try {
      const decodedToken = jwt.verify(token, JWT_SECRET);
      userId = decodedToken._id || decodedToken.sub;
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') return res.status(401).json({ error: "Token expired", message: "Your session has expired. Please log in again.", code: "TOKEN_EXPIRED" });
    }

    if (!userId) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token, true);
        userId = decodedToken.uid;
      } catch (firebaseErr) {
        throw new Error("Invalid token - neither server JWT nor valid Firebase ID token");
      }
    }

    try {
      const db = getDb();
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
      const user = users[0];
      if (!user) return res.status(401).json({ error: "User not found" });

      req.user = {
        _id: user.id, id: user.id, name: user.name, email: user.email,
        isAdmin: user.isAdmin === 1, isPremium: false,
        isActive: user.isActive !== 0,
      };
      return next();
    } catch (dbErr) {
      return res.status(500).json({ error: "Database error" });
    }
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = verifyToken;
