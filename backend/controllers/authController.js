const bcrypt = require("bcryptjs");
const { User } = require("../models/Schema");
const { OAuth2Client } = require("google-auth-library");
const admin = require("../config/firebase");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const handle =
      "@" +
      name.split(" ")[0].toLowerCase() +
      "_" +
      Math.floor(Math.random() * 1000);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      handle,
    });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      handle: newUser.handle,
      avatar: newUser.avatar,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token, mode } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    let payload;

    // 1. Try Firebase Verification
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      payload = {
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split("@")[0],
        picture: decodedToken.picture || "",
        sub: decodedToken.uid,
      };
      console.log("✅ Firebase token verified");
    } catch (firebaseErr) {
      console.log("Firebase verification failed, trying Google OAuth...");

      // 2. Fallback to Google OAuth Verification
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
        console.log("✅ Google OAuth token verified");
      } catch (googleErr) {
        console.error("Google OAuth verification failed:", googleErr.message);
        return res.status(401).json({
          message: "Invalid Google token",
          error: googleErr.message,
        });
      }
    }

    const { email, name, picture, sub } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email not found in token" });
    }

    if (mode === "login") {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          message: "Account not found. Please sign up first",
        });
      }
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        avatar: user.avatar || picture,
      });
    } else if (mode === "signup") {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Account already exists. Please login.",
        });
      }

      const userName = name || email.split("@")[0];
      const handle =
        "@" +
        userName.split(" ")[0].toLowerCase() +
        "_" +
        Math.floor(Math.random() * 1000);

      const newUser = await User.create({
        name: userName,
        email,
        avatar: picture || "",
        googleId: sub,
        handle,
      });

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        handle: newUser.handle,
        avatar: newUser.avatar,
      });
    } else {
      return res.status(400).json({ message: "Invalid mode parameter" });
    }
  } catch (e) {
    console.error("Google auth error:", e);
    res.status(500).json({
      message: "Authentication failed: " + e.message,
    });
  }
};
