const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notesController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadNote } = require("../middleware/uploadMiddleware");
const { uploadRateLimit } = require("../middleware/rateLimiterSimple");
const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    if (decoded) req.user = { _id: decoded._id || decoded.sub };
  } catch { }
  next();
};

// Public routes
router.get("/", optionalAuth, notesController.getNotes);
router.get("/:id", optionalAuth, notesController.getNote);
router.get("/subject/:subject", optionalAuth, notesController.getNotesBySubject);

// Protected routes
// Create note - file upload is optional (can use Google Drive link instead)
router.post(
  "/",
  verifyToken,
  uploadRateLimit, // Apply stricter rate limiting to uploads
  uploadNote.single("file"),
  notesController.createNote
);
router.put(
  "/:id",
  verifyToken,
  uploadRateLimit, // Apply stricter rate limiting to updates
  uploadNote.single("file"),
  notesController.updateNote
);
router.delete("/:id", verifyToken, notesController.deleteNote);
router.post("/:id/like", verifyToken, notesController.toggleLike);
router.post("/:id/comment", verifyToken, notesController.addComment);
router.delete(
  "/:id/comment/:commentId",
  verifyToken,
  notesController.deleteComment
);
router.post("/:id/download", notesController.incrementDownloads);
router.get("/user/my-notes", verifyToken, notesController.getUserNotes);
router.post("/sync-drive", verifyToken, notesController.syncDriveNotes);

module.exports = router;
