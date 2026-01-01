const { Group, Event } = require("../models/Schema");

exports.seedDatabase = async (req, res) => {
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
};
