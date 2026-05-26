const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: [
      "LIKE",
      "COMMENT",
      "FOLLOW",
      "MESSAGE",
      "NOTICE",
      "SYSTEM"
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ["POST", "COMMENT", "USER", "NOTICE"]
    },
    entityId: { type: mongoose.Schema.Types.ObjectId }
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
},{timestamps:true});

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification",NotificationSchema);
