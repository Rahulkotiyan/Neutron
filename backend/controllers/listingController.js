const { Listing, User } = require("../models/Schema");

// Get all listings with filters
exports.getListings = async (req, res) => {
  try {
    const { category, status, search, college } = req.query;
    let filter = {};

    if (category && category !== "ALL") filter.category = category;
    if (status) filter.status = status;
    if (college) filter.college = college;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate("seller._id", "name email phoneNumber avatar college");

    res.json(listings);
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({ message: "Error fetching listings" });
  }
};

// Get single listing
exports.getListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("seller._id", "name email phoneNumber avatar college");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(listing);
  } catch (err) {
    console.error("Error fetching listing:", err);
    res.status(500).json({ message: "Error fetching listing" });
  }
};

// Create listing (protected)
exports.createListing = async (req, res) => {
  try {
    const { title, description, price, category, condition, image, college } =
      req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      condition,
      image,
      college: college || user.college,
      seller: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        college: user.college,
      },
    });

    res.status(201).json(listing);
  } catch (err) {
    console.error("Error creating listing:", err);
    res
      .status(500)
      .json({ message: "Error creating listing", error: err.message });
  }
};

// Update listing (protected)
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, condition, image, status } =
      req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.seller._id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing" });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        title,
        description,
        price,
        category,
        condition,
        image,
        status,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    res.json(updatedListing);
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(500).json({ message: "Error updating listing" });
  }
};

// Delete listing (protected)
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.seller._id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing" });
    }

    await Listing.findByIdAndDelete(id);
    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    console.error("Error deleting listing:", err);
    res.status(500).json({ message: "Error deleting listing" });
  }
};

// Get listings by seller
exports.getSellerListings = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listings = await Listing.find({ "seller._id": user._id }).sort({
      createdAt: -1,
    });

    res.json(listings);
  } catch (err) {
    console.error("Error fetching seller listings:", err);
    res.status(500).json({ message: "Error fetching seller listings" });
  }
};
