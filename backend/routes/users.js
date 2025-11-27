const express = require("express");
const { getUser, searchUsers } = require("../controllers/users.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

const router = express.Router();

/* READ */
router.get("/search", verifyToken, searchUsers); // Must be before /:id to avoid conflict
router.get("/:id", verifyToken, getUser);

module.exports = router;
