import React, { useState } from "react";
import {
  Award,
  Medal,
  Zap,
  Heart,
  MessageCircle,
  TrendingUp,
} from "lucide-react";

const AwardsBadges = ({ currentUser, postData }) => {
  const [showAwardsModal, setShowAwardsModal] = useState(false);

  // Calculate user achievement badges
  const calculateBadges = () => {
    const badges = [];

    if (!currentUser) return badges;

    // Posts Created Badge
    const totalPosts =
      postData?.filter((p) => p.author?._id === currentUser._id).length || 0;

    if (totalPosts >= 1)
      badges.push({
        id: "starter",
        name: "Starter",
        icon: "🌱",
        color: "from-green-500",
      });
    if (totalPosts >= 10)
      badges.push({
        id: "active",
        name: "Active Member",
        icon: "🔥",
        color: "from-orange-500",
      });
    if (totalPosts >= 50)
      badges.push({
        id: "power_user",
        name: "Power User",
        icon: "⚡",
        color: "from-yellow-500",
      });

    // Engagement Badges
    const totalLikes =
      postData?.reduce((sum, p) => {
        if (p.author?._id === currentUser._id) {
          return sum + (p.likes?.length || 0);
        }
        return sum;
      }, 0) || 0;

    if (totalLikes >= 10)
      badges.push({
        id: "liked",
        name: "Well Liked",
        icon: "❤️",
        color: "from-red-500",
      });
    if (totalLikes >= 100)
      badges.push({
        id: "loved",
        name: "Loved",
        icon: "💖",
        color: "from-pink-500",
      });
    if (totalLikes >= 500)
      badges.push({
        id: "superstar",
        name: "Superstar",
        icon: "⭐",
        color: "from-yellow-500",
      });

    // Comment Engagement Badge
    const totalComments =
      postData?.reduce((sum, p) => {
        return (
          sum +
          (p.comments?.filter((c) => c.user?._id === currentUser._id).length ||
            0)
        );
      }, 0) || 0;

    if (totalComments >= 5)
      badges.push({
        id: "conversationalist",
        name: "Conversationalist",
        icon: "💬",
        color: "from-blue-500",
      });
    if (totalComments >= 50)
      badges.push({
        id: "thought_leader",
        name: "Thought Leader",
        icon: "🧠",
        color: "from-purple-500",
      });

    // Trending Badge
    const trendingPosts =
      postData?.filter((p) => {
        if (p.author?._id === currentUser._id) {
          const score =
            (p.likes?.length || 0) * 2 +
            (p.comments?.length || 0) +
            (p.reposts?.length || 0) * 1.5;
          return score >= 100;
        }
        return false;
      }).length || 0;

    if (trendingPosts >= 1)
      badges.push({
        id: "trending",
        name: "Going Viral",
        icon: "🚀",
        color: "from-red-500",
      });

    // Consistency Badge (randomly awarded for engagement)
    if (totalPosts > 0 && totalLikes > 0 && totalComments > 0) {
      badges.push({
        id: "consistent",
        name: "Consistent",
        icon: "📈",
        color: "from-green-500",
      });
    }

    return badges;
  };

  const badges = calculateBadges();

  // Award types for modal
  const awardTypes = [
    {
      id: "gold",
      name: "Gold Award",
      icon: "🥇",
      description: "Exceptional quality post",
      cost: 500,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      id: "silver",
      name: "Silver Award",
      icon: "🥈",
      description: "Great contribution",
      cost: 250,
      color: "from-gray-300 to-gray-400",
    },
    {
      id: "bronze",
      name: "Bronze Award",
      icon: "🥉",
      description: "Good effort",
      cost: 100,
      color: "from-orange-600 to-orange-700",
    },
    {
      id: "fire",
      name: "Fire Award",
      icon: "🔥",
      description: "Hot content",
      cost: 150,
      color: "from-red-500 to-orange-500",
    },
    {
      id: "heart",
      name: "Heart Award",
      icon: "❤️",
      description: "Shows compassion",
      cost: 100,
      color: "from-red-500 to-pink-500",
    },
    {
      id: "brain",
      name: "Brain Award",
      icon: "🧠",
      description: "Intelligent content",
      cost: 200,
      color: "from-purple-500 to-indigo-500",
    },
  ];

  return (
    <>
      {/* User Badges Display */}
      <div className="space-y-4">
        {/* Achievement Badges Section */}
        {badges.length > 0 && (
          <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
                <Award size={20} className="text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Your Achievements
              </h3>
              <span className="ml-auto bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold">
                {badges.length} badges
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-center group cursor-pointer"
                  title={badge.name}
                >
                  <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform">
                    {badge.icon}
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">Unlocked ✓</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-500 text-center mt-4">
              Keep engaging to unlock more badges!
            </p>
          </div>
        )}

        {/* Awards Store */}
        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                <Medal size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Award This Post
                </h3>
                <p className="text-xs text-zinc-500">Recognize great content</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full">
              <Zap size={14} className="text-purple-400" />
              <span className="text-sm font-bold text-purple-300">
                500 coins
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {awardTypes.map((award) => (
              <button
                key={award.id}
                onClick={() => setShowAwardsModal(true)}
                className={`p-4 bg-gradient-to-br ${award.color} rounded-lg hover:scale-105 transition-all group relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-2xl mb-2 transform group-hover:scale-110 transition-transform relative z-10">
                  {award.icon}
                </div>
                <p className="text-xs font-bold text-white mb-1 relative z-10">
                  {award.name}
                </p>
                <p className="text-[10px] text-white/80 relative z-10">
                  {award.cost} coins
                </p>
              </button>
            ))}
          </div>

          <p className="text-xs text-zinc-500 text-center mt-4">
            💡 Award posts to show appreciation and support quality content
          </p>
        </div>

        {/* Leaderboard Info */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-2xl border border-emerald-500/20 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <TrendingUp
              size={20}
              className="text-emerald-400 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-bold text-emerald-300 mb-1">
                Campus Leaderboard
              </p>
              <p className="text-xs text-emerald-200/70">
                You're ranked in the top 15% of active users. Keep engaging to
                climb higher!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Awards Modal */}
      {showAwardsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
            <h3 className="text-2xl font-bold text-white mb-4">
              Award This Post
            </h3>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {awardTypes.map((award) => (
                <button
                  key={award.id}
                  className="w-full p-4 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/20 border border-white/20 rounded-lg flex items-center justify-between group transition-all"
                  onClick={() => {
                    console.log(`Awarded ${award.name}`);
                    setShowAwardsModal(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{award.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">
                        {award.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {award.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-400">
                      {award.cost}
                    </p>
                    <p className="text-xs text-zinc-500">coins</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAwardsModal(false)}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AwardsBadges;
