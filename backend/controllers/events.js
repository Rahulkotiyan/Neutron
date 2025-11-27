const Event = require("../models/Event");

/* CREATE */
const createEvent = async (req, res) => {
  try {
    const { title, description, location, date, picturePath } = req.body;
    const newEvent = new Event({
      title,
      description,
      location,
      date,
      picturePath,
    });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
const getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }); // Sort by date ascending
    res.status(200).json(events);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = { createEvent, getEvents };
