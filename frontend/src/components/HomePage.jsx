import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import TrendingSection from "./TrendingSection";
import FeedPreferences from "./FeedPreferences";
import {
  Loader,
  Globe,
  TrendingUp,
  Flame,
  Clock,
  Star,
  Zap,
  Settings,
  Filter,
  ChevronDown,
} from "lucide-react";

const HomePage = ({ refreshTrigger, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState([]);
  const [filterCollege, setFilterCollege] = useState("All");
  const [filterTag, setFilterTag] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState("hot");
  const [showPreferences, setShowPreferences] = useState(false);
  const [feedPreferences, setFeedPreferences] = useState({
    showAds: false,
    hideNSFW: false,
    autoplay: true,
    compactMode: false,
  });

  const API_URL = "http://localhost:5000/api";

  const fetchGlobalFeed = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/posts`;
      const params = [];
      if (filterTag !== "ALL") params.push(`tag=${filterTag}`);
      if (params.length > 0) url += "?" + params.join("&");

      const res = await axios.get(url);
      let sortedPosts = [...res.data];

      // Apply sorting logic
      sortedPosts = applySorting(sortedPosts, sortBy);

      setPosts(sortedPosts);
    } catch (err) {
      console.error("Error fetching global feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const applySorting = (postsToSort, sortType) => {
    const now = new Date();

    switch (sortType) {
      case "hot":
        return postsToSort.sort((a, b) => {
          const scoreA =
            (a.likes?.length || 0) * 2 +
            (a.comments?.length || 0) +
            (a.reposts?.length || 0) * 1.5;
          const scoreB =
            (b.likes?.length || 0) * 2 +
            (b.comments?.length || 0) +
            (b.reposts?.length || 0) * 1.5;
          return scoreB - scoreA;
        });

      case "new":
        return postsToSort.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

      case "top":
        return postsToSort.sort(
          (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
        );

      case "best":
        return postsToSort.sort((a, b) => {
          const totalA =
            (a.likes?.length || 0) -
            (a.dislikes?.length || 0) +
            (a.comments?.length || 0) * 0.5;
          const totalB =
            (b.likes?.length || 0) -
            (b.dislikes?.length || 0) +
            (b.comments?.length || 0) * 0.5;
          return totalB - totalA;
        });

      case "controversial":
        return postsToSort.sort((a, b) => {
          const ratioA = Math.min(
            a.likes?.length || 0,
            a.dislikes?.length || 0
          );
          const ratioB = Math.min(
            b.likes?.length || 0,
            b.dislikes?.length || 0
          );
          return ratioB - ratioA;
        });

      default:
        return postsToSort;
    }
  };

  const fetchColleges = async () => {
    try {
      // Mock colleges if endpoint fails or doesn't exist yet
      setColleges(["Global", "MIT", "Stanford", "IIT Bombay", "IIT Delhi"]);
      // const res = await axios.get(`${API_URL}/posts/colleges/list`);
      // setColleges(res.data);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  };

  useEffect(() => {
    fetchGlobalFeed();
    fetchColleges();
  }, [refreshTrigger, filterTag, filterCollege, sortBy]);

  const filteredPosts =
    filterCollege === "All"
      ? posts
      : posts.filter((post) => post.college === filterCollege);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  const tags = [
    "ALL",
    "ANNOUNCEMENT",
    "MEME",
    "QUESTION",
    "LOST_FOUND",
    "OFFICIAL",
    "EVENT",
    "GENERAL",
    "CONFESSION",
  ];

  return (
    <div className="flex w-full min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 pt-24">
      {/* Main Feed */}
      <main className="flex-1 w-full overflow-y-auto no-scrollbar relative z-0">
        <div className="max-w-3xl mx-auto">
          {/* Premium Create Post Section */}

          {/* Feed Controls Bar */}
          <div className="px-4 md:px-6 mb-8 space-y-5">
            {/* Level 1: Sorting Options - Premium Pill Design */}
            <div className="flex gap-2 md:gap-3 overflow-x-auto overflow-y-hidden pb-3 no-scrollbar -mx-4 md:mx-0 px-4 md:px-0 touch-pan-x">
              {[
                { value: "hot", label: "Hot", icon: Flame },
                { value: "new", label: "New", icon: Clock },
                { value: "top", label: "Top", icon: TrendingUp },
                { value: "best", label: "Best", icon: Star },
                { value: "controversial", label: "Controversial", icon: Zap },
              ].map((option) => {
                const Icon = option.icon;
                const isActive = sortBy === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`relative flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-2xl text-xs md:text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 group flex-shrink-0 ${
                      isActive
                        ? "text-white shadow-2xl shadow-blue-600/50"
                        : "text-zinc-300 hover:text-white"
                    }`}
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                        : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                      backdropFilter: "blur(10px)",
                      border: isActive
                        ? "1px solid rgba(59, 130, 246, 0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className={`transition-transform duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">
                      {option.label.slice(0, 3)}
                    </span>
                    {isActive && (
                      <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-2xl text-xs md:text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 flex-shrink-0 ${
                  showPreferences
                    ? "text-white shadow-2xl shadow-purple-600/50"
                    : "text-zinc-300 hover:text-white"
                }`}
                style={{
                  background: showPreferences
                    ? "linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                  backdropFilter: "blur(10px)",
                  border: showPreferences
                    ? "1px solid rgba(147, 51, 234, 0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Settings size={18} />
                <span className="hidden sm:inline">More</span>
              </button>
            </div>

            {/* Level 2: Tag Filter - Modern Segmented Design */}
            <div
              className="relative p-1.5 rounded-2xl backdrop-blur-md"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  "ALL",
                  "ANNOUNCEMENT",
                  "MEME",
                  "QUESTION",
                  "LOST_FOUND",
                  "OFFICIAL",
                  "EVENT",
                  "GENERAL",
                ].map((tag, idx) => {
                  const isActive = filterTag === tag;
                  const colors = [
                    "from-blue-500 to-cyan-500",
                    "from-red-500 to-pink-500",
                    "from-purple-500 to-pink-500",
                    "from-yellow-500 to-orange-500",
                    "from-amber-500 to-orange-500",
                    "from-green-500 to-emerald-500",
                    "from-indigo-500 to-blue-500",
                    "from-teal-500 to-cyan-500",
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={`relative px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                        isActive
                          ? "text-white shadow-lg"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, var(--tw-gradient-stops))`
                          : "transparent",
                        "--tw-gradient-stops": isActive
                          ? `var(--color-start), var(--color-end)`
                          : undefined,
                        "--color-start": isActive
                          ? color.split(" ")[1]?.match(/\d+/)
                            ? "#3b82f6"
                            : "#3b82f6"
                          : "transparent",
                        "--color-end": isActive
                          ? color.split(" ")[3]?.match(/\d+/)
                            ? "#0ea5e9"
                            : "#0ea5e9"
                          : "transparent",
                      }}
                    >
                      {isActive && (
                        <div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${color} opacity-100 -z-10`}
                          style={{ filter: "blur(8px)" }}
                        ></div>
                      )}
                      <span className="relative">
                        {tag === "ANNOUNCEMENT" && "📢 "}
                        {tag === "MEME" && "😂 "}
                        {tag === "QUESTION" && "❓ "}
                        {tag === "LOST_FOUND" && "🔍 "}
                        {tag === "OFFICIAL" && "✓ "}
                        {tag === "EVENT" && "🎪 "}
                        {tag === "GENERAL" && "💬 "}
                        {tag === "ALL" && "🌟 "}
                        {tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level 3: College Filter - Modern Chip Design */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2">
                Choose College
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["All", ...colleges].map((college, idx) => {
                  const isActive = filterCollege === college;
                  const collegeEmojis = {
                    All: "🌍",
                    Global: "🌐",
                    MIT: "🎓",
                    Stanford: "🏫",
                    "IIT Bombay": "🔥",
                    "IIT Delhi": "⚡",
                  };
                  const emoji = collegeEmojis[college] || "🏢";

                  return (
                    <button
                      key={college}
                      onClick={() => setFilterCollege(college)}
                      className={`relative group flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                        isActive
                          ? "text-white shadow-xl"
                          : "text-zinc-400 hover:text-white"
                      }`}
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                          : "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
                        backdropFilter: "blur(12px)",
                        border: isActive
                          ? "2px solid rgba(16, 185, 129, 0.6)"
                          : "1.5px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      {/* Glow effect */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-400 opacity-20 -z-10 blur-xl"></div>
                      )}

                      {/* Content */}
                      <span className="text-lg">{emoji}</span>
                      <span className="relative">{college}</span>

                      {/* Animated underline on hover */}
                      <div
                        className={`absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? "w-full bg-white/50"
                            : "w-0 group-hover:w-1/2 bg-white/30"
                        }`}
                      ></div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feed Preferences Panel */}
          {showPreferences && (
            <div className="px-4 md:px-6 mb-6">
              <FeedPreferences
                preferences={feedPreferences}
                onPreferencesChange={setFeedPreferences}
              />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-96 text-zinc-500 gap-3">
              <Loader className="animate-spin text-blue-500" size={40} />
              <p className="text-base font-medium">Loading Premium Feed...</p>
              <p className="text-sm text-zinc-600">
                Fetching the best posts for you
              </p>
            </div>
          )}

          {/* Posts Feed */}
          {!loading && (
            <>
              <div className="px-4 md:px-6 space-y-6 pb-24">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, index) => (
                    <div
                      key={post._id}
                      className="relative animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      {/* College Badge */}
                      {post.college && post.college !== "Global" && (
                        <div className="absolute -top-3 right-6 z-10">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-blue-400/30 text-blue-300 text-xs font-bold rounded-full shadow-lg">
                            {post.college}
                          </span>
                        </div>
                      )}
                      <PostCard
                        post={post}
                        currentUser={currentUser}
                        apiBaseUrl={API_URL}
                        onPostUpdate={() => fetchGlobalFeed()}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-6">
                      <Globe className="text-zinc-600" size={32} />
                    </div>
                    <p className="text-xl font-bold text-zinc-400 mb-2">
                      No posts found
                    </p>
                    <p className="text-sm text-zinc-600 mb-6">
                      {filterCollege === "All"
                        ? "Be the first to share something amazing!"
                        : `No posts from ${filterCollege} yet. Start a conversation!`}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
                    >
                      Create First Post
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              {filteredPosts.length > 0 && (
                <div className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-xl border-t border-white/5 p-4 flex items-center justify-center gap-6 text-sm text-zinc-500">
                  <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                    <Flame size={16} className="text-orange-500" />
                    <span>{filteredPosts.length} Hot Posts</span>
                  </div>
                  <div className="h-4 w-px bg-white/10"></div>
                  <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                    <Globe size={16} className="text-blue-500" />
                    <span>
                      {filterCollege === "All"
                        ? `${colleges.length} colleges active`
                        : filterCollege}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-white/10"></div>
                  <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                    <TrendingUp size={16} className="text-green-500" />
                    <span>
                      {filteredPosts.reduce(
                        (acc, p) => acc + (p.likes?.length || 0),
                        0
                      )}{" "}
                      Total Upvotes
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Create Post Modal */}
          {showCreateModal && (
            <CreatePostModal
              currentUser={currentUser}
              onClose={() => setShowCreateModal(false)}
              onPostCreated={handlePostCreated}
              college="Global"
              apiBaseUrl={API_URL}
            />
          )}
        </div>
      </main>

      {/* Trending Sidebar - Hidden on mobile, visible on md+ */}
      <aside className="hidden lg:block w-80 border-l border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto no-scrollbar">
        <TrendingSection posts={posts} currentUser={currentUser} />
      </aside>
    </div>
  );
};

export default HomePage;
