const { User } = require("../models/Schema");

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
      college: user.college,
      branch: user.branch,
      semester: user.semester,
      year: user.year,
      city: user.city,
      state: user.state,
      skills: user.skills || [],
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      college,
      branch,
      semester,
      year,
      city,
      state,
      skills,
      bio,
      phoneNumber,
    } = req.body;

    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (college) user.college = college;
    if (branch) user.branch = branch;
    if (semester) user.semester = semester;
    if (year) user.year = year;
    if (city) user.city = city;
    if (state) user.state = state;
    if (skills)
      user.skills = Array.isArray(skills)
        ? skills
        : skills.split(",").map((s) => s.trim());
    if (bio) user.bio = bio;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      avatar: user.avatar,
      college: user.college,
      branch: user.branch,
      semester: user.semester,
      year: user.year,
      city: user.city,
      state: user.state,
      skills: user.skills || [],
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
};
