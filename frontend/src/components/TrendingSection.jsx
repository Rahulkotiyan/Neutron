import React, { useMemo, memo } from "react";
import { ArrowUp as TrendingUp, Eye, Message, Heart, Trophy } from "iconoir-react";

const TrendingSection = ({ posts, currentUser }) => {
  const trendingTopics = useMemo(() => {
    const topics = {};

    posts.forEach((post) => {
      const words = (post.desc || "").toLowerCase().split(/\s+/);
      const hashtags = words.filter((word) => word.startsWith("#"));

      hashtags.forEach((tag) => {
        topics[tag] = (topics[tag] || 0) + 1;
      });

      // Also count by tag
      if (post.tag) {
        const tagKey = `#${post.tag.toLowerCase()}`;
        topics[tagKey] = (topics[tagKey] || 0) + 1;
      }
    });

    return Object.entries(topics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([topic, count]) => ({ topic, count }));
  }, [posts]);

  const trendingPosts = useMemo(() => {
    return posts
      .map((post) => ({
        ...post,
        score:
          (post.likes?.length || 0) * 2 +
          (post.comments?.length || 0) +
          (post.reposts?.length || 0) * 1.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [posts]);

  return (
    <div className="sticky top-24 space-y-6 p-4">
      {/* Trending Topics */}
      <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:border-white/20 transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg">
            <TrendingUp size={20} className="text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Trending Today</h2>
        </div>

        <div className="space-y-3">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((item, idx) => (
              <div
                key={item.topic}
                className="p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group min-h-[44px]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-blue-400">
                    #{idx + 1} Trending
                  </span>
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full font-medium">
                    {item.count} posts
                  </span>
                </div>
                <p className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  {item.topic.substring(1)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {item.count}K discussions
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">
              No trending topics yet. Start a discussion!
            </p>
          )}
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:border-white/20 transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Trophy size={20} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Top This Week</h2>
        </div>

        <div className="space-y-3">
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post, idx) => (
              <div
                key={post._id}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5 cursor-pointer group min-h-[44px]"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {post.title || post.desc?.substring(0, 50)}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Heart size={12} className="text-red-500" />
                        <span>{post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Message size={12} className="text-blue-500" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={12} className="text-green-500" />
                        <span>{post.score?.toFixed(0) || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">
              No posts yet
            </p>
          )}
        </div>
      </div>

      {/* Premium Features Tip */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/20 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💎</div>
          <div>
            <p className="text-sm font-bold text-blue-300 mb-1">Premium Tips</p>
            <p className="text-xs text-blue-200/70">
              Subscribe to communities to customize your feed and get exclusive
              content from your favorite colleges.
            </p>
          </div>
        </div>
      </div>

      {/* Community Suggestions */}
      <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:border-white/20 transition-all">
        <h3 className="text-sm font-bold text-white mb-4">
          Communities for You
        </h3>
        <div className="space-y-3">
          {[
            " Academic Help",
            " Campus Events",
            " Make Friends",
            " Career Tips",
          ].map((community, idx) => (
            <button
              key={idx}
              className="w-full p-3 bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 rounded-lg transition-all text-left active:scale-95 min-h-[44px]"
            >
              <p className="text-sm font-medium text-white">{community}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-zinc-600 space-y-1 pb-4">
        <p>Help • Terms • Privacy Policy</p>
        <p>© 2024 Neutron - Student Platform</p>
      </div>
    </div>
  );
};

export default memo(TrendingSection);
