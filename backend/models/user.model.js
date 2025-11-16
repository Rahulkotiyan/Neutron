const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    college: { type: String, required: true },
    role: { type: String, enum: ["student", "guest"], default: "student" },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
