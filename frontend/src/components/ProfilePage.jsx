import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Save,
  Loader,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Users,
  MessageCircle,
  Heart,
  Trash2,
  Calendar,
  Link as LinkIcon,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "./PostCard";
import CustomDropdown from "./CustomDropdown";

const ProfilePage = ({ currentUser, token }) => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const isOwnProfile = !userId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    followers: [],
    following: [],
  });
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    college: "",
    branch: "",
    semester: "",
    year: "",
    city: "",
    state: "",
    phoneNumber: "",
    skills: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = "http://localhost:5000/api";

  // Fetch profile data and stats
  // This will be replaced by the new useEffect hooks added later

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setDeletingPostId(postId);
    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      await axios.delete(`${API_URL}/posts/${postId}`, config);
      setUserPosts(userPosts.filter((post) => post._id !== postId));
      setSuccess("Post deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting post:", err);
      setError(
        err.response?.data?.message || "Failed to delete post. Try again.",
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      const authToken = token || localStorage.getItem("token");
      if (!authToken) {
        setError("Not authenticated. Please log in.");
        setSaving(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      // Convert skills string to array
      const dataToSend = {
        ...formData,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const res = await axios.put(`${API_URL}/profile`, dataToSend, config);

      setFormData({
        name: res.data.name || "",
        college: res.data.college || "",
        branch: res.data.branch || "",
        semester: res.data.semester || "",
        year: res.data.year || "",
        city: res.data.city || "",
        state: res.data.state || "",
        phoneNumber: res.data.phoneNumber || "",
        skills: Array.isArray(res.data.skills)
          ? res.data.skills.join(", ")
          : res.data.skills || "",
        bio: res.data.bio || "",
      });

      setSuccess("Profile updated successfully! 🎉");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(
        err.response?.data?.message || "Failed to update profile. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!isOwnProfile) {
      setFollowLoading(true);
      try {
        const authToken = token || localStorage.getItem("token");
        const config = {
          headers: { Authorization: `Bearer ${authToken}` },
        };

        if (isFollowing) {
          await axios.post(`${API_URL}/profile/${userId}/unfollow`, {}, config);
          setSuccess("Unfollowed successfully");
        } else {
          await axios.post(`${API_URL}/profile/${userId}/follow`, {}, config);
          setSuccess("Followed successfully");
        }

        setIsFollowing(!isFollowing);
        setTimeout(() => setSuccess(""), 3000);
        // Refresh stats
        fetchStats();
      } catch (err) {
        console.error("Error toggling follow:", err);
        setError(
          err.response?.data?.message || "Failed to update follow status.",
        );
        setTimeout(() => setError(""), 3000);
      } finally {
        setFollowLoading(false);
      }
    }
  };

  const fetchStats = async () => {
    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      let endpoint = `${API_URL}/profile/stats`;
      if (userId) {
        endpoint = `${API_URL}/profile/${userId}/stats`;
      }

      const res = await axios.get(endpoint, config);
      setStats(res.data);

      // Check if current user is following this user
      if (userId && currentUser) {
        setIsFollowing(
          res.data.followers?.some((f) => f._id === currentUser._id) || false,
        );
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const authToken = token || localStorage.getItem("token");
      if (!authToken) {
        setError("Not authenticated. Please log in.");
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      let endpoint = `${API_URL}/profile`;
      if (userId) {
        endpoint = `${API_URL}/profile/${userId}`;
      }

      const res = await axios.get(endpoint, config);
      setViewingUser(res.data);

      // Update follow status if viewing another user
      if (userId && res.data.isFollowing !== undefined) {
        setIsFollowing(res.data.isFollowing);
      }

      setFormData({
        name: res.data.name || "",
        college: res.data.college || "",
        branch: res.data.branch || "",
        semester: res.data.semester || "",
        year: res.data.year || "",
        city: res.data.city || "",
        state: res.data.state || "",
        phoneNumber: res.data.phoneNumber || "",
        skills: Array.isArray(res.data.skills)
          ? res.data.skills.join(", ")
          : res.data.skills || "",
        bio: res.data.bio || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPostsForProfile = async () => {
    try {
      const authToken = token || localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      let endpoint = `${API_URL}/posts/user/profile`;
      if (userId) {
        endpoint = `${API_URL}/posts/user/${userId}`;
      }

      const res = await axios.get(endpoint, config);
      setUserPosts(res.data);
    } catch (err) {
      console.error("Error fetching user posts:", err);
    }
  };

  // Update initial useEffect to use new fetch functions
  useEffect(() => {
    fetchUserProfile();
    fetchStats();
    if (activeTab === "posts") {
      fetchUserPostsForProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === "posts") {
      fetchUserPostsForProfile();
    }
  }, [activeTab, userId]);

  if (loading) {
    return (
      <div className="flex-1 mt-16 flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader size={24} className="animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-1 mt-16 flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">
            You must be logged in to view your profile.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 mt-16 min-h-screen bg-[#0f172a] pb-10 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#0f172a]/95 backdrop-blur border-b border-white/10 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {viewingUser?.name || currentUser.name}
            </h1>
            <p className="text-sm text-zinc-500">
              @
              {(viewingUser?.name || currentUser.name)
                ?.toLowerCase()
                .replace(/\s+/g, "_")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header with Stats */}
        <div className="bg-gradient-to-br from-zinc-900/50 to-black/50 rounded-2xl p-6 border border-white/10 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-5xl font-bold ring-4 ring-white/20 flex-shrink-0">
              {(viewingUser?.name || currentUser.name)?.charAt(0).toUpperCase()}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-white">
                  {viewingUser?.name || currentUser.name}
                </h2>
                <p className="text-zinc-400">
                  @
                  {(viewingUser?.name || currentUser.name)
                    ?.toLowerCase()
                    .replace(/\s+/g, "_")}
                </p>
                {formData.bio && (
                  <p className="text-zinc-300 mt-2">{formData.bio}</p>
                )}
              </div>

              {/* Location, College, etc. */}
              <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-4">
                {formData.college && (
                  <div className="flex items-center gap-1">
                    <Briefcase size={16} />
                    {formData.college}
                  </div>
                )}
                {formData.city && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {formData.city}
                  </div>
                )}
                {currentUser.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    Joined{" "}
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-colors cursor-pointer">
                  <div className="text-2xl font-bold text-white">
                    {stats.postsCount}
                  </div>
                  <div className="text-xs text-zinc-400">Posts</div>
                </div>
                <div
                  className="text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-colors cursor-pointer"
                  onClick={() => setActiveTab("followers")}
                >
                  <div className="text-2xl font-bold text-white">
                    {stats.followersCount}
                  </div>
                  <div className="text-xs text-zinc-400">Followers</div>
                </div>
                <div
                  className="text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-colors cursor-pointer"
                  onClick={() => setActiveTab("following")}
                >
                  <div className="text-2xl font-bold text-white">
                    {stats.followingCount}
                  </div>
                  <div className="text-xs text-zinc-400">Following</div>
                </div>
              </div>

              {/* Follow/Unfollow Button for Other Users */}
              {!isOwnProfile && (
                <div className="flex gap-3">
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                      isFollowing
                        ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    } disabled:opacity-50`}
                  >
                    {followLoading ? (
                      <Loader size={18} className="animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck size={18} />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Follow
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate("/chats")}
                    className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                  >
                    <MessageCircle size={18} />
                    Message
                  </button>
                </div>
              )}
              {/* Settings for Own Profile */}
              {isOwnProfile && (
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/chats")}
                    className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                  >
                    <MessageCircle size={18} />
                    Messages
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/10">
          {[
            { id: "about", label: "About" },
            { id: "posts", label: `Posts (${stats.postsCount})` },
            { id: "followers", label: `Followers (${stats.followersCount})` },
            { id: "following", label: `Following (${stats.followingCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "text-blue-400 border-blue-400"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "about" && isOwnProfile && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-3.5 text-zinc-600"
                    />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Education Information */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase size={20} />
                Education Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    College
                  </label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="e.g., AIT Bangalore"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Branch/Department
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Year
                  </label>
                  <CustomDropdown
                    colorScheme="cyan"
                    options={[
                      { value: "", label: "Select Year" },
                      { value: "1st Year", label: "1st Year" },
                      { value: "2nd Year", label: "2nd Year" },
                      { value: "3rd Year", label: "3rd Year" },
                      { value: "4th Year", label: "4th Year" },
                    ]}
                    value={formData.year}
                    onChange={(value) =>
                      setFormData({ ...formData, year: value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Semester
                  </label>
                  <CustomDropdown
                    colorScheme="cyan"
                    options={[
                      { value: "", label: "Select Semester" },
                      ...Array.from({ length: 8 }, (_, i) => ({
                        value: `Sem ${i + 1}`,
                        label: `Semester ${i + 1}`,
                      })),
                    ]}
                    value={formData.semester}
                    onChange={(value) =>
                      setFormData({ ...formData, semester: value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Bangalore"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g., Karnataka"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Skills & Bio */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award size={20} />
                Skills & Bio
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g., Python, React, Node.js, Web Development"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Separate multiple skills with commas
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    rows="4"
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700/50 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* View-only About Section for Other Users */}
        {activeTab === "about" && !isOwnProfile && (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Bio</h3>
              <p className="text-zinc-300">
                {formData.bio || "No bio added yet"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Education Information */}
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Briefcase size={20} />
                  Education
                </h3>
                <div className="space-y-3 text-zinc-300 text-sm">
                  {formData.college && (
                    <div>
                      <span className="text-zinc-400">College:</span>{" "}
                      {formData.college}
                    </div>
                  )}
                  {formData.branch && (
                    <div>
                      <span className="text-zinc-400">Branch:</span>{" "}
                      {formData.branch}
                    </div>
                  )}
                  {formData.year && (
                    <div>
                      <span className="text-zinc-400">Year:</span>{" "}
                      {formData.year}
                    </div>
                  )}
                  {formData.semester && (
                    <div>
                      <span className="text-zinc-400">Semester:</span>{" "}
                      {formData.semester}
                    </div>
                  )}
                  {!formData.college &&
                    !formData.branch &&
                    !formData.year &&
                    !formData.semester && (
                      <div className="text-zinc-500">
                        No education information added yet
                      </div>
                    )}
                </div>
              </div>

              {/* Location & Contact */}
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Location & Contact
                </h3>
                <div className="space-y-3 text-zinc-300 text-sm">
                  {formData.city && (
                    <div>
                      <span className="text-zinc-400">City:</span>{" "}
                      {formData.city}
                    </div>
                  )}
                  {formData.state && (
                    <div>
                      <span className="text-zinc-400">State:</span>{" "}
                      {formData.state}
                    </div>
                  )}
                  {!formData.city && !formData.state && (
                    <div className="text-zinc-500">
                      No location information added yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            {formData.skills && (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award size={20} />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.split(",").map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-200 rounded-full text-sm"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-6">
            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle
                  size={48}
                  className="mx-auto text-zinc-600 mb-4"
                />
                <p className="text-zinc-400">
                  No posts yet. Create your first post!
                </p>
              </div>
            ) : (
              userPosts.map((post) => (
                <div key={post._id} className="relative group">
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    apiBaseUrl={API_URL}
                  />
                  {/* Delete Button Overlay */}
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    disabled={deletingPostId === post._id}
                    className="absolute top-6 right-6 p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-700/50 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete post"
                  >
                    {deletingPostId === post._id ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "followers" && (
          <div className="space-y-4">
            {stats.followers.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">No followers yet</p>
              </div>
            ) : (
              stats.followers.map((follower) => (
                <div
                  key={follower._id}
                  className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                      {follower.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{follower.name}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "following" && (
          <div className="space-y-4">
            {stats.following.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">Not following anyone yet</p>
              </div>
            ) : (
              stats.following.map((followee) => (
                <div
                  key={followee._id}
                  className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                      {followee.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{followee.name}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
