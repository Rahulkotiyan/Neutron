const { Listing } = require("../models/Schema");

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching listings" });
  }
};

exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Error creating listing" });
  }
};
