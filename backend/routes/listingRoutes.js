const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");

router.get("/", listingController.getListings);
router.post("/", listingController.createListing);

module.exports = router;
