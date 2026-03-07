const crypto = require('crypto');
const { PremiumSubscription, User } = require('../models/Schema');

// Payment configuration (in production, use environment variables)
const PAYMENT_CONFIG = {
  // Stripe configuration (example)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'
  },
  // PayPal configuration (example)
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || 'test_client_id',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'test_client_secret',
    sandbox: process.env.NODE_ENV !== 'production'
  },
  // Razorpay configuration (example)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_...',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
  }
};

// Premium plans pricing
const PLAN_PRICING = {
  BASIC: {
    monthly: 4.99,
    yearly: 49.99,
    currency: 'USD'
  },
  PREMIUM: {
    monthly: 9.99,
    yearly: 99.99,
    currency: 'USD'
  },
  ULTIMATE: {
    monthly: 19.99,
    yearly: 199.99,
    currency: 'USD'
  }
};

// Create payment intent (Stripe)
exports.createPaymentIntent = async (req, res) => {
  try {
    const { plan, isYearly } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const pricing = PLAN_PRICING[plan];
    if (!pricing) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const amount = isYearly ? pricing.yearly : pricing.monthly;
    const amountInCents = Math.round(amount * 100);

    // In production, use actual Stripe SDK
    // const stripe = require('stripe')(PAYMENT_CONFIG.stripe.secretKey);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amountInCents,
    //   currency: pricing.currency.toLowerCase(),
    //   metadata: {
    //     userId: user._id.toString(),
    //     plan,
    //     isYearly: isYearly.toString()
    //   }
    // });

    // Mock payment intent for development
    const mockPaymentIntent = {
      id: `pi_test_${Date.now()}`,
      client_secret: `pi_test_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: amountInCents,
      currency: pricing.currency.toLowerCase(),
      metadata: {
        userId: user._id.toString(),
        plan,
        isYearly: isYearly.toString()
      }
    };

    res.json({
      clientSecret: mockPaymentIntent.client_secret,
      paymentIntentId: mockPaymentIntent.id,
      amount: amount,
      currency: pricing.currency
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: "Error creating payment intent" });
  }
};

// Create PayPal order
exports.createPayPalOrder = async (req, res) => {
  try {
    const { plan, isYearly } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const pricing = PLAN_PRICING[plan];
    if (!pricing) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const amount = isYearly ? pricing.yearly : pricing.monthly;

    // In production, use actual PayPal SDK
    // const paypal = require('@paypal/checkout-server-sdk');
    // const order = await createPayPalOrder(amount, pricing.currency);

    // Mock PayPal order for development
    const mockOrder = {
      id: `PAYPAL_ORDER_${Date.now()}`,
      status: 'CREATED',
      links: [
        {
          rel: 'approve',
          href: `https://www.sandbox.paypal.com/checkoutnow?token=${Date.now()}`
        }
      ]
    };

    res.json({
      orderId: mockOrder.id,
      approvalUrl: mockOrder.links.find(link => link.rel === 'approve')?.href,
      amount: amount,
      currency: pricing.currency
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ message: "Error creating PayPal order" });
  }
};

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { plan, isYearly } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const pricing = PLAN_PRICING[plan];
    if (!pricing) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const amount = isYearly ? pricing.yearly : pricing.monthly;
    const amountInPaise = Math.round(amount * 100);

    // In production, use actual Razorpay SDK
    // const Razorpay = require('razorpay');
    // const razorpay = new Razorpay({
    //   key_id: PAYMENT_CONFIG.razorpay.keyId,
    //   key_secret: PAYMENT_CONFIG.razorpay.keySecret
    // });
    // const order = await razorpay.orders.create({
    //   amount: amountInPaise,
    //   currency: 'INR',
    //   receipt: `receipt_${Date.now()}`,
    //   notes: {
    //     userId: user._id.toString(),
    //     plan,
    //     isYearly: isYearly.toString()
    //   }
    // });

    // Mock Razorpay order for development
    const mockOrder = {
      id: `order_${Date.now()}`,
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user._id.toString(),
        plan,
        isYearly: isYearly.toString()
      }
    };

    res.json({
      orderId: mockOrder.id,
      amount: amount,
      currency: 'INR',
      keyId: PAYMENT_CONFIG.razorpay.keyId
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

// Confirm payment and activate subscription
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethod, plan, isYearly } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // In production, verify payment with payment provider
    // const stripe = require('stripe')(PAYMENT_CONFIG.stripe.secretKey);
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Mock payment verification for development
    const paymentVerified = true; // Always true in development

    if (!paymentVerified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Create premium subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (isYearly ? 12 : 1));

    const subscription = new PremiumSubscription({
      user: user._id,
      plan,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      paymentMethod,
      monthlyPrice: PLAN_PRICING[plan].monthly,
      yearlyPrice: PLAN_PRICING[plan].yearly,
      features: getPlanFeatures(plan),
      boostsAvailable: getPlanBoosts(plan),
      paymentIntentId
    });

    await subscription.save();

    // Update user premium status
    user.isPremium = true;
    user.premiumPlan = plan;
    user.boostsAvailable = getPlanBoosts(plan);
    
    // Enable premium features for user
    const features = getPlanFeatures(plan);
    features.forEach(feature => {
      if (user.premiumFeatures[feature] !== undefined) {
        user.premiumFeatures[feature] = true;
      }
    });

    await user.save();

    res.json({
      success: true,
      subscription,
      user: {
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumFeatures: user.premiumFeatures,
        boostsAvailable: user.boostsAvailable
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: "Error confirming payment" });
  }
};

