const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// Global search across all content types
router.get("/", searchController.globalSearch);

// Search by specific category
router.get("/category", searchController.searchByCategory);

module.exports = router;
