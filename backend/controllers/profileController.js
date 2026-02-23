const { User, Notification } = require("../models/Schema");

// Create user profile
exports.createProfile = async (req, res) => {
  try {
    const { name, username, college, branch, year, about } = req.body;

    // Find the user by email from JWT token
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is already taken
    if (username) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Update user profile
    if (name) user.name = name;
    if (username) {
      user.username = username.toLowerCase();
      user.handle = "@" + username; // Update handle to match username
    }
    if (college) user.college = college;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (about) user.bio = about;
    
    // Mark profile as completed
    user.hasProfile = true;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      handle: user.handle,
      avatar: user.avatar,
      college: user.college,
      branch: user.branch,
      year: user.year,
      bio: user.bio,
      hasProfile: user.hasProfile,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Error creating profile" });
  }
};

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
      isAdmin: user.isAdmin || false,
      isPremium: user.isPremium || false,
      isActive: user.isActive !== false,
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

    // Update avatar if file is uploaded
    if (req.file) {
      user.avatar = req.file.path; // Cloudinary URL
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

// Get user stats (posts, followers, following)
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email })
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get post count
    const { Post } = require("../models/Schema");
    const postCount = await Post.countDocuments({ author: user._id });

    res.json({
      followers: user.followers || [],
      following: user.following || [],
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
      postsCount: postCount,
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ message: "Error fetching user stats" });
  }
};

// Follow user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = await User.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: "User to follow not found" });
    }

    // Add to current user's following
    if (!currentUser.following.includes(userId)) {
      currentUser.following.push(userId);
      await currentUser.save();

      // Add to target user's followers
      if (!userToFollow.followers.includes(currentUser._id)) {
        userToFollow.followers.push(currentUser._id);
        await userToFollow.save();

        // Create notification for the user being followed
        await Notification.create({
          recipient: userId,
          sender: currentUser._id,
          type: "FOLLOW",
          title: "New Follower",
          message: `${currentUser.name} started following you`,
          relatedEntity: {
            entityType: "USER",
            entityId: currentUser._id
          }
        });
      }
    }

    res.json({ message: "User followed successfully" });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ message: "Error following user" });
  }
};

// Unfollow user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = await User.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User to unfollow not found" });
    }

    // Remove from current user's following
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userId
    );
    await currentUser.save();

    // Remove from target user's followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );
    await userToUnfollow.save();

    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

// Get another user's profile by ID
exports.getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findOne({ email: req.user.email });

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current user is following this user
    const isFollowing = currentUser && currentUser.following.includes(userId);

    res.json({
      _id: user._id,
      userId: user._id,
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
      isFollowing: isFollowing,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

// Get another user's stats by ID
exports.getUserStatsById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("followers", "name avatar")
      .populate("following", "name avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get post count
    const { Post } = require("../models/Schema");
    const postCount = await Post.countDocuments({ author: user._id });

    res.json({
      followers: user.followers || [],
      following: user.following || [],
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
      postsCount: postCount,
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ message: "Error fetching user stats" });
  }
};

// Follow user by ID
exports.followUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: "User to follow not found" });
    }

    // Add to current user's following
    if (!currentUser.following.includes(userId)) {
      currentUser.following.push(userId);
      await currentUser.save();

      // Add to target user's followers
      if (!userToFollow.followers.includes(currentUser._id)) {
        userToFollow.followers.push(currentUser._id);
        await userToFollow.save();

        // Create notification for the user being followed
        await Notification.create({
          recipient: userId,
          sender: currentUser._id,
          type: "FOLLOW",
          title: "New Follower",
          message: `${currentUser.name} started following you`,
          relatedEntity: {
            entityType: "USER",
            entityId: currentUser._id
          }
        });
      }
    }

    res.json({ message: "User followed successfully" });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ message: "Error following user" });
  }
};

// Unfollow user by ID
exports.unfollowUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findOne({ email: req.user.email });

    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User to unfollow not found" });
    }

    // Remove from current user's following
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userId
    );
    await currentUser.save();

    // Remove from target user's followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );
    await userToUnfollow.save();

    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ message: "Error unfollowing user" });
  }
};
