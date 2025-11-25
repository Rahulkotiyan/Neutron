const mongoose = require("mongoose");

const MarketItemSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }], // Array of image URLs

    category: {
      type: String,
      enum: [
        "Books",
        "Electronics",
        "Stationery",
        "Vehicles",
        "Hostel",
        "Other",
      ],
      required: true,
    }, // [cite: 40-46]

    status: { type: String, enum: ["Available", "Sold"], default: "Available" },

    // Monetization: "Boosted Listing" [cite: 84]
    isBoosted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketItem", MarketItemSchema);
