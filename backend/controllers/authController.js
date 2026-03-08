const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/Schema");
const { OAuth2Client } = require("google-auth-library");
const admin = require("../config/firebase");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const generateToken = (user) => {
  return jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let handle;
    do {
      handle = "@" + name.split(" ")[0].toLowerCase() + "_" + Math.floor(Math.random() * 1000);
    } while (await User.findOne({ handle }));

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      handle,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      token,
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      handle: newUser.handle,
      avatar: newUser.avatar,
      college: newUser.college,
      hasProfile: newUser.hasProfile,
      isAdmin: newUser.isAdmin || false,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
      college: user.college,
      hasProfile: user.hasProfile,
      isAdmin: user.isAdmin || false,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token, mode } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token required" });
    }

    if (!mode || !["login", "signup"].includes(mode)) {
      return res.status(400).json({ success: false, message: "Invalid or missing mode parameter" });
    }

    let payload;

    // 1. Try Firebase Verification
    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true); // Add checkRevoked=true
      payload = {
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split("@")[0],
        picture: decodedToken.picture || "",
        sub: decodedToken.uid,
      };
    } catch (firebaseErr) {
      // 2. Fallback to Google OAuth Verification
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (googleErr) {
        return res.status(401).json({
          success: false,
          message: "Invalid token - neither Firebase ID token nor valid Google OAuth token",
          error: googleErr.message,
        });
      }
    }

    const { email, name, picture, sub } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in token" });
    }

    if (mode === "login") {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Account not found. Please sign up first",
        });
      }

      // Check if user has profile data and set hasProfile accordingly
      if (!user.hasProfile && user.name && user.college) {
        user.hasProfile = true;
        await user.save();
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        avatar: user.avatar || picture,
        college: user.college,
        hasProfile: user.hasProfile,
        isAdmin: user.isAdmin || false,
      });
    } else if (mode === "signup") {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Account already exists. Please login.",
        });
      }

      const userName = name || email.split("@")[0];
      let handle;
      do {
        handle = "@" + userName.split(" ")[0].toLowerCase() + "_" + Math.floor(Math.random() * 1000);
      } while (await User.findOne({ handle }));

      const newUser = await User.create({
        name: userName,
        email,
        avatar: picture || "",
        googleId: sub,
        handle,
      });

      const token = generateToken(newUser);
      return res.status(201).json({
        success: true,
        token,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        handle: newUser.handle,
        avatar: newUser.avatar,
        college: newUser.college,
        hasProfile: newUser.hasProfile,
        isAdmin: newUser.isAdmin || false,
      });
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Authentication failed: " + e.message,
    });
  }
};

exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 3) {
      return res.json({ success: false, available: false, message: "Username must be at least 3 characters" });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    res.json({ success: true, available: !existingUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error checking username availability" });
  }
};
