import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import TrendingSection from "./TrendingSection";
import {
  Globe,
  GraphUp,
  FireFlame,
  Clock,
  Star,
  Settings,
  Filter,
  ArrowDown,
  MoreHoriz,
  X,
} from "iconoir-react";

const SkeletonPostCard = () => (
  <div className="bg-black/40 rounded-xl border border-white/10 p-3 sm:p-5 shadow-lg mb-4 sm:mb-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-32" />
        <div className="h-2.5 bg-zinc-800/50 rounded w-24" />
      </div>
    </div>
    <div className="space-y-2.5 mb-4">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800/50 rounded w-full" />
      <div className="h-3 bg-zinc-800/50 rounded w-5/6" />
    </div>
    <div className="h-40 sm:h-48 bg-zinc-800/30 rounded-lg mb-4" />
    <div className="flex gap-2">
      <div className="h-8 bg-zinc-800 rounded-full w-16" />
      <div className="h-8 bg-zinc-800 rounded-full w-16" />
      <div className="h-8 bg-zinc-800 rounded-full w-16" />
    </div>
  </div>
);

const HomePage = ({ refreshTrigger, currentUser, isSidebarOpen }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [filterCollege, setFilterCollege] = useState("All");
  const [filterTag, setFilterTag] = useState("ALL");
  const [sortBy, setSortBy] = useState("hot");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const moreFiltersRef = useRef(null);

  const API_URL = "http://localhost:5000/api";

  const fetchGlobalFeed = async (cursor = null, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let url = `${API_URL}/posts/global`;
      const params = [];

      if (cursor) params.push(`cursor=${cursor}`);

      if (params.length > 0) url += "?" + params.join("&");

      const res = await axios.get(url);
      const { posts: newPosts, hasMore: moreAvailable, nextCursor: newCursor } = res.data;

      if (append) {
        // Append new posts for infinite scroll
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      } else {
        // Replace posts for initial load or filter change
        setPosts(newPosts);
      }

      setHasMore(moreAvailable);
      setNextCursor(newCursor);
    } catch (err) {
      console.error("Error fetching global feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (hasMore && nextCursor && !loadingMore) {
      fetchGlobalFeed(nextCursor, true);
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

  // Close more filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        moreFiltersRef.current &&
        !moreFiltersRef.current.contains(event.target)
      ) {
        setShowMoreFilters(false);
      }
    };

    if (showMoreFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoreFilters]);

  useEffect(() => {
    fetchGlobalFeed();
    fetchColleges();
  }, [refreshTrigger]);

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];

    let filtered = posts;

    if (filterTag !== "ALL") {
      filtered = filtered.filter((post) => post.tag === filterTag);
    }

    if (sortBy === "new") {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    } else if (sortBy === "hot") {
      filtered = [...filtered].sort(
        (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0),
      );
    }

    return filtered;
  }, [posts, filterTag, sortBy]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  const handleUserUpdate = (updatedUser) => {
    // This would typically update the user context or state
    // For now, we'll just trigger a re-render by updating a dummy state
  };

  const tags = ["ALL", "GENERAL", "ANNOUNCEMENT", "MEME", "CONFESSION"];

  return (
    <div className="flex w-full bg-black pt-0">
      {/* Main Feed */}
      <main
        className={`flex-1 w-full overflow-y-auto no-scrollbar relative z-0 transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-72" : ""
        }`}
      >
        <div className="max-w-3xl mx-auto pt-3">
          {/* Premium Create Post Section */}

          {/* Feed Controls Bar */}
          <div className="px-4 md:px-6 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Hot/New Toggle */}
              <div className="flex gap-1.5 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
                <button
                  onClick={() => setSortBy("hot")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    sortBy === "hot"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                   Hot
                </button>
                <button
                  onClick={() => setSortBy("new")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    sortBy === "new"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                   New
                </button>
              </div>

              {/* Tag Filters - Same Row, Same Style */}
              <div className="flex flex-wrap gap-1 bg-zinc-900/50 p-0.5 rounded-full border border-zinc-800">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      filterTag === tag
                        ? "bg-zinc-100 text-black shadow-lg"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {tag === "ALL" ? "All" : 
                     tag === "GENERAL" ? "General" :
                     tag === "ANNOUNCEMENT" ? "Notice" :
                     tag === "MEME" ? "Memes" :
                     tag === "CONFESSION" ? "Anonymous" : tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="px-4 md:px-6 space-y-6">
              {[...Array(3)].map((_, i) => <SkeletonPostCard key={i} />)}
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
                      <PostCard
                        post={post}
                        currentUser={currentUser}
                        apiBaseUrl={API_URL}
                        onPostUpdate={() => fetchGlobalFeed()}
                        onUserUpdate={handleUserUpdate}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-6">
                      <Globe className="text-zinc-600" iconSize={32} />
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

                {/* Load More Button */}
                {hasMore && !loading && (
                  <div className="flex justify-center py-8">
                    <button
                      onClick={loadMorePosts}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-full font-medium transition-all flex items-center gap-2 border border-zinc-700 hover:border-zinc-600"
                    >
                      {loadingMore ? (
                        <span className="text-zinc-400">Loading more...</span>
                      ) : (
                        <>
                          Load More Posts
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* No More Posts Message */}
                {!hasMore && filteredPosts.length > 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    <p className="text-sm">You've reached the end!</p>
                  </div>
                )}
              </div>
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
