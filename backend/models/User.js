const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // Verification logic comes later
    password: { type: String, required: true },

    // Academic Details
    collegeId: { type: String, required: true }, // To ensure exclusivity
    department: { type: String, required: true },
    year: { type: Number, required: true }, // Helps in Senior-Junior connect

    // Profile & Reputation
    profilePicture: { type: String, default: "" },
    reputationPoints: { type: Number, default: 0 }, // For "Senior-Junior Connect" badges [cite: 35]
    badges: [{ type: String }], // e.g., "Top Contributor", "Mentor"

    // App Specifics
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    isAdmin: { type: Boolean, default: false }, // For student council/moderators
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
