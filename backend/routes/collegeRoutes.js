const express = require("express");
const router = express.Router();
const collegeController = require("../controllers/collegeController");
const { cacheMiddleware } = require("../middleware/simpleCache");
const { longTermCache } = require("../middleware/cacheMiddleware");

// Get list of colleges
router.get("/", longTermCache, cacheMiddleware(300000), collegeController.getColleges);

// Add a new college (admin function)
router.post("/", collegeController.addCollege);

// Update college status
router.patch("/:collegeId", collegeController.updateCollegeStatus);

// Delete a college
router.delete("/:collegeId", collegeController.deleteCollege);

module.exports = router;
