const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    title: { type: String, required: true },
    subject: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },

    type: {
      type: String,
      enum: ["Notes", "Question Paper", "Assignment", "Lab Manual"],
      required: true,
    }, // [cite: 68-73]

    fileUrl: { type: String, required: true }, // PDF Link
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", ResourceSchema);
