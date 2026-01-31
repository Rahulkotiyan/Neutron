const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  createPayPalOrder,
  createRazorpayOrder,
  confirmPayment,
  handleWebhook,
  cancelSubscription,
  getPaymentMethods
} = require('../controllers/paymentController');
const verifyToken = require('../middleware/authMiddleware');

// Payment methods (public)
router.get('/methods', getPaymentMethods);

// Create payment intents
router.post('/stripe/intent', verifyToken, createPaymentIntent);
router.post('/paypal/order', verifyToken, createPayPalOrder);
router.post('/razorpay/order', verifyToken, createRazorpayOrder);

// Confirm payment
router.post('/confirm', verifyToken, confirmPayment);

// Webhook handlers (no auth required, verified by signature)
router.post('/webhook/stripe', handleWebhook);
router.post('/webhook/paypal', handleWebhook);
router.post('/webhook/razorpay', handleWebhook);

// Subscription management
router.post('/cancel', verifyToken, cancelSubscription);

module.exports = router;
