const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchController");

// Get list of branches
router.get("/", branchController.getBranches);

// Seed initial branches (for setup)
router.post("/seed", branchController.seedBranches);

// Add a new branch (admin function)
router.post("/", branchController.addBranch);

// Update branch status
router.patch("/:branchId", branchController.updateBranchStatus);

// Delete a branch
router.delete("/:branchId", branchController.deleteBranch);

module.exports = router;
