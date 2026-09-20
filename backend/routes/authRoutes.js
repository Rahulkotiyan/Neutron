const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authRateLimit, usernameCheckRateLimit } = require("../middleware/rateLimiterSimple");

// Sensitive auth endpoints get the strict brute-force limiter (10 / 15 min).
router.post("/register", authRateLimit, authController.register);
router.post("/login", authRateLimit, authController.login);
router.post("/google-login", authRateLimit, authController.googleLogin);

// Username availability is a harmless lookup fired per-keystroke while typing —
// it gets its own generous limiter so the strict auth budget isn't exhausted.
router.get("/check-username/:username", usernameCheckRateLimit, authController.checkUsernameAvailability);

module.exports = router;