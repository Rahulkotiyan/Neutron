import React, { useRef, useEffect, useState, useCallback } from "react";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import TrendingSection from "./TrendingSection";
import { Hashtag, FireFlame, Clock } from "iconoir-react";

const SkeletonPostCard = () => (
  <div className="border-b border-white/10 px-3 md:px-4 py-2.5 md:py-3 animate-pulse">
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

const DEFAULT_TAGS = [
  { value: "ALL", label: "All" },
  { value: "GENERAL", label: "General" },
  { value: "ANNOUNCEMENT", label: "Notice" },
  { value: "CONFESSION", label: "Anonymous" },
  { value: "MEME", label: "Memes" },
];

const FeedLayout = ({
  posts,
  loading,
  loadingMore,
  hasMore,
  loadMore,
  sortBy,
  setSortBy,
  filterTag,
  setFilterTag,
  currentUser,
  isSidebarOpen,
  showCreateModal,
  setShowCreateModal,
  handlePostCreated,
  currentCollege,
  emptyStateIcon: EmptyIcon,
  emptyStateTitle = "No posts found",
  emptyStateText = "Be the first to share something amazing!",
  tagOptions = DEFAULT_TAGS,
  apiBaseUrl,
  onPostUpdate,
  skeletonCount = 3,
}) => {
  const sentinelRef = useRef(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef(null);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && loadMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    if (!hasMore || loadingMore || !sentinelRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, handleLoadMore]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
    };
    if (showSortDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSortDropdown]);

  if (loading) {
    return (
      <div className="flex w-full h-screen bg-black pt-0">
        <main className={`flex-1 w-full overflow-y-auto no-scrollbar relative z-0 transition-all duration-300 pb-16 md:pb-0 ${isSidebarOpen ? "lg:ml-72" : ""}`}>
          <div className="max-w-3xl mx-auto">
            <div className="pt-3 px-3 md:px-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-20 bg-zinc-800 rounded-full animate-pulse" />
                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-7 w-16 bg-zinc-800 rounded-full animate-pulse flex-shrink-0" />
                  ))}
                </div>
              </div>
            </div>
            {[...Array(skeletonCount)].map((_, i) => <SkeletonPostCard key={i} />)}
          </div>
        </main>
        <aside className="hidden lg:block w-80 border-l border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto no-scrollbar">
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-zinc-800/30 rounded-xl animate-pulse" />
            ))}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-black pt-0">
      <main className={`flex-1 w-full overflow-y-auto no-scrollbar relative z-0 transition-all duration-300 pb-16 md:pb-0 ${isSidebarOpen ? "lg:ml-72" : ""}`}>
        <div className="max-w-3xl mx-auto">
          {/* Feed Controls */}
          <div className="pt-3 px-3 md:px-6 mb-4">
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative flex-shrink-0" ref={sortDropdownRef}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-600 transition-all active:scale-95 min-h-[44px]"
                >
                  {sortBy === "popular" || sortBy === "hot" ? <FireFlame iconSize={14} /> : <Clock iconSize={14} />}
                  {sortBy === "popular" || sortBy === "hot" ? "Hot" : "New"}
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${showSortDropdown ? "rotate-180" : ""}`}>
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-28 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button
                      onClick={() => { setSortBy("popular"); setShowSortDropdown(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2 transition-all active:scale-95 min-h-[44px] ${sortBy === "popular" || sortBy === "hot" ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
                    >
                      <FireFlame iconSize={14} /> Hot
                    </button>
                    <button
                      onClick={() => { setSortBy("recent"); setShowSortDropdown(false); }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2 transition-all active:scale-95 min-h-[44px] ${sortBy === "recent" || sortBy === "new" ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
                    >
                      <Clock iconSize={14} /> New
                    </button>
                  </div>
                )}
              </div>

              {/* Tag Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
                {tagOptions.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => setFilterTag(tag.value)}
                    className={`flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 min-h-[44px] ${
                      filterTag === tag.value
                        ? "bg-zinc-100 text-black shadow-lg"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-0">
            {posts.length > 0 ? (
              posts.map((post, index) => (
                <div
                  key={post._id}
                  className="relative animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    apiBaseUrl={apiBaseUrl}
                    onPostUpdate={onPostUpdate}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-24 px-3 md:px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-6">
                  {EmptyIcon ? <EmptyIcon className="text-zinc-600" iconSize={32} /> : <Hashtag className="text-zinc-600" iconSize={32} />}
                </div>
                <p className="text-xl font-bold text-zinc-400 mb-2">{emptyStateTitle}</p>
                <p className="text-sm text-zinc-600 mb-6">{emptyStateText}</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all active:scale-95 min-h-[44px]"
                >
                  Create First Post
                </button>
              </div>
            )}

            {/* Intersection Sentinel for Infinite Scroll */}
            {hasMore && <div ref={sentinelRef} className="h-4" />}

            {/* Loading More Spinner */}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-zinc-500">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-medium">Loading more...</span>
                </div>
              </div>
            )}

            {/* Load More Button (fallback for prefers-reduced-motion) */}
            {hasMore && !loadingMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full font-medium transition-all flex items-center gap-2 border border-zinc-700 hover:border-zinc-600 text-sm active:scale-95 min-h-[44px]"
                >
                  Load More Posts
                </button>
              </div>
            )}

            {/* No More Posts */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8 text-zinc-500">
                <p className="text-sm">You've reached the end!</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            currentUser={currentUser}
            onClose={() => setShowCreateModal(false)}
            onPostCreated={handlePostCreated}
            college={currentCollege}
            apiBaseUrl={apiBaseUrl}
          />
        )}
      </main>

      {/* Trending Sidebar */}
      <aside className="hidden lg:block w-80 border-l border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto no-scrollbar">
        <TrendingSection posts={posts} currentUser={currentUser} />
      </aside>
    </div>
  );
};

export { SkeletonPostCard };
export default FeedLayout;
