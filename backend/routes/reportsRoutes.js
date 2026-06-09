const express = require("express");
const router = express.Router();
const { submitReport } = require("../controllers/reportsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/reports", authMiddleware, submitReport);

module.exports = router;
