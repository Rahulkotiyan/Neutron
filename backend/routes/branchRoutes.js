const express = require("express");
const router = express.Router();

// Get list of branches
router.get("/", async (req, res) => {
  try {
    // For now, return a static list of engineering branches
    // In a real app, this might come from a database
    const branches = [
      { _id: "1", name: "Computer Science Engineering" },
      { _id: "2", name: "Information Technology" },
      { _id: "3", name: "Electronics and Communication Engineering" },
      { _id: "4", name: "Electrical and Electronics Engineering" },
      { _id: "5", name: "Mechanical Engineering" },
      { _id: "6", name: "Civil Engineering" },
      { _id: "7", name: "Chemical Engineering" },
      { _id: "8", name: "Aerospace Engineering" },
      { _id: "9", name: "Biotechnology Engineering" },
      { _id: "10", name: "Instrumentation Engineering" },
      { _id: "11", name: "Production Engineering" },
      { _id: "12", name: "Industrial Engineering" },
      { _id: "13", name: "Textile Engineering" },
      { _id: "14", name: "Automobile Engineering" },
      { _id: "15", name: "Other" }
    ];
    
    res.json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ message: "Error fetching branches" });
  }
});

module.exports = router;
