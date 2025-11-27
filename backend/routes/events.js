const express = require("express");
const { getEvents, createEvent } = require("../controllers/events");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

/* READ */
router.get("/", verifyToken, getEvents);

/* CREATE */
// Note: Usually creation is restricted to admins or specific users, but for now allowing all auth users
router.post("/", verifyToken, createEvent);

module.exports = router;
