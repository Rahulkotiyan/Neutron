const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const verifyToken = require("../middleware/authMiddleware");
const { uploadListing } = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", listingController.getListings);
router.get("/:id", listingController.getListing);

// Protected routes
router.post(
  "/",
  verifyToken,
  uploadListing.single("image"),
  listingController.createListing
);
router.put(
  "/:id",
  verifyToken,
  uploadListing.single("image"),
  listingController.updateListing
);
router.delete("/:id", verifyToken, listingController.deleteListing);
router.get(
  "/seller/my-listings",
  verifyToken,
  listingController.getSellerListings
);

module.exports = router;
