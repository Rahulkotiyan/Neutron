//Acts as admin controller for backend.Contains logic for admin dashboard


//Import mongoose models created.
const User = require("../models/User");
const Post = require("../models/Post");
const MarketItem = require("../models/MarketItem");
const Resource = require("../models/Resource");

/* GET DASHBOARD STATS */
//Gathers all the data needed to display on admin dashboard
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalMarketItems = await MarketItem.countDocuments();
    const totalResources = await Resource.countDocuments();

    // Fetch recent 5 users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    res.status(200).json({
      totalUsers,
      totalPosts,
      totalMarketItems,
      totalResources,
      recentUsers,
    });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* DELETE CONTENT (Moderation) */
//Allow admin to delete content
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;//grabs post id
    await Post.findByIdAndDelete(id);//mongodb fin d and delete the post
    res.status(200).json({ msg: "Post deleted successfully" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* BAN USER */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);//targets user
    // Note: In a real app, you might want to cascade delete their posts too
    res.status(200).json({ msg: "User banned/deleted successfully" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

module.exports = { getAdminStats, deletePost, deleteUser };
