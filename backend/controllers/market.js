//It is market controller.

const MarketItem = require("../models/MarketItem");

/* GET ITEMS */
const getMarketItems = async (req, res) => {
  try {
    // Fetch all available items, sorted by newest
    const items = await MarketItem.find({ status: "Available" })
      .sort({ createdAt: -1 })
      .populate("sellerId", "username collegeId");
    res.status(200).json(items);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* CREATE ITEM */
const createMarketItem = async (req, res) => {
  try {
    const { sellerId, title, description, price, category } = req.body;

    // Grab the image filename from Multer
    const imagePath = req.file ? req.file.filename : "";

    const newItem = new MarketItem({
      sellerId,
      title,
      description,
      price,
      category,
      images: [imagePath], // storing as array for future expansion
      status: "Available",
    });

    await newItem.save();

    // Return updated list
    const items = await MarketItem.find({ status: "Available" }).sort({
      createdAt: -1,
    });
    res.status(201).json(items);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

module.exports = { getMarketItems, createMarketItem };

