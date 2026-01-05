const { Group, Event, Post, User } = require("../models/Schema");

exports.seedDatabase = async (req, res) => {
  try {
    console.log("🧹 Starting Database Cleanup...");

    // 1. FORCE DROP USER COLLECTION
    // This deletes all users and, more importantly, the bad indexes
    try {
      await User.collection.drop();
      console.log("✅ User collection dropped (Old indexes removed).");
    } catch (e) {
      if (e.code === 26) {
        console.log("ℹ️ User collection was already empty.");
      } else {
        console.log("⚠️ Note: " + e.message);
      }
    }

    // 2. CLEAR POSTS
    await Post.deleteMany({});
    console.log("✅ Posts cleared.");

    // 3. SEED GROUPS
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
      console.log("✅ Groups seeded.");
    }

    // 4. SEED EVENTS
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
      console.log("✅ Events seeded.");
    }

    res.send("Database Successfully Reset! You can now Login/Register.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Seed Error: " + err.message);
  }
};
