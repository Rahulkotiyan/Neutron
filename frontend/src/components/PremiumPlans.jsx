import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Star, 
  Zap, 
  Check, 
  X, 
  Sparkles,
  Gem,
  Shield,
  Rocket,
  Gift,
  Users,
  MessageSquare,
  Video,
  Upload,
  Palette
} from 'lucide-react';
import axios from 'axios';

const PremiumPlans = () => {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchUserStatus();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/premium/plans');
      setPlans(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const response = await axios.get('/api/premium/status');
      setUserStatus(response.data);
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  const handleSubscribe = async (planName) => {
    try {
      setSelectedPlan(planName);
      const response = await axios.post('/api/premium/subscribe', {
        plan: planName,
        paymentMethod: 'CARD',
        isYearly: billingCycle === 'yearly'
      });
      
      // Refresh user status after successful subscription
      await fetchUserStatus();
      setSelectedPlan(null);
      
      // Show success message
      alert('Successfully subscribed to ' + planName + ' plan!');
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error subscribing to plan. Please try again.');
      setSelectedPlan(null);
    }
  };

  const getFeatureIcon = (feature) => {
    const iconMap = {
      animatedAvatar: <Video className="w-4 h-4" />,
      customBanner: <Palette className="w-4 h-4" />,
      profileThemes: <Sparkles className="w-4 h-4" />,
      customEmojis: <MessageSquare className="w-4 h-4" />,
      largerUploads: <Upload className="w-4 h-4" />,
      hdStreaming: <Video className="w-4 h-4" />,
      prioritySupport: <Shield className="w-4 h-4" />,
      customProfileUrl: <Gem className="w-4 h-4" />,
      earlyAccess: <Rocket className="w-4 h-4" />,
      boostsAvailable: <Gift className="w-4 h-4" />
    };
    return iconMap[feature] || <Check className="w-4 h-4" />;
  };

  const getFeatureName = (feature) => {
    const nameMap = {
      animatedAvatar: 'Animated Avatar',
      customBanner: 'Custom Banner',
      profileThemes: 'Profile Themes',
      customEmojis: 'Custom Emojis',
      largerUploads: 'Larger Uploads',
      hdStreaming: 'HD Streaming',
      prioritySupport: 'Priority Support',
      customProfileUrl: 'Custom Profile URL',
      earlyAccess: 'Early Access',
      boostsAvailable: 'Server Boosts'
    };
    return nameMap[feature] || feature;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading premium plans...</div>
      </div>
    );
  }

  // Check if user is already premium
  if (userStatus?.user?.isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">You're Premium!</h2>
            <p className="text-gray-300 mb-4">
              You're currently on the <span className="text-yellow-400 font-semibold">{userStatus.user.premiumPlan}</span> plan.
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">Your Boosts:</h3>
              <p className="text-gray-300">
                {userStatus.user.boostsUsed} / {userStatus.user.boostsAvailable} boosts used
              </p>
            </div>
            <div className="space-y-2">
              {Object.entries(userStatus.user.premiumFeatures).map(([feature, enabled]) => (
                enabled && (
                  <div key={feature} className="flex items-center text-green-400 text-sm">
                    <Check className="w-4 h-4 mr-2" />
                    {getFeatureName(feature)}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Neutron Premium</h1>
          </div>
          <p className="text-xl text-gray-300 mb-8">
            Unlock powerful features and supercharge your Neutron experience
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/10 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-purple-900 font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-purple-900 font-semibold'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Yearly (Save 17%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([planKey, plan]) => (
            <div
              key={planKey}
              className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                planKey === 'PREMIUM' 
                  ? 'border-yellow-400 shadow-2xl shadow-yellow-400/20' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {/* Popular Badge */}
              {planKey === 'PREMIUM' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  {planKey === 'BASIC' && <Gem className="w-8 h-8 text-blue-400 mr-2" />}
                  {planKey === 'PREMIUM' && <Crown className="w-8 h-8 text-yellow-400 mr-2" />}
                  {planKey === 'ULTIMATE' && <Sparkles className="w-8 h-8 text-purple-400 mr-2" />}
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    ${billingCycle === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-400">/month</span>
                  {billingCycle === 'yearly' && (
                    <div className="text-green-400 text-sm mt-1">
                      ${plan.yearlyPrice} billed annually
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mr-3 mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <div className="flex items-center text-gray-300">
                      {getFeatureIcon(feature)}
                      <span className="ml-2">{getFeatureName(feature)}</span>
                    </div>
                  </div>
                ))}
                
                {/* Boosts Info */}
                <div className="flex items-start pt-2 border-t border-white/10">
                  <Gift className="w-5 h-5 text-purple-400 mr-3 mt-0.5" />
                  <div>
                    <div className="text-white font-semibold">{plan.boostsAvailable} Server Boosts</div>
                    <div className="text-gray-400 text-sm">Boost your favorite groups</div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(planKey)}
                disabled={selectedPlan === planKey}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  selectedPlan === planKey
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : planKey === 'PREMIUM'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-900 hover:from-yellow-500 hover:to-orange-500 transform hover:scale-105'
                    : 'bg-white text-purple-900 hover:bg-gray-100'
                }`}
              >
                {selectedPlan === planKey ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  `Get ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Compare Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">Free</th>
                  <th className="text-center py-3 px-4">Basic</th>
                  <th className="text-center py-3 px-4">Premium</th>
                  <th className="text-center py-3 px-4">Ultimate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Custom Emojis</td>
                  <td className="text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Animated Avatar</td>
                  <td className="text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">HD Video Streaming</td>
                  <td className="text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">File Upload Limit</td>
                  <td className="text-center">10MB</td>
                  <td className="text-center">50MB</td>
                  <td className="text-center">100MB</td>
                  <td className="text-center">200MB</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Server Boosts</td>
                  <td className="text-center">0</td>
                  <td className="text-center">2</td>
                  <td className="text-center">5</td>
                  <td className="text-center">10</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Priority Support</td>
                  <td className="text-center"><X className="w-5 h-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPlans;
