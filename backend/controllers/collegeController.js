const College = require("../models/CollegeSchema");
const mongoose = require("mongoose");

// Get all active colleges
exports.getColleges = async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: colleges,
      message: "Colleges fetched successfully"
    });
  } catch (err) {
    console.error("Error fetching colleges:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching colleges",
      error: err.message
    });
  }
};

// Seed initial colleges (for setup)
exports.seedColleges = async (req, res) => {
  try {
    // Clear existing colleges
    await College.deleteMany({});

    // Add initial college
    const initialColleges = [
      {
        name: "Dr Ambedkar Institute Of Technology",
        isActive: true
      }
    ];

    await College.insertMany(initialColleges);

    // Display seeded colleges
    const colleges = await College.find({});

    res.status(200).json({
      success: true,
      data: {
        colleges: colleges,
        count: colleges.length
      },
      message: "Colleges seeded successfully"
    });
  } catch (err) {
    console.error("Error seeding colleges:", err);
    res.status(500).json({
      success: false,
      message: "Error seeding colleges",
      error: err.message
    });
  }
};

// Add a new college (admin function)
exports.addCollege = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "College name is required"
      });
    }

    // Check if college already exists
    const existingCollege = await College.findOne({ name: name.trim() });
    if (existingCollege) {
      return res.status(400).json({
        success: false,
        message: "College already exists"
      });
    }

    const college = new College({
      name: name.trim()
    });

    await college.save();
    res.status(201).json({
      success: true,
      data: college,
      message: "College added successfully"
    });
  } catch (err) {
    console.error("Error adding college:", err);
    res.status(500).json({
      success: false,
      message: "Error adding college",
      error: err.message
    });
  }
};

// Update college status (activate/deactivate)
exports.updateCollegeStatus = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid college ID"
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean"
      });
    }

    const college = await College.findByIdAndUpdate(
      collegeId,
      { isActive },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found"
      });
    }

    res.status(200).json({
      success: true,
      data: college,
      message: "College status updated successfully"
    });
  } catch (err) {
    console.error("Error updating college:", err);
    res.status(500).json({
      success: false,
      message: "Error updating college",
      error: err.message
    });
  }
};

// Delete a college
exports.deleteCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid college ID"
      });
    }

    const college = await College.findByIdAndDelete(collegeId);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "College deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting college:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting college",
      error: err.message
    });
  }
};
