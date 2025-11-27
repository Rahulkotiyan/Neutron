const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    date: { type: Date, required: true },
    organizer: { type: String }, // Or link to User/Group
    picturePath: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
