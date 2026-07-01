const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchController");
const { cacheMiddleware } = require("../middleware/simpleCache");
const { longTermCache } = require("../middleware/cacheMiddleware");

// Get list of branches
router.get("/", longTermCache, cacheMiddleware(300000), branchController.getBranches);

// Add a new branch (admin function)
router.post("/", branchController.addBranch);

// Update branch status
router.patch("/:branchId", branchController.updateBranchStatus);

// Delete a branch
router.delete("/:branchId", branchController.deleteBranch);

module.exports = router;
