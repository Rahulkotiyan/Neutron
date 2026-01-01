const { Event } = require("../models/Schema");

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
