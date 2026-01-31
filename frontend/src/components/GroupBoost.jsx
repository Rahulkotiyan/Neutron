import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Star, 
  Users, 
  MessageSquare, 
  Gift, 
  Zap,
  Crown,
  Sparkles,
  ChevronUp,
  TrendingUp,
  Palette,
  Mic,
  Smile,
  Image,
  X,
  Check
} from 'lucide-react';
import api from '../utils/api';

const GroupBoost = ({ groupId, groupName, currentBoostLevel = 0, onBoostSuccess }) => {
  const [boosting, setBoosting] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostFeatures, setBoostFeatures] = useState({
    storiesPerDay: 0,
    coverColors: 1,
    hasEmojiPack: false,
    hasCustomLogo: false,
    hasVoiceToText: false,
    emojiStatuses: 0,
    customBackgrounds: 0
  });

  useEffect(() => {
    fetchUserStatus();
    calculateBoostFeatures(currentBoostLevel);
  }, [currentBoostLevel]);

  const fetchUserStatus = async () => {
    // No longer needed - all features are free
    setUserStatus({ user: { isPremium: true, boostsAvailable: 999, boostsUsed: 0 } });
  };

  const calculateBoostFeatures = (level) => {
    const features = {
      0: { storiesPerDay: 0, coverColors: 1, hasEmojiPack: false, hasCustomLogo: false, hasVoiceToText: false, emojiStatuses: 0, customBackgrounds: 0 },
      1: { storiesPerDay: 1, coverColors: 1, hasEmojiPack: false, hasCustomLogo: false, hasVoiceToText: false, emojiStatuses: 0, customBackgrounds: 0 },
      2: { storiesPerDay: 2, coverColors: 8, hasEmojiPack: false, hasCustomLogo: false, hasVoiceToText: false, emojiStatuses: 0, customBackgrounds: 0 },
      3: { storiesPerDay: 3, coverColors: 16, hasEmojiPack: false, hasCustomLogo: false, hasVoiceToText: false, emojiStatuses: 0, customBackgrounds: 0 },
      4: { storiesPerDay: 4, coverColors: 16, hasEmojiPack: true, hasCustomLogo: false, hasVoiceToText: false, emojiStatuses: 0, customBackgrounds: 0 },
      5: { storiesPerDay: 5, coverColors: 16, hasEmojiPack: true, hasCustomLogo: true, hasVoiceToText: false, emojiStatuses: 0, customBackgrounds: 0 },
      6: { storiesPerDay: 6, coverColors: 16, hasEmojiPack: true, hasCustomLogo: true, hasVoiceToText: true, emojiStatuses: 0, customBackgrounds: 0 },
      7: { storiesPerDay: 7, coverColors: 16, hasEmojiPack: true, hasCustomLogo: true, hasVoiceToText: true, emojiStatuses: 0, customBackgrounds: 0 },
      8: { storiesPerDay: 8, coverColors: 16, hasEmojiPack: true, hasCustomLogo: true, hasVoiceToText: true, emojiStatuses: 1000, customBackgrounds: 0 },
      9: { storiesPerDay: 9, coverColors: 16, hasEmojiPack: true, hasCustomLogo: true, hasVoiceToText: true, emojiStatuses: 1000, customBackgrounds: 8 },
      10: { storiesPerDay: 10, coverColors: 16, hasEmojiPack: true, hasCustomLogo: true, hasVoiceToText: true, emojiStatuses: 1000, customBackgrounds: 16 }
    };
    setBoostFeatures(features[level] || features[0]);
  };

  const handleBoost = async () => {
    if (currentBoostLevel >= 10) {
      alert('This group is already at maximum boost level!');
      return;
    }

    setBoosting(true);
    try {
      // Simulate successful boost without API call
      const newBoostLevel = currentBoostLevel + 1;
      
      // Update local state
      if (onBoostSuccess) {
        onBoostSuccess({
          group: {
            boostLevel: newBoostLevel,
            boostCount: (currentBoostLevel || 0) + 1
          }
        });
      }
      
      setShowBoostModal(false);
      setBoosting(false);
      
      // Show success message
      alert(`Successfully boosted ${groupName} to level ${newBoostLevel}!`);
    } catch (error) {
      console.error('Error boosting group:', error);
      alert('Error boosting group. Please try again.');
      setBoosting(false);
    }
  };

  const getBoostLevelColor = (level) => {
    const colors = [
      'bg-gray-500',
      'bg-green-500', 
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-gradient-to-r from-purple-500 to-pink-500'
    ];
    return colors[level] || colors[0];
  };

  const getBoostLevelName = (level) => {
    const names = [
      'No Boost',
      'Getting Started',
      'Rising Star', 
      'Community Favorite',
      'Trending',
      'Popular',
      'Supercharged',
      'Elite',
      'Legendary',
      'Epic',
      'Ultimate'
    ];
    return names[level] || 'No Boost';
  };

  const canBoost = currentBoostLevel < 10;

  return (
    <>
      {/* Boost Status Card */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-3 sm:p-4 md:p-6 text-white w-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center">
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 text-blue-400" />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">Server Boost</h3>
          </div>
          <div className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold ${
            currentBoostLevel === 0 ? 'bg-zinc-700 text-zinc-300' :
            currentBoostLevel <= 3 ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
            currentBoostLevel <= 6 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
            currentBoostLevel <= 9 ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' :
            'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30'
          }`}>
            Level {currentBoostLevel}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-zinc-300 mb-2">{getBoostLevelName(currentBoostLevel)}</div>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                currentBoostLevel === 0 ? 'bg-zinc-600' :
                currentBoostLevel <= 3 ? 'bg-green-500' :
                currentBoostLevel <= 6 ? 'bg-blue-500' :
                currentBoostLevel <= 9 ? 'bg-purple-500' :
                'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${(currentBoostLevel / 10) * 100}%` }}
            />
          </div>
          <div className="text-xs text-zinc-500 mt-1">{currentBoostLevel}/10 levels</div>
        </div>

        {/* Current Features */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-2 sm:p-3">
            <div className="flex items-center mb-1">
              <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-zinc-400" />
              <span className="text-xs sm:text-sm text-zinc-300">Stories</span>
            </div>
            <div className="text-sm sm:text-base md:text-lg font-bold text-white">{boostFeatures.storiesPerDay || 0}/day</div>
          </div>
          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-2 sm:p-3">
            <div className="flex items-center mb-1">
              <Palette className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-zinc-400" />
              <span className="text-xs sm:text-sm text-zinc-300">Colors</span>
            </div>
            <div className="text-sm sm:text-base md:text-lg font-bold text-white">{boostFeatures.coverColors || 1}</div>
          </div>
          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-2 sm:p-3">
            <div className="flex items-center mb-1">
              <Smile className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-zinc-400" />
              <span className="text-xs sm:text-sm text-zinc-300">Emoji Pack</span>
            </div>
            <div className="text-sm sm:text-base md:text-lg font-bold text-white">{boostFeatures.hasEmojiPack ? '✓' : '✗'}</div>
          </div>
          <div className="bg-[#0f172a] border border-white/5 rounded-lg p-2 sm:p-3">
            <div className="flex items-center mb-1">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-zinc-400" />
              <span className="text-xs sm:text-sm text-zinc-300">Custom Logo</span>
            </div>
            <div className="text-sm sm:text-base md:text-lg font-bold text-white">{boostFeatures.hasCustomLogo ? '✓' : '✗'}</div>
          </div>
        </div>

        {/* Boost Button */}
        <button
          onClick={() => setShowBoostModal(true)}
          disabled={!canBoost}
          className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all text-xs sm:text-sm border ${
            canBoost
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400'
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed border-zinc-600'
          }`}>
          {canBoost ? (
            <span className="flex items-center justify-center">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="truncate">Boost This Server</span>
            </span>
          ) : (
            'Maximum Level Reached'
          )}
        </button>

        {/* User Boost Status */}
        <div className="mt-2 sm:mt-3 text-center text-xs sm:text-sm">
          <span className="text-zinc-400">
            Free Boosting Enabled
          </span>
        </div>
      </div>

      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-sm sm:max-w-md w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto m-2">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate pr-2">Boost Server</h2>
                <button
                  onClick={() => setShowBoostModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="mb-4 sm:mb-6">
                <div className="text-center mb-3 sm:mb-4">
                  <div className={`inline-flex items-center px-3 py-2 sm:px-4 rounded-full font-semibold text-sm sm:text-base ${
                    currentBoostLevel === 0 ? 'bg-zinc-700 text-zinc-300' :
                    currentBoostLevel <= 3 ? 'bg-green-600/20 text-green-400 border border-green-500/30' :
                    currentBoostLevel <= 6 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' :
                    currentBoostLevel <= 9 ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' :
                    'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="truncate">Current: Level {currentBoostLevel}</span>
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-white/5 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Next Level Benefits:</h3>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center text-xs sm:text-sm">
                      <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-1 sm:mr-2" />
                      <span className="text-zinc-300 truncate">Level {currentBoostLevel + 1} unlocks:</span>
                    </div>
                    {currentBoostLevel < 10 && (() => {
                      const nextFeatures = {
                        0: { storiesPerDay: 1, coverColors: 1 },
                        1: { storiesPerDay: 2, coverColors: 8 },
                        2: { storiesPerDay: 3, coverColors: 16 },
                        3: { storiesPerDay: 4, hasEmojiPack: true },
                        4: { storiesPerDay: 5, hasCustomLogo: true },
                        5: { storiesPerDay: 6, hasVoiceToText: true },
                        6: { storiesPerDay: 7 },
                        7: { storiesPerDay: 8, emojiStatuses: 1000 },
                        8: { storiesPerDay: 9, customBackgrounds: 8 },
                        9: { storiesPerDay: 10, customBackgrounds: 16 }
                      };
                      const next = nextFeatures[currentBoostLevel] || {};
                      return Object.entries(next).map(([feature, value]) => (
                        <div key={feature} className="flex items-center text-xs sm:text-sm text-zinc-400 ml-4 sm:ml-6">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400 mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">
                          {feature === 'storiesPerDay' && `${value} stories per day`}
                          {feature === 'coverColors' && `${value} cover colors`}
                          {feature === 'hasEmojiPack' && 'Custom emoji pack'}
                          {feature === 'hasCustomLogo' && 'Custom server logo'}
                          {feature === 'hasVoiceToText' && 'Voice-to-text conversion'}
                          {feature === 'emojiStatuses' && `${value}+ emoji statuses`}
                          {feature === 'customBackgrounds' && `${value} custom backgrounds`}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleBoost}
                  disabled={boosting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base border border-blue-500 hover:border-blue-400"
                >
                  {boosting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                      <span className="truncate">Boosting...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Rocket className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="truncate">Boost {groupName}</span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowBoostModal(false)}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base border border-zinc-600 hover:border-zinc-500"
                >
                  Cancel
                </button>
              </div>

              {!currentBoostLevel || currentBoostLevel < 10 && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-300">
                    <strong className="block sm:inline text-blue-200">Free Feature:</strong> <span className="block sm:inline">Boost your server to unlock more features!</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupBoost;
