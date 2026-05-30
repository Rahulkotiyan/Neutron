const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const { cacheMiddleware } = require("../middleware/simpleCache");

// Global search across all content types
router.get("/", cacheMiddleware(30000), searchController.globalSearch);

// Search by specific category
router.get("/category", searchController.searchByCategory);

module.exports = router;
