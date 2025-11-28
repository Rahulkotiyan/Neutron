const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Content
    content: { type: String },
    image: { type: String }, // URL from Cloudinary

    // Categorization
    type: {
      type: String,
      enum: [
        "General",
        "Announcement",
        "Confession",
        "LostFound",
        "Query",
        "Event",
        "Meme",
      ],
      default: "General",
    },

    // The "Anonymous Confession" Feature [cite: 79]
    isAnonymous: { type: Boolean, default: false },

    // Engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // For sorting "Hot", "Top" [cite: 101]
    upvoteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