// Handle webhook from payment providers
exports.handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    // In production, verify webhook signature
    // if (sig) {
    //   event = stripe.webhooks.constructEvent(req.body, sig, PAYMENT_CONFIG.stripe.webhookSecret);
    // } else {
    //   // Handle other payment providers
    // }

    // Mock webhook handling for development
    event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          metadata: {
            userId: req.body.userId,
            plan: req.body.plan,
            isYearly: req.body.isYearly
          }
        }
      }
    };

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleRecurringPayment(event.data.object);
        break;
      default:
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ message: "Error handling webhook" });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const subscription = await PremiumSubscription.findOne({
      user: user._id,
      status: "ACTIVE"
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    // Update subscription status
    subscription.status = "CANCELLED";
    subscription.autoRenew = false;
    await subscription.save();

    // In production, cancel with payment provider
    // const stripe = require('stripe')(PAYMENT_CONFIG.stripe.secretKey);
    // await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      endDate: subscription.endDate
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: "Error cancelling subscription" });
  }
};

// Get payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = [
      {
        id: 'stripe',
        name: 'Credit/Debit Card',
        type: 'card',
        icon: 'credit-card',
        enabled: true
      },
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'wallet',
        icon: 'paypal',
        enabled: true
      },
      {
        id: 'razorpay',
        name: 'Razorpay',
        type: 'wallet',
        icon: 'razorpay',
        enabled: true
      }
    ];

    res.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: "Error fetching payment methods" });
  }
};

// Helper functions
function getPlanFeatures(plan) {
  const features = {
    BASIC: ['customEmojis', 'largerUploads', 'prioritySupport', 'earlyAccess'],
    PREMIUM: ['animatedAvatar', 'customBanner', 'profileThemes', 'customEmojis', 'largerUploads', 'hdStreaming', 'prioritySupport'],
    ULTIMATE: ['animatedAvatar', 'customBanner', 'profileThemes', 'customEmojis', 'largerUploads', 'hdStreaming', 'prioritySupport', 'customProfileUrl', 'earlyAccess']
  };
  return features[plan] || [];
}

function getPlanBoosts(plan) {
  const boosts = {
    BASIC: 2,
    PREMIUM: 5,
    ULTIMATE: 10
  };
  return boosts[plan] || 0;
}

async function handleSuccessfulPayment(paymentIntent) {
  try {
    const { userId, plan, isYearly } = paymentIntent.metadata;
    
    // Process successful payment
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (isYearly === 'true' ? 12 : 1));

    await PremiumSubscription.findOneAndUpdate(
      { user: userId, status: 'ACTIVE' },
      {
        status: 'ACTIVE',
        endDate,
        lastPaymentDate: new Date()
      }
    );
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(paymentIntent) {
  try {
    const { userId } = paymentIntent.metadata;
    
    // Process failed payment
    await PremiumSubscription.findOneAndUpdate(
      { user: userId, status: 'ACTIVE' },
      { status: 'PAYMENT_FAILED' }
    );
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function handleRecurringPayment(invoice) {
  try {
    const { subscription } = invoice;
    
    // Process recurring payment
    await PremiumSubscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription },
      {
        status: 'ACTIVE',
        lastPaymentDate: new Date()
      }
    );
  } catch (error) {
    console.error('Error handling recurring payment:', error);
  }
}
