const College = require("../models/CollegeSchema");

// Get all active colleges
exports.getColleges = async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true }).sort({ name: 1 });
    res.json(colleges);
  } catch (err) {
    console.error("Error fetching colleges:", err);
    res.status(500).json({ message: "Error fetching colleges" });
  }
};

// Seed initial colleges (for setup)
exports.seedColleges = async (req, res) => {
  try {
    // Clear existing colleges
    await College.deleteMany({});
    console.log("Cleared existing colleges");

    // Add initial college
    const initialColleges = [
      {
        name: "Dr Ambedkar Institute Of Technology",
        isActive: true
      }
    ];

    await College.insertMany(initialColleges);
    console.log("Initial colleges seeded successfully");

    // Display seeded colleges
    const colleges = await College.find({});
    console.log("Current colleges in database:");
    colleges.forEach(college => {
      console.log(`- ${college.name} (Active: ${college.isActive})`);
    });

    res.json({ 
      message: "Colleges seeded successfully", 
      colleges: colleges,
      count: colleges.length 
    });
  } catch (err) {
    console.error("Error seeding colleges:", err);
    res.status(500).json({ message: "Error seeding colleges" });
  }
};

// Add a new college (admin function)
exports.addCollege = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "College name is required" });
    }

    // Check if college already exists
    const existingCollege = await College.findOne({ name: name.trim() });
    if (existingCollege) {
      return res.status(400).json({ message: "College already exists" });
    }

    const college = new College({
      name: name.trim()
    });

    await college.save();
    res.status(201).json(college);
  } catch (err) {
    console.error("Error adding college:", err);
    res.status(500).json({ message: "Error adding college" });
  }
};

// Update college status (activate/deactivate)
exports.updateCollegeStatus = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const { isActive } = req.body;

    const college = await College.findByIdAndUpdate(
      collegeId,
      { isActive },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.json(college);
  } catch (err) {
    console.error("Error updating college:", err);
    res.status(500).json({ message: "Error updating college" });
  }
};

// Delete a college
exports.deleteCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;

    const college = await College.findByIdAndDelete(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    res.json({ message: "College deleted successfully" });
  } catch (err) {
    console.error("Error deleting college:", err);
    res.status(500).json({ message: "Error deleting college" });
  }
};
