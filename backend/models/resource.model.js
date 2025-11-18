const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number },
    branch: { type: String, required: true },
    // --- CHANGE: Array of image URLs instead of single fileUrl ---
    imageUrls: [{ type: String, required: true }],
    // -------------------------------------------------------------
    publicIds: [{ type: String }], // Optional: To store Cloudinary public IDs for deletion
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    college: { type: String, required: true },
  },
  { timestamps: true }
);

const Resource = mongoose.model("Resource", resourceSchema);
module.exports = Resource;
