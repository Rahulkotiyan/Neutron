const { 
  User, 
  Group, 
  PremiumSubscription, 
  GroupBoost, 
  CustomEmojiPack, 
  GroupAnalytics, 
  GroupStory, 
  AutomationRule 
} = require("../models/Schema");
const crypto = require('crypto');

// Premium subscription plans
const PREMIUM_PLANS = {
  BASIC: {
    name: "Basic",
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    features: [
      "customEmojis",
      "largerUploads", // 50MB
      "prioritySupport",
      "earlyAccess"
    ],
    boostsAvailable: 2,
    description: "Essential premium features for power users"
  },
  PREMIUM: {
    name: "Premium", 
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      "animatedAvatar",
      "customBanner",
      "profileThemes",
      "customEmojis",
      "largerUploads", // 100MB
      "hdStreaming",
      "prioritySupport",
      "boostsAvailable" // 5 boosts
    ],
    boostsAvailable: 5,
    description: "Complete premium experience with all features"
  },
  ULTIMATE: {
    name: "Ultimate",
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    features: [
      "animatedAvatar",
      "customBanner", 
      "profileThemes",
      "customEmojis",
      "largerUploads", // 200MB
      "hdStreaming",
      "prioritySupport",
      "customProfileUrl",
      "earlyAccess",
      "boostsAvailable" // 10 boosts
    ],
    boostsAvailable: 10,
    description: "Ultimate experience with maximum benefits"
  }
};

// Group boost level features (Telegram-inspired)
const BOOST_LEVEL_FEATURES = {
  1: {
    storiesPerDay: 1,
    coverColors: 1,
    hasEmojiPack: false,
    hasCustomLogo: false,
    hasVoiceToText: false,
    emojiStatuses: 0,
    customBackgrounds: 0
  },
  2: {
    storiesPerDay: 2,
    coverColors: 8,
    hasEmojiPack: false,
    hasCustomLogo: false,
    hasVoiceToText: false,
    emojiStatuses: 0,
    customBackgrounds: 0
  },
  3: {
    storiesPerDay: 3,
    coverColors: 16,
    hasEmojiPack: false,
    hasCustomLogo: false,
    hasVoiceToText: false,
    emojiStatuses: 0,
    customBackgrounds: 0
  },
  4: {
    storiesPerDay: 4,
    coverColors: 16,
    hasEmojiPack: true,
    hasCustomLogo: false,
    hasVoiceToText: false,
    emojiStatuses: 0,
    customBackgrounds: 0
  },
  5: {
    storiesPerDay: 5,
    coverColors: 16,
    hasEmojiPack: true,
    hasCustomLogo: true,
    hasVoiceToText: false,
    emojiStatuses: 0,
    customBackgrounds: 0
  },
  6: {
    storiesPerDay: 6,
    coverColors: 16,
    hasEmojiPack: true,
    hasCustomLogo: true,
    hasVoiceToText: true,
    emojiStatuses: 0,
    customBackgrounds: 0
  },
  7: {
    storiesPerDay: 7,
    coverColors: 16,
    hasEmojiPack: true,
    hasCustomLogo: true,
    hasVoiceToText: true,
    emojiStatuses: 0,
    customBackgrounds: 0
  },
  8: {
    storiesPerDay: 8,
    coverColors: 16,
    hasEmojiPack: true,
    hasCustomLogo: true,
    hasVoiceToText: true,
    emojiStatuses: 1000,
    customBackgrounds: 0
  },
  9: {
    storiesPerDay: 9,
    coverColors: 16,
    hasEmojiPack: true,
    hasCustomLogo: true,
    hasVoiceToText: true,
    emojiStatuses: 1000,
    customBackgrounds: 8
  },
  10: {
    storiesPerDay: 10,
    coverColors: 16,
    hasEmojiPack: true,
    hasCustomLogo: true,
    hasVoiceToText: true,
    emojiStatuses: 1000,
    customBackgrounds: 16
  }
};

// Get premium plans
exports.getPremiumPlans = async (req, res) => {
  try {
    res.json(PREMIUM_PLANS);
  } catch (err) {
    res.status(500).json({ message: "Error fetching premium plans" });
  }
};

