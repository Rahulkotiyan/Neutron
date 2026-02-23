const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google-login", authController.googleLogin);
router.get("/check-username/:username", authController.checkUsernameAvailability);

module.exports = router;
