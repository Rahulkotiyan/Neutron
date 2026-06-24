import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import FeedLayout from "./FeedLayout";
import { API_URL } from "../utils/api";
import { Globe } from "iconoir-react";

const HomePage = ({ refreshTrigger, currentUser, isSidebarOpen }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterTag, setFilterTag] = useState("ALL");
  const [sortBy, setSortBy] = useState("hot");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

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
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      } else {
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

  useEffect(() => {
    fetchGlobalFeed();
  }, [refreshTrigger]);

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];

    let filtered = posts;

    if (filterTag !== "ALL") {
      filtered = filtered.filter((post) => post.tag === filterTag);
    }

    if (sortBy === "new" || sortBy === "recent") {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "hot" || sortBy === "popular") {
      filtered = [...filtered].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    return filtered;
  }, [posts, filterTag, sortBy]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  return (
    <FeedLayout
      posts={filteredPosts}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      loadMore={loadMorePosts}
      sortBy={sortBy}
      setSortBy={setSortBy}
      filterTag={filterTag}
      setFilterTag={setFilterTag}
      currentUser={currentUser}
      isSidebarOpen={isSidebarOpen}
      showCreateModal={showCreateModal}
      setShowCreateModal={setShowCreateModal}
      handlePostCreated={handlePostCreated}
      currentCollege="Global"
      emptyStateIcon={Globe}
      emptyStateTitle="No posts found"
      emptyStateText="Be the first to share something amazing!"
      apiBaseUrl={API_URL}
      onPostUpdate={() => fetchGlobalFeed()}
    />
  );
};

export default HomePage;
