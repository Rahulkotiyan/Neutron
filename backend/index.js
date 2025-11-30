//imports

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Post = require("./models/Post");
const User = require("./models/User");

//express
const app = express();

//cors for binding frontend and backend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

//creating connection for mongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

//API routes
//Register route

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const handle =
      "@" + name.split(" ")[0].toLowerCase() + Math.floor(Math.random() * 100);

    const newUser = new User({ name, email, password: hashedPassword, handle });
    await newUser.save();

    // EXPLICIT RESPONSE
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      handle: newUser.handle,
      avatar: newUser.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // EXPLICIT RESPONSE
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//post
app.get("/api/posts", async (req, res) => {
  try {
    const mockData = [
      {
        id: 1,
        author: {
          name: "Vex onwe loe",
          handle: "@logriinht",
          avatar: "https://i.pravatar.cc/150?img=11",
        },
        tag: "ANNOUNCEMENT",
        tagColor: "bg-blue-100 text-blue-600",
        title: "Guest Lecture: AI in Healthcare - Tomorrow!",
        desc: "Ancle tonnt toms sexecarlav and tarasieret. Exomy itomi kilesg tinort the time.",
        stats: "4.5K",
      },
      {
        id: 2,
        author: {
          name: "Hyn santvirat",
          handle: "tep-to Ilot",
          avatar: "https://i.pravatar.cc/150?img=5",
        },
        tag: "MEME",
        tagColor: "bg-green-100 text-green-600",
        title: "Foat tarfor AI, Ncelficas",
        desc: "aowroitaw: lait hootitont ciantais.",
        image:
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        stats: "4.5K",
      },
      {
        id: 3,
        author: {
          name: "Abx sw sxre",
          handle: "erliod",
          avatar: "https://i.pravatar.cc/150?img=3",
        },
        tag: "QUESTION",
        tagColor: "bg-yellow-100 text-yellow-600",
        title: "Best cafes near campus studying?",
        desc: "Uceny diot corsrlir rititert.",
        stats: "4.5K",
      },
      {
        id: 4,
        author: {
          name: "Lav ollene",
          handle: "stteir lo ywat",
          avatar: "https://i.pravatar.cc/150?img=9",
        },
        tag: "QUESTION",
        tagColor: "bg-yellow-100 text-yellow-600",
        title: "Best cafes near studying?",
        desc: "Lav ollene stteir lo ywat eaoits.",
        stats: "4.5K",
      },
    ];
    res.json(mockData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
