const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose
      .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/neutronDB")
      .then(() => console.log("✅ Neutron Database Connected"));
  } catch (error) {
    (err) => console.error("❌ DB Error:", err);
  }
};

module.exports = connectDB;