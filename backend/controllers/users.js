const User = require("../models/User");

/* READ */
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* SEARCH USERS */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    // Search by username or collegeId (case insensitive)
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { collegeId: { $regex: query, $options: "i" } },
      ],
    }).select("username collegeId department profilePicture"); // Return only needed fields

    res.status(200).json(users);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = { getUser, searchUsers };