// Create premium subscription
exports.createSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod, isYearly } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const planDetails = PREMIUM_PLANS[plan];
    if (!planDetails) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    // Check if user already has active subscription
    const existingSubscription = await PremiumSubscription.findOne({
      user: user._id,
      status: "ACTIVE"
    });

    if (existingSubscription) {
      return res.status(400).json({ message: "User already has active subscription" });
    }

    const price = isYearly ? planDetails.yearlyPrice : planDetails.monthlyPrice;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (isYearly ? 12 : 1));

    const subscription = new PremiumSubscription({
      user: user._id,
      plan,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      paymentMethod,
      monthlyPrice: planDetails.monthlyPrice,
      yearlyPrice: planDetails.yearlyPrice,
      features: planDetails.features,
      boostsAvailable: planDetails.boostsAvailable
    });

    await subscription.save();

    // Update user premium status
    user.isPremium = true;
    user.premiumPlan = plan;
    user.boostsAvailable = planDetails.boostsAvailable;
    
    // Enable premium features for user
    planDetails.features.forEach(feature => {
      if (user.premiumFeatures[feature] !== undefined) {
        user.premiumFeatures[feature] = true;
      }
    });

    await user.save();

    res.status(201).json({
      subscription,
      user: {
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumFeatures: user.premiumFeatures,
        boostsAvailable: user.boostsAvailable
      }
    });
  } catch (err) {
    console.error("Error creating subscription:", err);
    res.status(500).json({ message: "Error creating subscription" });
  }
};

// Boost a group
exports.boostGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user || !user.isPremium) {
      return res.status(403).json({ message: "Premium subscription required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user has available boosts
    if (user.boostsAvailable <= user.boostsUsed) {
      return res.status(400).json({ message: "No boosts available" });
    }

    // Check if user already boosted this group
    const existingBoost = await GroupBoost.findOne({
      group: groupId,
      boostedBy: user._id,
      isActive: true
    });

    if (existingBoost) {
      return res.status(400).json({ message: "Already boosted this group" });
    }

    // Calculate new boost level for the group
    const currentBoosts = await GroupBoost.countDocuments({
      group: groupId,
      isActive: true
    });

    const newBoostLevel = Math.min(currentBoosts + 1, 10);
    const boostFeatures = BOOST_LEVEL_FEATURES[newBoostLevel];

    // Create boost record
    const boost = new GroupBoost({
      group: groupId,
      boostedBy: user._id,
      boostLevel: newBoostLevel,
      features: Object.keys(boostFeatures),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      boostType: "PREMIUM_USER"
    });

    await boost.save();

    // Update group boost level and features
    group.boostLevel = newBoostLevel;
    group.boostCount = currentBoosts + 1;
    group.boostFeatures = boostFeatures;
    await group.save();

    // Update user boost usage
    user.boostsUsed += 1;
    await user.save();

    res.json({
      boost,
      group: {
        boostLevel: group.boostLevel,
        boostCount: group.boostCount,
        boostFeatures: group.boostFeatures
      },
      user: {
        boostsAvailable: user.boostsAvailable,
        boostsUsed: user.boostsUsed
      }
    });
  } catch (err) {
    console.error("Error boosting group:", err);
    res.status(500).json({ message: "Error boosting group" });
  }
};

// Get group analytics (premium feature)
exports.getGroupAnalytics = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;
    
    const user = await User.findOne({ email: req.user.email });
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user has access to analytics
    const isOwner = group.owner.toString() === user._id.toString();
    const isAdmin = group.admins.some(admin => admin.toString() === user._id.toString());
    const hasPremiumAnalytics = group.premiumFeatures.advancedAnalytics;

    if (!isOwner && !isAdmin && !hasPremiumAnalytics) {
      return res.status(403).json({ message: "Premium feature or admin access required" });
    }

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const analytics = await GroupAnalytics.find({
      group: groupId,
      date: dateFilter
    }).sort({ date: -1 });

    // Generate real-time analytics if none exist
    if (analytics.length === 0) {
      await generateGroupAnalytics(groupId);
      const newAnalytics = await GroupAnalytics.find({
        group: groupId,
        date: dateFilter
      }).sort({ date: -1 });
      return res.json(newAnalytics);
    }

    res.json(analytics);
  } catch (err) {
    console.error("Error fetching group analytics:", err);
    res.status(500).json({ message: "Error fetching group analytics" });
  }
};

