const mongoose = require("mongoose");
const College = require("../models/CollegeSchema");
require("dotenv").config();

const seedColleges = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/neutron");
    console.log("Connected to MongoDB");

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

  } catch (error) {
    console.error("Error seeding colleges:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seed function
seedColleges();
