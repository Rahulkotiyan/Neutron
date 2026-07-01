const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notesController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadNote } = require("../middleware/uploadMiddleware");
const { uploadRateLimit } = require("../middleware/rateLimiterSimple");
const { cacheMiddleware, clearOnSuccess } = require("../middleware/simpleCache");
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
router.get("/", optionalAuth, cacheMiddleware(30000), notesController.getNotes);
router.get("/:id", optionalAuth, notesController.getNote);
router.get("/subject/:subject", optionalAuth, notesController.getNotesBySubject);

// Protected routes
// Create note - file upload is optional (can use Google Drive link instead)
router.post(
  "/",
  verifyToken,
  clearOnSuccess(req => `/api/notes|${req.user._id}`),
  uploadRateLimit, // Apply stricter rate limiting to uploads
  uploadNote.single("file"),
  notesController.createNote
);
router.put(
  "/:id",
  verifyToken,
  clearOnSuccess(req => `/api/notes|${req.user._id}`),
  uploadRateLimit, // Apply stricter rate limiting to updates
  uploadNote.single("file"),
  notesController.updateNote
);
router.delete("/:id", verifyToken, clearOnSuccess(req => `/api/notes|${req.user._id}`), notesController.deleteNote);
router.post("/:id/like", verifyToken, clearOnSuccess(req => `/api/notes|${req.user._id}`), notesController.toggleLike);
router.post("/:id/comment", verifyToken, clearOnSuccess(req => `/api/notes|${req.user._id}`), notesController.addComment);
router.delete(
  "/:id/comment/:commentId",
  verifyToken,
  clearOnSuccess(req => `/api/notes|${req.user._id}`),
  notesController.deleteComment
);
router.post("/:id/download", notesController.incrementDownloads);
router.get("/user/my-notes", verifyToken, notesController.getUserNotes);
router.post("/sync-drive", verifyToken, clearOnSuccess(req => `/api/notes|${req.user._id}`), notesController.syncDriveNotes);

module.exports = router;
