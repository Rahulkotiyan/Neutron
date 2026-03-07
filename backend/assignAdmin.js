// Quick script to assign admin privileges
// Run this in MongoDB shell or as a Node.js script

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to your database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/neutron');

const User = require('./models/Schema').User;

async function assignAdmin(email) {
  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { isAdmin: true } },
      { new: true }
    );

    if (user) {
    } else {
    }
  } catch (error) {
    console.error('Error assigning admin:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Replace with the actual admin email
assignAdmin('rahulkotiyan27@gmail.com');
