require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const {
  User,
  Post,
  Group,
  Listing,
  Event,
  Resource,
} = require("./models/Schema");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// CONNECT DB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/neutronDB")
  .then(() => console.log("✅ Neutron Database Connected"))
  .catch((err) => console.error("❌ DB Error:", err));

// --- SEEDER (Run once to populate default data) ---
app.get("/api/seed", async (req, res) => {
  try {
    const groupCount = await Group.countDocuments();
    if (groupCount === 0) {
      await Group.insertMany([
        {
          name: "CSE Dept",
          type: "DEPT",
          icon: "Code",
          channels: [{ name: "general" }, { name: "resources" }],
        },
        {
          name: "Robotics Club",
          type: "CLUB",
          icon: "Cpu",
          channels: [{ name: "general" }, { name: "projects" }],
        },
        {
          name: "Photography",
          type: "CLUB",
          icon: "Camera",
          channels: [{ name: "showcase" }],
        },
      ]);
    }
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      await Event.insertMany([
        {
          title: "Hackathon 2024",
          date: "June 10",
          time: "10:00 AM",
          location: "Auditorium",
          color: "from-purple-500 to-pink-500",
        },
        {
          title: "Robotics Workshop",
          date: "June 12",
          time: "2:00 PM",
          location: "Lab 3",
          color: "from-blue-500 to-cyan-500",
        },
      ]);
    }
    res.send("Database Seeded Successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- AUTH ROUTES ---
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const handle =
      "@" + name.split(" ")[0].toLowerCase() + Math.floor(Math.random() * 1000);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      handle,
    });
    res.json(newUser);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// --- FEED ROUTES ---
app.get("/api/posts", async (req, res) => {
  try {
    const { tag } = req.query;
    const filter = tag ? { tag } : {};
    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

app.post("/api/posts", async (req, res) => {
  try {
    const newPost = await Post.create(req.body);
    res.json(newPost);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// --- GROUPS ROUTES ---
app.get("/api/groups", async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Error fetching groups" });
  }
});

// --- MARKETPLACE ROUTES ---
app.get("/api/listings", async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching listings" });
  }
});

app.post("/api/listings", async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Error creating listing" });
  }
});

// --- EVENTS & RESOURCES ---
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Neutron Core Online: ${PORT}`));
