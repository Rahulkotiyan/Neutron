const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
let User = require("../models/user.model");

// --- (POST) Register a new user ---
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, college } = req.body;

    // 1. Check if user already exists
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(409).send("User Already Exists. Please Login");
    }

    // 2. Hash the password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // 3. Create user in database
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: encryptedPassword,
      college,
    });

    // 4. Create a token
    const token = jwt.sign(
      { userId: user._id, email, college, username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 5. Send back user info and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        college: user.college,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
});

// --- (POST) Login a user ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });

    // 2. Check password
    if (user && (await bcrypt.compare(password, user.password))) {
      // 3. Create token
      const token = jwt.sign(
        {
          userId: user._id,
          email,
          college: user.college,
          username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      // 4. Send back user info and token
      return res.status(200).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          college: user.college,
        },
      });
    }

    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
