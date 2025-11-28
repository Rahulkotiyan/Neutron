const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Group = require("./models/Group");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const seedGroups = async () => {
    try {
        // Check if groups exist
        const count = await Group.countDocuments();
        if (count > 0) {
            console.log("Groups already exist. Skipping seed.");
            process.exit();
        }

        const groups = [
            {
                name: "CSE Department",
                description: "Official group for Computer Science & Engineering students.",
                type: "Department",
            },
            {
                name: "Mechanical Dept",
                description: "Official group for Mechanical Engineering students.",
                type: "Department",
            },
            {
                name: "Coding Club",
                description: "For all things programming, hackathons, and dev.",
                type: "Club",
            },
            {
                name: "Robotics Club",
                description: "Building the future, one bot at a time.",
                type: "Club",
            },
            {
                name: "NSS Unit",
                description: "National Service Scheme - Not Me But You.",
                type: "Society",
            },
            {
                name: "Sports Committee",
                description: "Updates on inter-college tournaments and events.",
                type: "Society",
            },
        ];

        await Group.insertMany(groups);
        console.log("Groups seeded successfully!");
        process.exit();
    } catch (error) {
        console.error("Error seeding groups:", error);
        process.exit(1);
    }
};

seedGroups();
