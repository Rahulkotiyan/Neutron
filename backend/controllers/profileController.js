const { User, Notification, Post, NotesLibrary, Notices, Confessions } = require("../models/Schema");

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

    // Update avatar and banner if files are uploaded
    if (req.files) {
      console.log("Processing file uploads in createProfile...");
      if (req.files.avatar) {
        console.log("Avatar file found:", req.files.avatar[0]);
        user.avatar = req.files.avatar[0].secure_url || req.files.avatar[0].url;
      }
      if (req.files.banner) {
        console.log("Banner file found:", req.files.banner[0]);
        user.banner = req.files.banner[0].secure_url || req.files.banner[0].url;
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
      banner: user.banner,
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
      username: user.username,
      avatar: user.avatar,
      banner: user.banner,
      college: user.college,
      branch: user.branch,
      semester: user.semester,
      year: user.year,
      city: user.city,
      state: user.state,
      skills: user.skills || [],
      bio: user.bio,
      shortBio: user.shortBio,
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
    console.log("Profile update request received");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    
    const {
      name,
      username,
      college,
      branch,
      semester,
      year,
      city,
      state,
      skills,
      bio,
      shortBio,
      phoneNumber,
      externalLink,
    } = req.body;

    console.log("Extracted fields:", {
      name,
      username,
      college,
      branch,
      semester,
      year,
      city,
      state,
      skills,
      bio,
      shortBio,
      phoneNumber,
      externalLink,
    });

    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is already taken (if username is being updated)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Update avatar and banner if files are uploaded
    if (req.files) {
      console.log("Processing file uploads...");
      if (req.files.avatar) {
        console.log("Avatar file found:", req.files.avatar[0]);
        // Use Cloudinary secure_url instead of path
        user.avatar = req.files.avatar[0].secure_url || req.files.avatar[0].url;
      }
      if (req.files.banner) {
        console.log("Banner file found:", req.files.banner[0]);
        // Use Cloudinary secure_url instead of path
        user.banner = req.files.banner[0].secure_url || req.files.banner[0].url;
      }
    }

    // Update fields if provided
    if (name) user.name = name;
    if (username) {
      user.username = username.toLowerCase();
      user.handle = "@" + username; // Update handle to match username
    }
    if (college) user.college = college;
    if (branch) user.branch = branch;
    if (semester) user.semester = semester;
    if (year) user.year = year;
    if (city) user.city = city;
    if (state) user.state = state;
    
    // Handle skills - could be array or string
    if (skills) {
      if (Array.isArray(skills)) {
        user.skills = skills.filter(s => s.trim()).map(s => s.trim());
      } else if (typeof skills === 'string') {
        user.skills = skills.split(",").map((s) => s.trim()).filter((s) => s);
      }
    }
    
    if (bio) user.bio = bio;
    if (shortBio) user.shortBio = shortBio;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (externalLink) user.externalLink = externalLink;

    // Mark profile as completed if updating
    user.hasProfile = true;

    await user.save();

    console.log("Profile updated successfully for user:", user.email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
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
      shortBio: user.shortBio,
      phoneNumber: user.phoneNumber,
      banner: user.banner,
      externalLink: user.externalLink,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      message: err.message,
      name: err.name,
      code: err.code
    });
    res.status(500).json({ 
      message: "Error updating profile",
      error: err.message 
    });
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
      username: user.username,
      avatar: user.avatar,
      banner: user.banner,
      college: user.college,
      branch: user.branch,
      semester: user.semester,
      year: user.year,
      city: user.city,
      state: user.state,
      skills: user.skills || [],
      bio: user.bio,
      shortBio: user.shortBio,
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

// Get user activity (Liked, Disliked, Saved, Commented)
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    let user;

    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ email: req.user?.email });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetUserId = user._id;

    // Liked posts
    const likedPosts = await Post.find({ likes: targetUserId })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    // Disliked posts
    const dislikedPosts = await Post.find({ dislikes: targetUserId })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    // Comments made
    const postsWithComments = await Post.find({ "comments.user": targetUserId })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    // Saved posts with nested population
    const userWithSaved = await User.findById(targetUserId).populate({
      path: "savedPosts",
      populate: [
        { path: "author", select: "name handle avatar" },
        { path: "comments.user", select: "name handle avatar" }
      ]
    });

    res.json({
      likedPosts,
      dislikedPosts,
      comments: postsWithComments,
      savedPosts: userWithSaved?.savedPosts || []
    });
  } catch (err) {
    console.error("Error fetching user activity:", err);
    res.status(500).json({ message: "Error fetching user activity" });
  }
};

// Get user content (Posts, Notes, Notices, Confessions)
exports.getUserContent = async (req, res) => {
  try {
    const { userId } = req.params;
    let user;

    if (userId) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne({ email: req.user?.email });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetUserId = user._id;

    const posts = await Post.find({ author: targetUserId })
      .populate("author", "name handle avatar")
      .populate("comments.user", "name handle avatar")
      .sort({ createdAt: -1 });

    const notes = await NotesLibrary.find({ "uploader._id": targetUserId })
      .sort({ createdAt: -1 });

    const notices = await Notices.find({ "publisher._id": targetUserId })
      .sort({ createdAt: -1 });

    const confessions = await Confessions.find({ userId: targetUserId })
      .sort({ createdAt: -1 });

    res.json({
      posts,
      notes,
      notices,
      confessions
    });
  } catch (err) {
    console.error("Error fetching user content:", err);
    res.status(500).json({ message: "Error fetching user content" });
  }
};
