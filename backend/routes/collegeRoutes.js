const express = require("express");
const router = express.Router();

// Get list of colleges
router.get("/", async (req, res) => {
  try {
    // For now, return a static list of colleges
    // In a real app, this might come from a database
    const colleges = [
      { _id: "1", name: "AIT Bangalore" },
      { _id: "2", name: "IIT Bombay" },
      { _id: "3", name: "IIT Delhi" },
      { _id: "4", name: "IIT Madras" },
      { _id: "5", name: "IIT Kanpur" },
      { _id: "6", name: "IIT Kharagpur" },
      { _id: "7", name: "IIT Roorkee" },
      { _id: "8", name: "NIT Trichy" },
      { _id: "9", name: "NIT Surathkal" },
      { _id: "10", name: "NIT Warangal" },
      { _id: "11", name: "BIT Mesra" },
      { _id: "12", name: "VIT Vellore" },
      { _id: "13", name: "SRM Institute" },
      { _id: "14", name: "Manipal Institute" },
      { _id: "15", name: "Other" }
    ];
    
    res.json(colleges);
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res.status(500).json({ message: "Error fetching colleges" });
  }
});

module.exports = router;