// Create custom emoji pack (premium feature)
exports.createEmojiPack = async (req, res) => {
  try {
    const { name, description, group, emojis, isPublic } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user || !user.premiumFeatures.customEmojis) {
      return res.status(403).json({ message: "Premium feature required" });
    }

    if (group) {
      const groupDoc = await Group.findById(group);
      if (!groupDoc || groupDoc.boostLevel < 4) {
        return res.status(403).json({ message: "Group boost level 4+ required" });
      }
    }

    const emojiPack = new CustomEmojiPack({
      name,
      description,
      creator: user._id,
      group,
      emojis,
      isPublic,
      isPremium: true,
      requiredBoostLevel: group ? 4 : 0
    });

    await emojiPack.save();
    await emojiPack.populate("creator", "name avatar");

    res.status(201).json(emojiPack);
  } catch (err) {
    console.error("Error creating emoji pack:", err);
    res.status(500).json({ message: "Error creating emoji pack" });
  }
};

// Create group story (premium feature)
exports.createGroupStory = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user can post stories
    const isOwner = group.owner.toString() === user._id.toString();
    const isAdmin = group.admins.some(admin => admin.toString() === user._id.toString());
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check story limits based on boost level
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStories = await GroupStory.countDocuments({
      group: groupId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (todayStories >= group.boostFeatures.storiesPerDay) {
      return res.status(400).json({ 
        message: `Daily story limit reached (${group.boostFeatures.storiesPerDay} per day)` 
      });
    }

    const story = new GroupStory({
      group: groupId,
      author: user._id,
      content,
      isPremium: group.boostLevel > 0
    });

    await story.save();
    await story.populate("author", "name avatar");

    res.status(201).json(story);
  } catch (err) {
    console.error("Error creating group story:", err);
    res.status(500).json({ message: "Error creating group story" });
  }
};

// Create automation rule (premium feature)
exports.createAutomationRule = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, trigger, actions } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user has permission
    const isOwner = group.owner.toString() === user._id.toString();
    const isAdmin = group.admins.some(admin => admin.toString() === user._id.toString());
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check if group has automation features
    if (!group.premiumFeatures.automationRules && group.boostLevel < 3) {
      return res.status(403).json({ message: "Premium feature or higher boost level required" });
    }

    const automationRule = new AutomationRule({
      group: groupId,
      createdBy: user._id,
      name,
      description,
      trigger,
      actions,
      isPremium: true
    });

    await automationRule.save();
    await automationRule.populate("createdBy", "name avatar");

    res.status(201).json(automationRule);
  } catch (err) {
    console.error("Error creating automation rule:", err);
    res.status(500).json({ message: "Error creating automation rule" });
  }
};

// Get user's premium status
exports.getPremiumStatus = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = await PremiumSubscription.findOne({
      user: user._id,
      status: "ACTIVE"
    });

    const userBoosts = await GroupBoost.find({
      boostedBy: user._id,
      isActive: true
    }).populate("group", "name icon");

    res.json({
      user: {
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumFeatures: user.premiumFeatures,
        boostsAvailable: user.boostsAvailable,
        boostsUsed: user.boostsUsed
      },
      subscription,
      activeBoosts: userBoosts
    });
  } catch (err) {
    console.error("Error fetching premium status:", err);
    res.status(500).json({ message: "Error fetching premium status" });
  }
};

// Helper function to generate group analytics
async function generateGroupAnalytics(groupId) {
  try {
    const group = await Group.findById(groupId).populate("members", "department year");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate metrics
    const activeMembers = group.members.filter(member => 
      Math.random() > 0.3 // Mock active calculation
    ).length;

    const newMembers = group.members.filter(member => {
      const joinedDate = member.joinedAt || new Date();
      return joinedDate >= today;
    }).length;

    const messagesSent = Math.floor(Math.random() * 1000); // Mock calculation
    const engagementRate = activeMembers > 0 ? (messagesSent / activeMembers) * 100 : 0;

    // Calculate demographics
    const departments = {};
    const years = {};
    
    group.members.forEach(member => {
      if (member.department) {
        departments[member.department] = (departments[member.department] || 0) + 1;
      }
      if (member.year) {
        years[member.year] = (years[member.year] || 0) + 1;
      }
    });

    const analytics = new GroupAnalytics({
      group: groupId,
      date: today,
      metrics: {
        activeMembers,
        newMembers,
        messagesSent,
        engagementRate: Math.round(engagementRate * 100) / 100,
        memberGrowth: newMembers,
        retentionRate: Math.round((activeMembers / group.members.length) * 100 * 100) / 100
      },
      demographics: {
        departments: Object.entries(departments).map(([name, count]) => ({ name, count })),
        years: Object.entries(years).map(([year, count]) => ({ year, count }))
      }
    });

    await analytics.save();
  } catch (err) {
    console.error("Error generating analytics:", err);
  }
}
