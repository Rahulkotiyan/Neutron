const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number },
    // --- NEW FIELD ---
    branch: { type: String, required: true },
    // ----------------
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    college: { type: String, required: true },
  },
  { timestamps: true }
);

const Resource = mongoose.model("Resource", resourceSchema);
module.exports = Resource;
