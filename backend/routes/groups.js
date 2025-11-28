const express = require("express");
const {
    createGroup,
    getGroups,
    joinGroup,
    getGroupMessages,
    sendMessage,
} = require("../controllers/groups.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

const router = express.Router();

/* READ */
router.get("/", verifyToken, getGroups);
router.get("/:id/messages", verifyToken, getGroupMessages);

/* WRITE */
router.post("/", verifyToken, createGroup);
router.post("/:id/messages", verifyToken, sendMessage);

/* UPDATE */
router.patch("/:id/join", verifyToken, joinGroup);

module.exports = router;
