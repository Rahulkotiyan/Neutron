const mongoose = require("mongoose");
const College = require("../models/CollegeSchema");
require("dotenv").config();

const seedColleges = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/neutron");

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

  } catch (error) {
    // Error handling without logging
  } finally {
    await mongoose.disconnect();
  }
};

// Run the seed function
seedColleges();
