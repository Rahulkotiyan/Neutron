const express = require("express");
const {
  getAdminStats,
  deletePost,
  deleteUser,
} = require("../controllers/admin.js");
const { verifyToken, verifyAdmin } = require("../middleware/auth.middleware.js");

const router = express.Router();

// All routes require Token AND Admin status
router.get("/stats", verifyToken, verifyAdmin, getAdminStats);
router.delete("/post/:id", verifyToken, verifyAdmin, deletePost);
router.delete("/user/:id", verifyToken, verifyAdmin, deleteUser);

module.exports = router;
