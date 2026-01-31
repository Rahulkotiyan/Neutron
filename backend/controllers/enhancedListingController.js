const { Listing, User, MarketplaceConversation, MarketplaceReview } = require("../models/Schema");

// Enhanced search with multiple filters and sorting
exports.getEnhancedListings = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      status = "AVAILABLE",
      search,
      college,
      minPrice,
      maxPrice,
      condition,
      brand,
      negotiable,
      deliveryAvailable,
      urgent,
      featured,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
      lat,
      lng,
      maxDistance = 50 // in km
    } = req.query;

    let filter = { status };

    // Category filters
    if (category && category !== "ALL") filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (condition) filter.condition = condition;
    if (brand) filter.brand = new RegExp(brand, "i");
    
    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Boolean filters
    if (negotiable !== undefined) filter.negotiable = negotiable === "true";
    if (deliveryAvailable !== undefined) filter.deliveryAvailable = deliveryAvailable === "true";
    if (urgent !== undefined) filter.urgent = urgent === "true";
    if (featured !== undefined) filter.featured = featured === "true";

    // College filter
    if (college && college !== "Global") filter.college = college;

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } }
      ];
    }

    // Location-based search
    if (lat && lng) {
      filter["location.coordinates"] = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      };
    }

    // Sorting options
    const sortOptions = {};
    const validSortFields = ["createdAt", "price", "views", "likes", "title"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Listing.find(filter)
      .populate("seller._id", "name email phoneNumber avatar college isVerified rating totalSales")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(filter);

    res.json({
      listings,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("Error fetching enhanced listings:", err);
    res.status(500).json({ message: "Error fetching listings" });
  }
};

// Get single listing with enhanced details
exports.getEnhancedListing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const listing = await Listing.findByIdAndUpdate(
      id,
      { 
        $inc: { views: 1 },
        lastBumpedAt: new Date()
      },
      { new: true }
    ).populate("seller._id", "name email phoneNumber avatar college isVerified rating totalSales");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Get similar listings
    const similarListings = await Listing.find({
      _id: { $ne: id },
      category: listing.category,
      status: "AVAILABLE",
      college: listing.college
    })
    .populate("seller._id", "name avatar")
    .limit(6);

    // Get reviews for this seller
    const sellerReviews = await MarketplaceReview.find({
      reviewee: listing.seller._id
    })
    .populate("reviewer", "name avatar")
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      listing,
      similarListings,
      sellerReviews
    });
  } catch (err) {
    console.error("Error fetching enhanced listing:", err);
    res.status(500).json({ message: "Error fetching listing" });
  }
};

// Create enhanced listing
exports.createEnhancedListing = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      brand,
      model,
      year,
      condition,
      usage,
      negotiable,
      deliveryAvailable,
      shippingAvailable,
      warranty,
      returnPolicy,
      specifications,
      tags,
      urgent,
      location,
      college
    } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle multiple image uploads
    let images = [];
    let thumbnail = null;
    
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path);
      thumbnail = images[0]; // First image as thumbnail
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      thumbnail = images[0];
    }

    const listing = await Listing.create({
      title,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      category,
      subcategory,
      brand,
      model,
      year: year ? parseInt(year) : undefined,
      condition,
      usage,
      negotiable: negotiable !== undefined ? negotiable : true,
      deliveryAvailable: deliveryAvailable === "true",
      shippingAvailable: shippingAvailable === "true",
      warranty,
      returnPolicy,
      specifications: specifications ? JSON.parse(specifications) : {},
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim())) : [],
      images,
      thumbnail,
      urgent: urgent === "true",
      location: location ? JSON.parse(location) : {},
      college: college || user.college,
      seller: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        college: user.college,
        isVerified: user.isPremium || false,
        rating: 0,
        totalSales: 0
      }
    });

    res.status(201).json(listing);
  } catch (err) {
    console.error("Error creating enhanced listing:", err);
    res.status(500).json({ message: "Error creating listing", error: err.message });
  }
};

// Update listing
exports.updateEnhancedListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.seller._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this listing" });
    }

    // Handle images update
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updateData.images = [...(listing.images || []), ...newImages];
      if (!updateData.thumbnail) {
        updateData.thumbnail = newImages[0];
      }
    }

    updateData.updatedAt = Date.now();

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("seller._id", "name email phoneNumber avatar college");

    res.json(updatedListing);
  } catch (err) {
    console.error("Error updating listing:", err);
    res.status(500).json({ message: "Error updating listing" });
  }
};

// Like/Save listing
exports.toggleLikeListing = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const isLiked = listing.likes.includes(user._id);
    const isSaved = listing.savedBy.includes(user._id);

    if (isLiked) {
      listing.likes.pull(user._id);
    } else {
      listing.likes.push(user._id);
    }

    if (isSaved) {
      listing.savedBy.pull(user._id);
    } else {
      listing.savedBy.push(user._id);
    }

    await listing.save();
    
    res.json({ 
      liked: !isLiked,
      saved: !isSaved,
      likesCount: listing.likes.length,
      savedCount: listing.savedBy.length
    });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ message: "Error updating like status" });
  }
};

// Report listing
exports.reportListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const user = await User.findOne({ email: req.user.email });

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if user already reported
    const existingReport = listing.reports.find(
      report => report.user.toString() === user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this listing" });
    }

    listing.reports.push({
      user: user._id,
      reason,
      description,
      createdAt: new Date()
    });

    await listing.save();
    res.json({ message: "Listing reported successfully" });
  } catch (err) {
    console.error("Error reporting listing:", err);
    res.status(500).json({ message: "Error reporting listing" });
  }
};

// Get user's saved listings
exports.getSavedListings = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listings = await Listing.find({ 
      savedBy: user._id,
      status: "AVAILABLE"
    })
    .populate("seller._id", "name avatar college")
    .sort({ createdAt: -1 });

    res.json(listings);
  } catch (err) {
    console.error("Error fetching saved listings:", err);
    res.status(500).json({ message: "Error fetching saved listings" });
  }
};

// Get categories with counts
exports.getCategoriesWithCounts = async (req, res) => {
  try {
    const categories = await Listing.aggregate([
      { $match: { status: "AVAILABLE" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// Search suggestions
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const suggestions = await Listing.aggregate([
      { $match: { 
        status: "AVAILABLE",
        $or: [
          { title: { $regex: query, $options: "i" } },
          { brand: { $regex: query, $options: "i" } },
          { tags: { $in: [new RegExp(query, "i")] } }
        ]
      }},
      { $project: { title: 1, brand: 1, category: 1 } },
      { $limit: 10 }
    ]);

    res.json(suggestions);
  } catch (err) {
    console.error("Error getting suggestions:", err);
    res.status(500).json({ message: "Error getting suggestions" });
  }
};

// Bump listing (bring to top)
exports.bumpListing = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ email: req.user.email });

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.seller._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to bump this listing" });
    }

    // Check if user can bump (rate limiting - once every 24 hours)
    const lastBumped = listing.lastBumpedAt;
    const now = new Date();
    const hoursSinceBump = (now - lastBumped) / (1000 * 60 * 60);

    if (hoursSinceBump < 24 && !user.isPremium) {
      return res.status(400).json({ 
        message: "You can only bump your listing once every 24 hours. Premium users can bump more frequently." 
      });
    }

    listing.lastBumpedAt = now;
    await listing.save();

    res.json({ message: "Listing bumped successfully" });
  } catch (err) {
    console.error("Error bumping listing:", err);
    res.status(500).json({ message: "Error bumping listing" });
  }
};
