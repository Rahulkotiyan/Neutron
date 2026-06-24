import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import FeedLayout from "./FeedLayout";
import { API_URL } from "../utils/api";
import { DEFAULT_COLLEGE, ALLOW_PUBLIC_FEED_ACCESS } from "../config";
import { GraduationCap } from "iconoir-react";

const FeedPage = ({ user, pageType, collegeName, currentUser, isSidebarOpen }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterTag, setFilterTag] = useState("ALL");
  const [sortBy, setSortBy] = useState("popular");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const isPublic = !user && !currentUser && ALLOW_PUBLIC_FEED_ACCESS;

  const fetchCollegeFeed = async (cursor = null, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let url;
      if (isPublic) {
        url = `${API_URL}/posts/global`;
      } else {
        const college = user?.college || currentUser?.college || collegeName || DEFAULT_COLLEGE;
        url = `${API_URL}/posts/college/${college}`;
      }
      const params = [];

      if (cursor) params.push(`cursor=${cursor}`);

      if (params.length > 0) url += "?" + params.join("&");

      const res = await axios.get(url);
      const { posts: newPosts, hasMore: moreAvailable, nextCursor: newCursor } = res.data;

      if (append) {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(moreAvailable);
      setNextCursor(newCursor);
    } catch (err) {
      console.error("Error fetching college feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (hasMore && nextCursor && !loadingMore) {
      fetchCollegeFeed(nextCursor, true);
    }
  };

  const handlePostCreated = () => {
    fetchCollegeFeed();
  };

  useEffect(() => {
    fetchCollegeFeed();
  }, [pageType, collegeName, user?.college, currentUser?.college]);

  const displayedPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];

    let filtered = posts;

    filtered = filtered.filter((post) => {
      if (post.moderation_status === "REMOVED") return false;
      if (post.moderation_status === "FLAGGED" && !currentUser?.isAdmin) return false;
      return true;
    });

    if (filterTag !== "ALL") {
      filtered = filtered.filter((post) => post.tag === filterTag);
    }

    if (sortBy === "recent") {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "popular") {
      filtered = [...filtered].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    return filtered;
  }, [posts, filterTag, sortBy, currentUser?.isAdmin]);

  const currentCollege = user?.college || currentUser?.college || collegeName || DEFAULT_COLLEGE;

  return (
    <FeedLayout
      posts={displayedPosts}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      loadMore={loadMorePosts}
      sortBy={sortBy}
      setSortBy={setSortBy}
      filterTag={filterTag}
      setFilterTag={setFilterTag}
      currentUser={currentUser || user}
      isSidebarOpen={isSidebarOpen}
      showCreateModal={showCreateModal}
      setShowCreateModal={setShowCreateModal}
      handlePostCreated={handlePostCreated}
      currentCollege={currentCollege}
      emptyStateIcon={GraduationCap}
      emptyStateTitle={filterTag === "ALL" ? "No posts found" : `No ${filterTag.toLowerCase()} posts`}
      emptyStateText={filterTag === "ALL" ? "Be the first to share something amazing!" : `No posts found for ${filterTag.toLowerCase()}`}
      apiBaseUrl={API_URL}
      onPostUpdate={() => fetchCollegeFeed()}
    />
  );
};

export default FeedPage;
