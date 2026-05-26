const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const admin = require("../config/firebase");
const { getDb, schema } = require("../db");
const { eq } = require("drizzle-orm");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign({ _id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
};

const formatUser = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  handle: user.handle,
  avatar: user.avatar,
  college: user.college,
  hasProfile: user.hasProfile === 1,
  isAdmin: user.isAdmin === 1,
});

const now = () => new Date().toISOString();

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Invalid email format" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });

    const db = getDb();
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length) return res.status(400).json({ success: false, message: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let handle;
    do {
      handle = "@" + name.split(" ")[0].toLowerCase() + "_" + Math.floor(Math.random() * 1000);
    } while ((await db.select().from(schema.users).where(eq(schema.users.handle, handle)).limit(1)).length);

    const id = crypto.randomUUID();
    const ts = now();
    await db.insert(schema.users).values({ id, name, email, password: hashedPassword, handle, createdAt: ts, updatedAt: ts });

    const newUser = (await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1))[0];
    const token = generateToken(newUser);

    res.status(201).json({ success: true, token, ...formatUser(newUser) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });

    const db = getDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const user = users[0];
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ success: true, token, ...formatUser(user) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token, mode } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token required" });
    if (!mode || !["login", "signup"].includes(mode)) return res.status(400).json({ success: false, message: "Invalid or missing mode parameter" });

    let payload;
    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      payload = { email: decodedToken.email, name: decodedToken.name || decodedToken.email.split("@")[0], picture: decodedToken.picture || "", sub: decodedToken.uid };
    } catch (firebaseErr) {
      try {
        const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
        payload = ticket.getPayload();
      } catch (googleErr) {
        return res.status(401).json({ success: false, message: "Invalid token", error: googleErr.message });
      }
    }

    const { email, name, picture, sub } = payload;
    if (!email) return res.status(400).json({ success: false, message: "Email not found in token" });

    const db = getDb();
    const ts = now();

    if (mode === "login") {
      const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      let user = users[0];
      if (!user) return res.status(404).json({ success: false, message: "Account not found. Please sign up first" });

      if (!user.hasProfile && user.name && user.college) {
        await db.update(schema.users).set({ hasProfile: 1 }).where(eq(schema.users.id, user.id));
        user.hasProfile = 1;
      }

      const jwtToken = generateToken(user);
      return res.json({ success: true, token: jwtToken, ...formatUser(user), avatar: user.avatar || picture });
    } else {
      const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (existingUser.length) return res.status(400).json({ success: false, message: "Account already exists. Please login." });

      const userName = name || email.split("@")[0];
      let handle;
      do {
        handle = "@" + userName.split(" ")[0].toLowerCase() + "_" + Math.floor(Math.random() * 1000);
      } while ((await db.select().from(schema.users).where(eq(schema.users.handle, handle)).limit(1)).length);

      const id = crypto.randomUUID();
      await db.insert(schema.users).values({ id, name: userName, email, avatar: picture || "", googleId: sub, handle, createdAt: ts, updatedAt: ts });

      const newUser = (await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1))[0];
      const jwtToken = generateToken(newUser);
      return res.status(201).json({ success: true, token: jwtToken, ...formatUser(newUser) });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: "Authentication failed: " + e.message });
  }
};

exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.length < 3) return res.json({ success: false, available: false, message: "Username must be at least 3 characters" });
    const db = getDb();
    const existing = await db.select().from(schema.users).where(eq(schema.users.username, username.toLowerCase())).limit(1);
    res.json({ success: true, available: !existing.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error checking username availability" });
  }
};
