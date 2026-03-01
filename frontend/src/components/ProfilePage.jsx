import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  User,
  ArrowLeft,
  FloppyDisk,
  Refresh,
  Mail,
  Phone,
  MapPin,
  Building,
  Medal,
  Group,
  Message,
  Heart,
  Trash,
  Calendar,
  Link as LinkIcon,
  UserPlus,
  UserBadgeCheck,
  Edit,
  Send,
  OpenInBrowser,
  OpenBook,
  Page,
  Eye,
  Bookmark,
  ArrowUp,
  ArrowDown,
  Bell,
  ArrowRight,
  Camera,
  Search,
} from "iconoir-react";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "./PostCard";
import CustomDropdown from "./CustomDropdown";
import CustomModal from "./CustomModal";

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
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
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
    city: "",
    state: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    skills: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  // New State for Upgrade
  const [isEditMode, setIsEditMode] = useState(false);
  const [userActivity, setUserActivity] = useState({
    likedPosts: [],
    dislikedPosts: [],
    comments: [],
    savedPosts: [],
  });
  const [userContent, setUserContent] = useState({
    posts: [],
    notes: [],
    notices: [],
    confessions: [],
  });
  const [activitySubTab, setActivitySubTab] = useState("liked");
  const [contentSubTab, setContentSubTab] = useState("posts");
  const [tabLoading, setTabLoading] = useState(false);

  const API_URL = "http://localhost:5000/api";

  // Fetch profile data and stats
  // This will be replaced by the new useEffect hooks added later

  const handleDeletePost = async (postId) => {
    setModalConfig({
      isOpen: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this post?",
      type: "confirm",
      onConfirm: async () => {
        try {
          const authToken = token || localStorage.getItem("token");
          const config = {
            headers: { Authorization: `Bearer ${authToken}` },
          };

          await axios.delete(`${API_URL}/posts/${postId}`, config);
          setUserPosts(userPosts.filter((post) => post._id !== postId));
          setModalConfig({
            isOpen: true,
            title: "Deleted",
            message: "Post deleted successfully",
            type: "success",
          });
        } catch (err) {
          console.error("Error deleting post:", err);
          setModalConfig({
            isOpen: true,
            title: "Error",
            message: "Failed to delete post",
            type: "error",
          });
        }
      },
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "avatar") {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
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

      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "skills") {
          const skillsArray = (formData.skills || "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
          skillsArray.forEach((skill) =>
            formDataToSend.append("skills[]", skill),
          );
        } else {
          formDataToSend.append(key, formData[key] || "");
        }
      });

      if (avatarFile) formDataToSend.append("avatar", avatarFile);
      if (bannerFile) formDataToSend.append("banner", bannerFile);

      const config = {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const res = await axios.put(`${API_URL}/profile`, formDataToSend, config);

      setFormData({
        name: res.data.name || "",
        college: res.data.college || "",
        branch: res.data.branch || "",
        semester: res.data.semester || "",
        city: res.data.city || "",
        state: res.data.state || "",
        phoneNumber: res.data.phoneNumber || "",
        email: res.data.email || "",
        dateOfBirth: res.data.dateOfBirth || "",
        skills: Array.isArray(res.data.skills)
          ? res.data.skills.join(", ")
          : res.data.skills || "",
        bio: res.data.bio || "",
      });

      setModalConfig({
        isOpen: true,
        title: "Profile Updated",
        message: "Update Successful! Redirecting to your profile.",
        type: "success",
      });

      // Navigate to viewable profile or just turn off edit mode
      setTimeout(() => {
        setModalConfig({
          isOpen: false,
          title: "",
          message: "",
          type: "info",
          onConfirm: null,
        });
        setIsEditMode(false);
        // If we were on /profile/edit or similar, we could navigate,
        // but here we just toggle the state to show the "Viewable" profile
        if (userId) {
          navigate(`/profile/${userId}`);
        } else {
          navigate(`/profile`);
        }
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      setModalConfig({
        isOpen: true,
        title: "Update Failed",
        message: "Failed to update profile",
        type: "error",
      });
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
        city: res.data.city || "",
        state: res.data.state || "",
        phoneNumber: res.data.phoneNumber || "",
        email: res.data.email || "",
        dateOfBirth: res.data.dateOfBirth || "",
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

  const fetchUserActivity = async () => {
    setTabLoading(true);
    try {
      const authToken = token || localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const endpoint = userId
        ? `${API_URL}/profile/activity/${userId}`
        : `${API_URL}/profile/activity`;
      const res = await axios.get(endpoint, config);
      setUserActivity(
        res.data || {
          likedPosts: [],
          dislikedPosts: [],
          comments: [],
          savedPosts: [],
        },
      );
    } catch (err) {
      console.error("Error fetching activity:", err);
      setError("Failed to sync activity logs.");
    } finally {
      setTabLoading(false);
    }
  };

  const fetchUserContent = async () => {
    setTabLoading(true);
    try {
      const authToken = token || localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const endpoint = userId
        ? `${API_URL}/profile/content/${userId}`
        : `${API_URL}/profile/content`;
      const res = await axios.get(endpoint, config);
      setUserContent(
        res.data || { posts: [], notes: [], notices: [], confessions: [] },
      );
    } catch (err) {
      console.error("Error fetching content:", err);
      setError("Failed to retrieve content archive.");
    } finally {
      setTabLoading(false);
    }
  };

  // Update initial useEffect to use new fetch functions
  useEffect(() => {
    fetchUserProfile();
    fetchStats();
    if (activeTab === "posts") fetchUserPostsForProfile();
    if (activeTab === "activity") fetchUserActivity();
    if (activeTab === "content") fetchUserContent();
  }, [userId]);

  useEffect(() => {
    if (activeTab === "posts") fetchUserPostsForProfile();
    if (activeTab === "activity") fetchUserActivity();
    if (activeTab === "content") fetchUserContent();
  }, [activeTab, userId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#070708]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
            Loading
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#070708]">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">
            You must be logged in to view your profile.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-black pb-10 overflow-y-auto selection:bg-white/20 relative no-scrollbar">
      {/* Unified Template Surface - Expanded and Cohesive */}
      <div className="max-w-6xl mx-auto px-0 md:px-6 relative z-10 pt-4 pb-20">
        <div className="relative overflow-hidden glass-main md:rounded-[2.5rem] border-b md:border md:border-white/10 shadow-premium flex flex-col">
          {/* Hero Surface with deep gradient fade */}
          <div className="h-32 md:h-48 bg-[#070708] relative overflow-hidden group/banner">
            <input
              type="file"
              ref={bannerInputRef}
              onChange={(e) => handleFileChange(e, "banner")}
              className="hidden"
              accept="image/*"
            />
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-6 left-6 z-20 p-3 bg-black/40 backdrop-blur-xl hover:bg-white/10 rounded-full transition-all border border-white/10 shadow-2xl"
            >
              <ArrowLeft iconSize={20} className="text-white" />
            </button>

            {isOwnProfile && isEditMode && (
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 z-20 bg-black/40 hover:bg-black/50 flex items-center justify-center transition-all"
              >
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                  <Camera iconSize={24} />
                </div>
              </button>
            )}

            {bannerPreview || viewingUser?.banner ? (
              <img
                src={bannerPreview || viewingUser.banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-[#070708] to-black"></div>
            )}
            {/* Subtle overlay to blend into the profile info area */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
          </div>

          <div className="px-4 md:px-6 pb-4 pt-6 relative z-10 flex flex-col items-center md:items-start">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 mb-6 w-full">
              {/* Avatar Section */}
              <div className="relative -mt-12 md:-mt-10">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={(e) => handleFileChange(e, "avatar")}
                  className="hidden"
                  accept="image/*"
                />
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black border-[6px] border-[#0a0a0a] flex items-center justify-center text-2xl md:text-4xl font-black text-white shadow-premium overflow-hidden relative group/avatar z-30">
                  {avatarPreview || viewingUser?.avatar ? (
                    <img
                      src={avatarPreview || viewingUser.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (viewingUser?.name || currentUser.name)
                      ?.charAt(0)
                      .toUpperCase()
                  )}
                  {isOwnProfile && isEditMode && (
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-white/20 backdrop-blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center z-20 cursor-pointer"
                    >
                      <Camera iconSize={32} className="text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Alignment - Horizontal next to avatar */}
              <div className="flex gap-8 md:gap-6 mb-2">
                <div
                  onClick={() => setActiveTab("followers")}
                  className="cursor-pointer group/stat flex flex-col items-center md:items-start"
                >
                  <div className="text-xl md:text-2xl font-black text-white group-hover/stat:text-white/80 transition-colors">
                    {stats.followersCount}
                  </div>
                  <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Followers
                  </div>
                </div>
                <div
                  onClick={() => setActiveTab("following")}
                  className="cursor-pointer group/stat flex flex-col items-center md:items-start"
                >
                  <div className="text-xl md:text-2xl font-black text-white group-hover/stat:text-white/80 transition-colors">
                    {stats.followingCount}
                  </div>
                  <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Following
                  </div>
                </div>
              </div>

              {/* Action Buttons - Right side / Full width on mobile */}
              <div className="md:ml-auto mb-2 flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                {!isOwnProfile ? (
                  <button
                    onClick={handleFollowToggle}
                    className={`flex-1 md:flex-none px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                      isFollowing
                        ? "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        : "bg-white text-black hover:bg-white/90 shadow-premium"
                    }`}
                  >
                    {isFollowing ? "Connected" : "Connect"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const next = !isEditMode;
                      setIsEditMode(next);
                      if (next) {
                        setActiveTab("about");
                      }
                    }}
                    className="flex-1 md:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-black text-[10px] uppercase tracking-widest text-white transition-all text-center"
                  >
                    {isEditMode ? "Exit Edit Mode" : "Modify Profile"}
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-3 text-center md:text-left mt-2 md:mt-0">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  {viewingUser?.name}
                </h2>
              </div>
              <p className="text-zinc-500 font-black text-xs md:text-sm tracking-widest italic">
                {viewingUser?.handle || "@" + viewingUser?.username}
              </p>
              <p className="text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed bg-white/2 pb-6 mx-auto md:mx-0">
                {formData.bio || "No description provided."}
              </p>
            </div>

            {/* Integrated Tabs - Stable Full-Width Design */}
            <div className="border-t border-white/5 bg-gradient-to-b from-black/20 to-black/5 px-4 md:px-6">
              <div className="flex gap-8 md:gap-12 overflow-x-auto no-scrollbar py-4">
                {[
                  { id: "about", label: "About" },
                  { id: "posts", label: "Posts" },
                  { id: "activity", label: "Room" },
                  { id: "content", label: "Donations" },
                  { id: "followers", label: "Network" },
                ]
                  .filter((tab) => !isEditMode || tab.id === "about")
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-4 px-1 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${
                        activeTab === tab.id
                          ? "text-white scale-105"
                          : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"></div>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Solid Content Surface */}
            <div className="p-6 md:p-10 bg-gradient-to-b from-black/5 to-transparent">
              {/* Alerts - Refined minimal style */}
              <div className="mb-8 space-y-2">
                {error && (
                  <div className="py-3 px-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-500 text-[9px] font-black uppercase tracking-widest text-center">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white text-[9px] font-black uppercase tracking-widest text-center">
                    {success}
                  </div>
                )}
              </div>

              {/* Overview Tab - Unified Sheet Approach */}
              {activeTab === "about" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                  {isEditMode && isOwnProfile ? (
                    <form onSubmit={handleSave} className="space-y-16">
                      {/* Core Identity Section */}
                      <div className="space-y-10">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                          <User iconSize={20} className="text-zinc-500" />
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                            Core Identity
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Digital Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              External Uplink
                            </label>
                            <input
                              type="text"
                              name="externalLink"
                              value={formData.externalLink || ""}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Academic Records Section */}
                      <div className="space-y-10">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                          <Medal iconSize={20} className="text-zinc-500" />
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                            Academic & Contact Records
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Institution
                            </label>
                            <input
                              type="text"
                              name="college"
                              value={formData.college}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Department
                            </label>
                            <input
                              type="text"
                              name="branch"
                              value={formData.branch}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Semester
                            </label>
                            <CustomDropdown
                              colorScheme="transparent"
                              options={Array.from({ length: 8 }, (_, i) => ({
                                value: `Sem ${i + 1}`,
                                label: `Term 0${i + 1}`,
                              }))}
                              value={formData.semester}
                              onChange={(value) =>
                                setFormData({ ...formData, semester: value })
                              }
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              name="dateOfBirth"
                              value={formData.dateOfBirth}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm [color-scheme:dark]"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              City
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Biography Section */}
                      <div className="space-y-10">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                          <Heart size={20} className="text-zinc-500" />
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                            Biography
                          </h3>
                        </div>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows="4"
                          className="w-full px-0 py-4 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm resize-none"
                          placeholder="Tell the Nexus about yourself..."
                        />
                      </div>

                      <div className="flex justify-end pb-20">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-16 py-5 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center gap-4 shadow-premium active:scale-95"
                        >
                          {saving ? (
                            <Refresh iconSize={20} className="animate-spin" />
                          ) : (
                            <FloppyDisk iconSize={20} />
                          )}
                          Synchronize Core
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                      {/* Left Column - Main Info */}
                      <div className="lg:col-span-8 space-y-16">
                        <div className="space-y-8">
                          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-3">
                            Neural Biography
                          </h3>
                          <p className="text-white text-3xl font-bold tracking-tight leading-relaxed max-w-3xl">
                            {formData.bio ||
                              "No information synced to this terminal."}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 py-8 border-y border-white/5">
                          <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                              Academic Foundation
                            </h3>
                            <div className="space-y-6">
                              {[
                                {
                                  label: "College",
                                  value: formData.college,
                                  icon: <Building iconSize={14} />,
                                },
                                {
                                  label: "Branch",
                                  value: formData.branch,
                                  icon: <OpenBook iconSize={14} />,
                                },
                                {
                                  label: "Semester",
                                  value: formData.semester,
                                  icon: <Calendar iconSize={14} />,
                                },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className="flex flex-col gap-1"
                                >
                                  <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                                    {item.label}
                                  </span>
                                  <span className="text-white font-bold text-lg">
                                    {item.value || "---"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                              Network Access
                            </h3>
                            <div className="space-y-6">
                              {[
                                {
                                  label: "City",
                                  value: formData.city,
                                  icon: <MapPin iconSize={14} />,
                                },
                                {
                                  label: "Mail Uplink",
                                  value: viewingUser?.email,
                                  icon: <Mail iconSize={14} />,
                                },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className="flex flex-col gap-1"
                                >
                                  <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                                    {item.label}
                                  </span>
                                  <span className="text-white font-bold text-lg">
                                    {item.value || "---"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Secondary Stats */}
                      <div className="lg:col-span-4 space-y-16 p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                        <div className="space-y-8">
                          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                            System Specializations
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {formData.skills ? (
                              formData.skills.split(",").map((s, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 border border-white/10 text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded-lg"
                                >
                                  {s.trim()}
                                </span>
                              ))
                            ) : (
                              <p className="text-zinc-700 text-[10px] italic">
                                No records found.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-8">
                          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                            Performance Metrics
                          </h3>
                          <div className="space-y-10">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                Standing
                              </span>
                              <span className="text-white font-black text-2xl tracking-tighter">
                                ELITE
                              </span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                Network Score
                              </span>
                              <span className="text-white font-black text-2xl tracking-tighter">
                                {stats.followersCount + stats.followingCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!isEditMode && (
                <>
                  {/* Posts Tab */}
                  {activeTab === "posts" && (
                    <div className="space-y-6">
                      {userPosts.length === 0 ? (
                        <div className="text-center py-12">
                          <Message
                            iconSize={48}
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
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              disabled={deletingPostId === post._id}
                              className="absolute top-6 right-6 p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-700/50 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete post"
                            >
                              {deletingPostId === post._id ? (
                                <Refresh iconSize={18} className="animate-spin" />
                              ) : (
                                <Trash iconSize={18} />
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Room / Activity Tab */}
                  {activeTab === "activity" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-zinc-900 rounded-xl border border-white/10">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">
                            Liked Posts
                          </p>
                          <p className="text-2xl text-white font-bold">
                            {userActivity.likedPosts?.length || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-xl border border-white/10">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">
                            Disliked Posts
                          </p>
                          <p className="text-2xl text-white font-bold">
                            {userActivity.dislikedPosts?.length || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-xl border border-white/10">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">
                            Comments
                          </p>
                          <p className="text-2xl text-white font-bold">
                            {userActivity.comments?.length || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-xl border border-white/10">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">
                            Saved Posts
                          </p>
                          <p className="text-2xl text-white font-bold">
                            {userActivity.savedPosts?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Donations / Content Tab */}
                  {activeTab === "content" && (
                    <div className="space-y-6">
                      {(!userContent.posts?.length &&
                        !userContent.notes?.length &&
                        !userContent.notices?.length &&
                        !userContent.confessions?.length) ? (
                        <div className="text-center py-12">
                          <Page iconSize={48} className="mx-auto text-zinc-600 mb-4" />
                          <p className="text-zinc-400">
                            No donation-related content yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* You can expand this later to show different content types */}
                          <p className="text-zinc-400 text-sm">
                            Donations and related content will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Followers / Following simple empty states */}
                  {activeTab === "followers" && (
                    <div className="col-span-full py-20 text-center bg-zinc-900 border border-white/5 rounded-3xl">
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                        Followers
                      </p>
                      {stats.followers.length === 0 && (
                        <div className="py-20 text-center bg-zinc-900 border border-white/5 rounded-3xl">
                          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                            No network peers detected
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "following" && (
                    <div className="col-span-full py-20 text-center bg-zinc-900 border border-white/5 rounded-3xl">
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                        Following
                      </p>
                      {stats.following.length === 0 && (
                        <div className="py-20 text-center bg-zinc-900 border border-white/5 rounded-3xl">
                          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                            No network peers detected
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};

export default ProfilePage;
