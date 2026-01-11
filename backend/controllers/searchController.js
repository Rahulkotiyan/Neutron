const {
  Post,
  User,
  Group,
  Listing,
  LostFound,
  NotesLibrary,
  Confessions,
} = require("../models/Schema");

// Search across all content types
exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        message: "Query must be at least 2 characters",
      });
    }

    const searchRegex = new RegExp(query, "i"); // Case-insensitive search

    // Search in parallel for better performance
    const [users, posts, groups, listings, lostFound, notes] =
      await Promise.all([
        // Search Users by name or handle
        User.find({
          $or: [
            { name: searchRegex },
            { handle: searchRegex },
            { bio: searchRegex },
          ],
        })
          .select("name handle avatar bio college department followers")
          .limit(10),

        // Search Posts by title or description
        Post.find({
          $or: [
            { title: searchRegex },
            { desc: searchRegex },
            { tag: query.toUpperCase() },
          ],
        })
          .populate("author", "name handle avatar")
          .select("title desc tag college createdAt likes comments author")
          .limit(10),

        // Search Groups by name or description
        Group.find({
          $or: [{ name: searchRegex }, { description: searchRegex }],
        })
          .populate("owner", "name handle avatar")
          .select("name icon type description college members")
          .limit(10),

        // Search Marketplace Listings
        Listing.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { category: query.toUpperCase() },
          ],
        })
          .select("title description price category condition createdAt seller")
          .limit(10),

        // Search Lost & Found
        LostFound.find({
          $or: [
            { itemName: searchRegex },
            { description: searchRegex },
            { location: searchRegex },
          ],
        })
          .select("itemName description location type date poster")
          .limit(10),

        // Search Notes
        NotesLibrary.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { subject: searchRegex },
          ],
        })
          .select("title description subject college uploadedBy createdAt")
          .limit(10),
      ]);

    res.json({
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        type: "user",
        followers: user.followers?.length || 0,
        college: user.college,
        bio: user.bio,
      })),
      posts: posts.map((post) => ({
        id: post._id,
        title: post.title,
        desc: post.desc,
        tag: post.tag,
        type: "post",
        author: post.author,
        college: post.college,
        createdAt: post.createdAt,
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
      })),
      groups: groups.map((group) => ({
        id: group._id,
        name: group.name,
        icon: group.icon,
        type: "group",
        description: group.description,
        owner: group.owner,
        members: group.members?.length || 0,
      })),
      listings: listings.map((listing) => ({
        id: listing._id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        type: "listing",
        condition: listing.condition,
        createdAt: listing.createdAt,
      })),
      lostFound: lostFound.map((item) => ({
        id: item._id,
        itemName: item.itemName,
        description: item.description,
        location: item.location,
        type: "lostfound",
        itemType: item.type,
        poster: item.poster,
      })),
      notes: notes.map((note) => ({
        id: note._id,
        title: note.title,
        description: note.description,
        subject: note.subject,
        type: "note",
        college: note.college,
      })),
    });
  } catch (err) {
    console.error("Search error:", err);
    res
      .status(500)
      .json({ message: "Error performing search", error: err.message });
  }
};

// Search by category (users, posts, groups, etc.)
exports.searchByCategory = async (req, res) => {
  try {
    const { query, category } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        message: "Query must be at least 2 characters",
      });
    }

    const searchRegex = new RegExp(query, "i");
    let results = [];

    switch (category) {
      case "users":
        results = await User.find({
          $or: [
            { name: searchRegex },
            { handle: searchRegex },
            { bio: searchRegex },
          ],
        })
          .select("name handle avatar bio college department followers")
          .limit(20);
        break;

      case "posts":
        results = await Post.find({
          $or: [{ title: searchRegex }, { desc: searchRegex }],
        })
          .populate("author", "name handle avatar")
          .limit(20);
        break;

      case "groups":
        results = await Group.find({
          $or: [{ name: searchRegex }, { description: searchRegex }],
        })
          .populate("owner", "name handle avatar")
          .limit(20);
        break;

      case "listings":
        results = await Listing.find({
          $or: [{ title: searchRegex }, { description: searchRegex }],
        }).limit(20);
        break;

      case "lostfound":
        results = await LostFound.find({
          $or: [{ itemName: searchRegex }, { description: searchRegex }],
        }).limit(20);
        break;

      case "notes":
        results = await NotesLibrary.find({
          $or: [{ title: searchRegex }, { description: searchRegex }],
        }).limit(20);
        break;

      default:
        return res.status(400).json({
          message: "Invalid category",
        });
    }

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res
      .status(500)
      .json({ message: "Error performing search", error: err.message });
  }
};
