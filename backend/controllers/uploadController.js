const { supabase, SUPABASE_BUCKET } = require("../config/supabase");
const { Group, User } = require("../models/Schema");
const mongoose = require("mongoose");
const crypto = require("crypto");

const ALLOWED_MIME = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/heic", "image/heif",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
  "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
  "application/json",
];

const uploadFile = async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ success: false, message: "Invalid channel ID" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    if (!ALLOWED_MIME.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: "File type not allowed" });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, message: "Storage not configured" });
    }

    const user = await User.findOne({ email: req.user.email });
    const group = await Group.findOne({ "channels._id": channelId });
    if (!group) return res.status(404).json({ success: false, message: "Channel not found" });

    const isMember = group.members.some((m) => m.userId.toString() === user._id.toString());
    const isAdmin = group.admins.some((a) => a.toString() === user._id.toString());
    const isOwner = group.owner.toString() === user._id.toString();
    if (!isMember && !isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Not a member" });
    }

    const ext = req.file.originalname.split(".").pop() || "bin";
    const key = `chat-uploads/${channelId}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(key, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ success: false, message: "Upload failed" });
    }

    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(key);

    const url = publicUrlData.publicUrl;

    const attachment = {
      id: crypto.randomUUID(),
      filename: req.file.originalname,
      url,
      size: req.file.size,
      contentType: req.file.mimetype,
    };

    res.status(200).json({ success: true, data: attachment });
  } catch (err) {
    console.error("Upload controller error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

module.exports = { uploadFile };
