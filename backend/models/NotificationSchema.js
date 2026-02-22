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
      "MENTION",
      "POST",
      "MESSAGE",
      "GROUP_INVITE",
      "MARKETPLACE",
      "LOST_FOUND",
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
      enum: ["POST", "COMMENT", "USER", "GROUP", "LISTING", "LOSTFOUND", "NOTICE"]
    },
    entityId: { type: mongoose.Schema.Types.ObjectId }
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = NotificationSchema;
