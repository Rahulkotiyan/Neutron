const express = require("express");
const router = express.Router();
const collegeController = require("../controllers/collegeController");

// Get list of colleges
router.get("/", collegeController.getColleges);

// Add a new college (admin function)
router.post("/", collegeController.addCollege);

// Update college status
router.patch("/:collegeId", collegeController.updateCollegeStatus);

// Delete a college
router.delete("/:collegeId", collegeController.deleteCollege);

module.exports = router;
