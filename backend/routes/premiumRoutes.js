const express = require('express');
const router = express.Router();
const {
  getPremiumPlans,
  createSubscription,
  boostGroup,
  getGroupAnalytics,
  createEmojiPack,
  createGroupStory,
  createAutomationRule,
  getPremiumStatus
} = require('../controllers/premiumController');
const verifyToken = require('../middleware/authMiddleware');

// Get premium plans (public)
router.get('/plans', getPremiumPlans);

// User premium status
router.get('/status', verifyToken, getPremiumStatus);

// Subscription management
router.post('/subscribe', verifyToken, createSubscription);

// Group boosting
router.post('/boost/:groupId', verifyToken, boostGroup);

// Group analytics (premium feature)
router.get('/analytics/:groupId', verifyToken, getGroupAnalytics);

// Custom emoji packs (premium feature)
router.post('/emoji-packs', verifyToken, createEmojiPack);

// Group stories (premium feature)
router.post('/stories/:groupId', verifyToken, createGroupStory);

// Automation rules (premium feature)
router.post('/automation/:groupId', verifyToken, createAutomationRule);

module.exports = router;
