const Branch = require("../models/BranchSchema");

// Get all active branches
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    res.json(branches);
  } catch (err) {
    console.error("Error fetching branches:", err);
    res.status(500).json({ message: "Error fetching branches" });
  }
};

// Seed initial branches (for setup)
exports.seedBranches = async (req, res) => {
  try {
    // Clear existing branches
    await Branch.deleteMany({});
    console.log("Cleared existing branches");

    // Add initial branches for Dr Ambedkar Institute Of Technology
    const initialBranches = [
      {
        name: "Computer Science and Engineering",
        code: "CSE",
        isActive: true
      },
      {
        name: "Information Science and Engineering",
        code: "ISE",
        isActive: true
      },
      {
        name: "Electronics and Communication Engineering",
        code: "ECE",
        isActive: true
      },
      {
        name: "Electrical and Electronics Engineering",
        code: "EEE",
        isActive: true
      },
      {
        name: "Mechanical Engineering",
        code: "ME",
        isActive: true
      },
      {
        name: "Civil Engineering",
        code: "CE",
        isActive: true
      },
      {
        name: "Artificial Intelligence and Machine Learning",
        code: "AIML",
        isActive: true
      },
      {
        name: "Data Science",
        code: "DS",
        isActive: true
      }
    ];

    await Branch.insertMany(initialBranches);
    console.log("Initial branches seeded successfully");

    // Display seeded branches
    const branches = await Branch.find({});
    console.log("Current branches in database:");
    branches.forEach(branch => {
      console.log(`- ${branch.name} (${branch.code}) (Active: ${branch.isActive})`);
    });

    res.json({ 
      message: "Branches seeded successfully", 
      branches: branches,
      count: branches.length 
    });
  } catch (err) {
    console.error("Error seeding branches:", err);
    res.status(500).json({ message: "Error seeding branches" });
  }
};

// Add a new branch (admin function)
exports.addBranch = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Branch name and code are required" });
    }

    // Check if branch already exists
    const existingBranch = await Branch.findOne({ 
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });
    
    if (existingBranch) {
      return res.status(400).json({ message: "Branch name or code already exists" });
    }

    const branch = new Branch({
      name: name.trim(),
      code: code.trim().toUpperCase()
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (err) {
    console.error("Error adding branch:", err);
    res.status(500).json({ message: "Error adding branch" });
  }
};

// Update branch status (activate/deactivate)
exports.updateBranchStatus = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { isActive } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { isActive },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json(branch);
  } catch (err) {
    console.error("Error updating branch:", err);
    res.status(500).json({ message: "Error updating branch" });
  }
};

// Delete a branch
exports.deleteBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findByIdAndDelete(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    console.error("Error deleting branch:", err);
    res.status(500).json({ message: "Error deleting branch" });
  }
};
