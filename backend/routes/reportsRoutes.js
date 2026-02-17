const express = require("express");
const router = express.Router();
const { submitReport, getPendingReports, resolveReport } = require("../controllers/reportsController");
const authMiddleware = require("../middleware/authMiddleware");

// Submit a report (user route)
router.post("/reports", authMiddleware, submitReport);

// Admin routes
router.get("/admin/reports", authMiddleware, getPendingReports);
router.post("/admin/resolve", authMiddleware, resolveReport);

module.exports = router;
