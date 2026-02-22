import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AlertCircle,
  Plus,
  X,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Loader,
  Trash2,
  Image as ImageIcon,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import CustomDropdown from "./CustomDropdown";

const LostFoundPage = ({ isSidebarOpen, currentUser, token }) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "LOST",
    category: "DOCUMENTS",
    image: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    itemName: "",
    color: "",
    distinguishingMarks: "",
  });

  const [responseData, setResponseData] = useState({
    message: "",
    phoneNumber: "",
  });

  const API_URL = "http://localhost:5000/api";
  const categories = [
    "DOCUMENTS",
    "ELECTRONICS",
    "ACCESSORIES",
    "KEYS",
    "CLOTHING",
    "OTHER",
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, selectedType, selectedCategory, selectedStatus]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/lost-found`);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (selectedType !== "ALL") {
      filtered = filtered.filter((p) => p.type === selectedType);
    }

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (selectedStatus !== "ALL") {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.itemName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredPosts(filtered);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please log in to post");
      return;
    }

    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const dataToSend = {
        ...formData,
        image:
          formData.image ||
          `https://via.placeholder.com/300x300?text=${encodeURIComponent(
            formData.type,
          )}`,
      };

      const res = await axios.post(`${API_URL}/lost-found`, dataToSend, config);

      setPosts([res.data, ...posts]);
      setFormData({
        title: "",
        description: "",
        type: "LOST",
        category: "DOCUMENTS",
        image: "",
        location: "",
        date: new Date().toISOString().split("T")[0],
        itemName: "",
        color: "",
        distinguishingMarks: "",
      });
      setShowCreateModal(false);
      alert("Post created successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post");
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please log in to respond");
      return;
    }

    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const res = await axios.post(
        `${API_URL}/lost-found/${selectedPost._id}/responses`,
        responseData,
        config,
      );

      setSelectedPost(res.data);
      setPosts(posts.map((p) => (p._id === res.data._id ? res.data : p)));
      setResponseData({ message: "", phoneNumber: "" });
      setShowResponseModal(false);
      alert("Response added successfully!");
    } catch (err) {
      console.error("Error adding response:", err);
      alert("Failed to add response");
    }
  };

  const handleMarkResolved = async () => {
    if (!currentUser || currentUser._id !== selectedPost.poster._id) {
      alert("Only the poster can mark as resolved");
      return;
    }

    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const res = await axios.put(
        `${API_URL}/lost-found/${selectedPost._id}/status`,
        { status: "RESOLVED" },
        config,
      );

      setSelectedPost(res.data);
      setPosts(posts.map((p) => (p._id === res.data._id ? res.data : p)));
      alert("Post marked as resolved!");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      await axios.delete(`${API_URL}/lost-found/${id}`, config);
      setPosts(posts.filter((p) => p._id !== id));
      setShowDetailModal(false);
      alert("Post deleted successfully!");
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  const canManagePost = (post) => {
    return currentUser && currentUser._id === post.poster._id;
  };

  const getTypeColor = (type) => {
    return type === "LOST"
      ? "bg-red-600/20 text-red-300"
      : "bg-green-600/20 text-green-300";
  };

  const getTypeIcon = (type) => {
    return type === "LOST" ? "❌" : "✅";
  };

  return (
    <div
      className={`flex-1 w-full transition-all duration-300 pt-20 pb-10 overflow-y-auto bg-[#0f172a] ${
        isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
      }`}
    >
      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Post Lost/Found Item
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Type
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={[
                      { value: "LOST", label: "Lost" },
                      { value: "FOUND", label: "Found" },
                    ]}
                    value={formData.type}
                    onChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Category
                  </label>
                  <CustomDropdown
                    colorScheme="amber"
                    options={categories.map((cat) => ({
                      value: cat,
                      label: cat,
                    }))}
                    value={formData.category}
                    onChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Lost Red Backpack"
                  required
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                  placeholder="e.g., Backpack"
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="e.g., Red"
                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Library, Near Gate 2"
                  required
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Distinguishing Marks
                </label>
                <textarea
                  value={formData.distinguishingMarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      distinguishingMarks: e.target.value,
                    })
                  }
                  placeholder="Any unique features..."
                  rows="2"
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Provide details about the item..."
                  required
                  rows="3"
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Response</h2>
              <button
                onClick={() => setShowResponseModal(false)}
                className="p-2 hover:bg-zinc-900 rounded-lg"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <form onSubmit={handleAddResponse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Message
                </label>
                <textarea
                  value={responseData.message}
                  onChange={(e) =>
                    setResponseData({
                      ...responseData,
                      message: e.target.value,
                    })
                  }
                  placeholder="I have information about this item..."
                  required
                  rows="3"
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your Phone Number
                </label>
                <input
                  type="tel"
                  value={responseData.phoneNumber}
                  onChange={(e) =>
                    setResponseData({
                      ...responseData,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="9876543210"
                  required
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden my-8">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-900 rounded-lg transition-colors z-10"
            >
              <X size={24} className="text-white" />
            </button>

            <div className="max-h-96 overflow-y-auto">
              {/* Image */}
              <div className="h-64 bg-zinc-800 flex items-center justify-center text-zinc-600 overflow-hidden">
                {selectedPost.image ? (
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={80} />
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">
                      {selectedPost.title}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                        selectedPost.type,
                      )}`}
                    >
                      {getTypeIcon(selectedPost.type)} {selectedPost.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm">
                      {selectedPost.category}
                    </span>
                    {selectedPost.status === "RESOLVED" && (
                      <span className="px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-sm flex items-center gap-1">
                        <CheckCircle size={14} /> Resolved
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-zinc-400 font-medium mb-2">Details</h3>
                  <div className="space-y-2 text-zinc-300">
                    <p className="flex items-center gap-2">
                      <MapPin size={18} className="text-blue-400" />
                      <strong>Location:</strong> {selectedPost.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={18} className="text-blue-400" />
                      <strong>Date:</strong>{" "}
                      {new Date(selectedPost.date).toLocaleDateString()}
                    </p>
                    {selectedPost.color && (
                      <p className="flex items-center gap-2">
                        <Tag size={18} className="text-blue-400" />
                        <strong>Color:</strong> {selectedPost.color}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-zinc-400 font-medium mb-2">
                    Description
                  </h3>
                  <p className="text-zinc-300">{selectedPost.description}</p>
                </div>

                {selectedPost.distinguishingMarks && (
                  <div>
                    <h3 className="text-zinc-400 font-medium mb-2">
                      Distinguishing Marks
                    </h3>
                    <p className="text-zinc-300">
                      {selectedPost.distinguishingMarks}
                    </p>
                  </div>
                )}

                {/* Poster Info */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-zinc-400 font-medium mb-3">Posted By</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                      {selectedPost.poster.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {selectedPost.poster.name}
                      </p>
                      <p className="text-zinc-500 text-sm">
                        {selectedPost.poster.college}
                      </p>
                    </div>
                  </div>

                  {selectedPost.poster.phoneNumber && (
                    <a
                      href={`tel:${selectedPost.poster.phoneNumber}`}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors w-full justify-center"
                    >
                      <Phone size={18} />
                      {selectedPost.poster.phoneNumber}
                    </a>
                  )}
                </div>

                {/* Responses */}
                {selectedPost.responses &&
                  selectedPost.responses.length > 0 && (
                    <div className="border-t border-white/10 pt-4">
                      <h3 className="text-zinc-400 font-medium mb-3">
                        Responses ({selectedPost.responses.length})
                      </h3>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedPost.responses.map((response, idx) => (
                          <div
                            key={idx}
                            className="bg-zinc-900/50 border border-white/5 rounded-lg p-3"
                          >
                            <p className="text-zinc-300 text-sm">
                              {response.message}
                            </p>
                            {response.phoneNumber && (
                              <a
                                href={`tel:${response.phoneNumber}`}
                                className="text-green-400 text-sm mt-2 flex items-center gap-1 hover:underline"
                              >
                                <Phone size={14} />
                                {response.phoneNumber}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="border-t border-white/10 pt-4 space-y-2">
                  {selectedPost.status === "ACTIVE" && (
                    <button
                      onClick={() => {
                        setShowResponseModal(true);
                      }}
                      className="w-full px-4 py-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Add Response
                    </button>
                  )}

                  {canManagePost(selectedPost) && (
                    <>
                      {selectedPost.status === "ACTIVE" && (
                        <button
                          onClick={handleMarkResolved}
                          className="w-full px-4 py-2 bg-green-600/20 text-green-300 hover:bg-green-600/30 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Mark as Resolved
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleDeletePost(selectedPost._id);
                        }}
                        className="w-full px-4 py-2 bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        Delete Post
                      </button>
                    </>
                  )}
                </div>

                {/* Metadata */}
                <div className="border-t border-white/10 pt-4 flex items-center gap-4 text-sm text-zinc-500">
                  <span>👁️ {selectedPost.views} views</span>
                  <span>
                    📅 {new Date(selectedPost.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <AlertCircle size={32} className="text-red-500" />
            Lost & Found
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Post Item
          </button>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-zinc-600" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Type</label>
              <CustomDropdown
                colorScheme="amber"
                options={[
                  { value: "ALL", label: "All Types" },
                  { value: "LOST", label: "Lost" },
                  { value: "FOUND", label: "Found" },
                ]}
                value={selectedType}
                onChange={setSelectedType}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Category
              </label>
              <CustomDropdown
                colorScheme="amber"
                options={[
                  { value: "ALL", label: "All Categories" },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Status</label>
              <CustomDropdown
                colorScheme="amber"
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "RESOLVED", label: "Resolved" },
                  { value: "ALL", label: "All" },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
              />
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader size={24} className="animate-spin" />
              <span>Loading posts...</span>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle
              size={48}
              className="mx-auto text-zinc-600 mb-4 opacity-50"
            />
            <p className="text-zinc-400 text-lg">No posts found</p>
            <p className="text-zinc-600 text-sm mt-1">
              Try adjusting your filters or create a new post
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post._id}
                onClick={() => {
                  setSelectedPost(post);
                  setShowDetailModal(true);
                }}
                className="group bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10"
              >
                {/* Image */}
                <div className="h-48 bg-zinc-800 flex items-center justify-center text-zinc-600 overflow-hidden group-hover:scale-105 transition-transform relative">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={48} />
                  )}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                      post.type,
                    )}`}
                  >
                    {getTypeIcon(post.type)} {post.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
                      {post.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs font-medium">
                      {post.category}
                    </span>
                    {post.status === "RESOLVED" && (
                      <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs font-medium flex items-center gap-1">
                        <CheckCircle size={12} /> Resolved
                      </span>
                    )}
                  </div>

                  {/* Location & Date */}
                  <div className="text-sm text-zinc-400 space-y-1">
                    <p className="flex items-center gap-2">
                      <MapPin size={14} /> {post.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={14} />{" "}
                      {new Date(post.date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Poster Info */}
                  <div className="border-t border-white/5 pt-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {post.poster.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {post.poster.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {post.responses?.length || 0} responses
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LostFoundPage;
