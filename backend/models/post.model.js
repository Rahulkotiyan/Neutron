const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    content: { type: String, required: true },
    // Link this post to a user
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // So we can filter posts by college
    college: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
