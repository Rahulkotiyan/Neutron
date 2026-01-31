const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { uploadListing } = require("../middleware/uploadMiddleware");
const {
  getEnhancedListings,
  getEnhancedListing,
  createEnhancedListing,
  updateEnhancedListing,
  toggleLikeListing,
  reportListing,
  getSavedListings,
  getCategoriesWithCounts,
  getSearchSuggestions,
  bumpListing
} = require("../controllers/enhancedListingController");

// Public routes
router.get("/", getEnhancedListings);
router.get("/categories", getCategoriesWithCounts);
router.get("/suggestions", getSearchSuggestions);
router.get("/:id", getEnhancedListing);

// Protected routes
router.use(authMiddleware);

// Listing management
router.post("/", uploadListing.array("images", 10), createEnhancedListing);
router.put("/:id", uploadListing.array("images", 10), updateEnhancedListing);
router.post("/:id/like", toggleLikeListing);
router.post("/:id/report", reportListing);
router.post("/:id/bump", bumpListing);

// User specific
router.get("/saved/my", getSavedListings);

module.exports = router;
