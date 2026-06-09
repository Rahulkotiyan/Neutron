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
  ArrowRight,
  Camera,
  Settings,
  LogOut,
} from "iconoir-react";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "./PostCard";
import CustomDropdown from "./CustomDropdown";
import CustomModal from "./CustomModal";
import { compressImage, validateImage } from '../utils/imageCompression';

const ProfilePage = ({ currentUser, token, onLogout, isSidebarOpen }) => {
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
    username: "",
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
    shortBio: "",
  });
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
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
    starredTools: [],
    likedNotes: [],
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

  const handleLogout = () => {
    setModalConfig({
      isOpen: true,
      title: "Terminate Session",
      message: "Are you sure you want to terminate your current session? You will need to authenticate again to access your account.",
      type: "error",
      onConfirm: () => {
        if (onLogout) {
          onLogout();
        }
        navigate("/");
      },
    });
  };

  const fetchColleges = async () => {
    try {
      setLoadingColleges(true);
      const response = await fetch(`${API_URL}/colleges`);
      const collegesData = await response.json();
      if (collegesData.success && Array.isArray(collegesData.data)) {
        setColleges(collegesData.data);
      } else if (Array.isArray(collegesData)) {
        setColleges(collegesData);
      } else {
        setColleges([]);
      }
    } catch (err) {
      console.error("Error fetching colleges:", err);
      setColleges([]);
    } finally {
      setLoadingColleges(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await fetch(`${API_URL}/branches`);
      const branchesData = await response.json();
      if (branchesData.success && Array.isArray(branchesData.data)) {
        setBranches(branchesData.data);
      } else if (Array.isArray(branchesData)) {
        setBranches(branchesData);
      } else {
        setBranches([]);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSettings = () => {
    // Show settings under development message
    setModalConfig({
      isOpen: true,
      title: "Settings",
      message: "Settings page is currently under development. We're working on bringing you advanced profile customization options soon!",
      type: "info",
      onConfirm: null,
    });
  };

  const handleDeletePost = async (postId) => {
    setModalConfig({
      isOpen: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this post?",
      type: "confirm",
      onConfirm: async () => {
        try {
          setDeletingPostId(postId);
          const authToken = token || localStorage.getItem("token");
          const config = {
            headers: { Authorization: `Bearer ${authToken}` },
          };

          await axios.delete(`${API_URL}/posts/${postId}`, config);
          setUserPosts(userPosts.filter((post) => post._id !== postId));
          setDeletingPostId(null);
          setModalConfig({
            isOpen: true,
            title: "Deleted",
            message: "Post deleted successfully",
            type: "success",
          });
        } catch (err) {
          console.error("Error deleting post:", err);
          setDeletingPostId(null);
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

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate the file first
        validateImage(file);

        let processedFile = file;

        // Compress images before storing
        if (file.type.startsWith("image/")) {
          processedFile = await compressImage(file, {
            maxSizeMB: type === "avatar" ? 0.5 : 2, // Smaller for avatars
            maxWidthOrHeight: type === "avatar" ? 400 : 1920,
            quality: type === "avatar" ? 0.9 : 0.85,
          });
        }

        if (type === "avatar") {
          setAvatarFile(processedFile);
          setAvatarPreview(URL.createObjectURL(processedFile));
        } else {
          setBannerFile(processedFile);
          setBannerPreview(URL.createObjectURL(processedFile));
        }
      } catch (error) {
        console.error("Error processing image:", error);
        setModalConfig({
          isOpen: true,
          title: "Image Processing Error",
          message: error.message || "Failed to process the image. Please try again.",
          type: "error",
        });
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
        username: res.data.username || "",
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
        shortBio: res.data.shortBio || "",
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
        username: res.data.username || "",
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
        shortBio: res.data.shortBio || "",
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
      
      // Filter out anonymous posts for visitors
      const rawPosts = Array.isArray(res.data) ? res.data : (res.data.posts || []);
      let filteredPosts = rawPosts.map(p => ({
        ...p,
        author: p.author ? { ...p.author, _id: p.author.id } : p.author,
      }));
      if (!isOwnProfile) {
        filteredPosts = filteredPosts.filter(post => !post.isAnonymous && post.type !== 'confession');
      }
      
      setUserPosts(filteredPosts);
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
          starredTools: [],
          likedNotes: [],
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

      // Fetch user's notes from Notes Library
      const notesResponse = await axios.get(`${API_URL}/notes`, config);
      
      // Temporarily show ALL notes to debug
      const allNotes = notesResponse.data;
      
      // Show first note structure for debugging
      if (allNotes.length > 0) {
      }
      
      // Fixed filtering logic - check uploader field against profile owner
      const userNotes = allNotes.filter(note => {
        const uploaderId = note.uploader?._id?._id || note.uploader?._id;
        const uploaderEmail = note.uploader?.email;
        const profileOwnerId = viewingUser?._id;
        const profileOwnerEmail = viewingUser?.email;
        
        const isUploadedByUser = uploaderId === profileOwnerId || 
                               uploaderEmail === profileOwnerEmail;
        
        return isUploadedByUser;
      });


      // Show only profile owner's notes
      setUserContent({
        notes: userNotes || [],
        posts: [],
        notices: [],
        confessions: [],
      });
    } catch (err) {
      console.error("Error fetching content:", err);
      setError("Failed to retrieve content archive.");
      setUserContent({
        notes: [],
        posts: [],
        notices: [],
        confessions: [],
      });
    } finally {
      setTabLoading(false);
    }
  };

  // Update initial useEffect to use new fetch functions
  useEffect(() => {
    fetchUserProfile();
    fetchStats();
    fetchColleges(); // Fetch colleges from database
    fetchBranches(); // Fetch branches from database
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
    <div className="flex w-full min-h-screen bg-black text-zinc-300 selection:bg-white/20">
      <main className={`flex-1 w-full overflow-y-auto relative transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}>
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

          <div className="px-3 md:px-6 pb-3 pt-4 relative z-10 flex flex-col items-center md:items-start">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-6 mb-4 md:mb-6 w-full">
              {/* Avatar Section */}
              <div className="relative -mt-12 md:-mt-10">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={(e) => handleFileChange(e, "avatar")}
                  className="hidden"
                  accept="image/*"
                />
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-black border-[4px] md:border-[6px] border-[#0a0a0a] flex items-center justify-center text-xl md:text-4xl font-black text-white shadow-premium overflow-hidden relative group/avatar z-30">
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
              <div className="flex gap-6 md:gap-6 mb-2">
                <div
                  onClick={() => setActiveTab("followers")}
                  className="cursor-pointer group/stat flex flex-col items-center md:items-start"
                >
                  <div className="text-lg md:text-2xl font-black text-white group-hover/stat:text-white/80 transition-colors">
                    {stats.followersCount}
                  </div>
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Followers
                  </div>
                </div>
                <div
                  onClick={() => setActiveTab("following")}
                  className="cursor-pointer group/stat flex flex-col items-center md:items-start"
                >
                  <div className="text-lg md:text-2xl font-black text-white group-hover/stat:text-white/80 transition-colors">
                    {stats.followingCount}
                  </div>
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Following
                  </div>
                </div>
              </div>

              {/* Action Buttons - Right side / Full width on mobile */}
              <div className="md:ml-auto mb-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                {!isOwnProfile ? (
                  <button
                    onClick={handleFollowToggle}
                    className={`flex-1 sm:flex-none md:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                      isFollowing
                        ? "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                        : "bg-white text-black hover:bg-white/90 shadow-premium"
                    }`}
                  >
                    {isFollowing ? "Connected" : "Connect"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const next = !isEditMode;
                        setIsEditMode(next);
                        if (next) {
                          setActiveTab("about");
                        }
                      }}
                      className="flex-1 sm:flex-none md:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-white transition-all text-center"
                    >
                      {isEditMode ? "Exit Edit Mode" : "Edit Profile"}
                    </button>
                    <button
                      onClick={handleSettings}
                      className="flex-1 sm:flex-none md:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-white transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Settings iconSize={16} />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 sm:flex-none md:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-red-400 transition-all text-center flex items-center justify-center gap-2"
                    >
                      <LogOut iconSize={16} />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-3 text-center md:text-left mt-2 md:mt-0">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {viewingUser?.name}
                  </h2>
                </div>
              </div>
              <p className="text-zinc-500 font-black text-xs md:text-sm tracking-widest italic">
                {viewingUser?.handle || "@" + viewingUser?.username}
              </p>
              {formData.shortBio && (
                <p className="text-white text-base md:text-lg max-w-2xl leading-relaxed font-medium mx-auto md:mx-0">
                  {formData.shortBio}
                </p>
              )}
            </div>

            {/* Integrated Tabs - Stable Full-Width Design */}
            <div className="mt-4 md:mt-6 border-t border-white/5 bg-gradient-to-b from-black/20 to-black/5 px-3 md:px-6">
              <div className="flex gap-4 md:gap-12 overflow-x-auto no-scrollbar py-2">
                {[
                  { id: "about", label: "About" },
                  { id: "posts", label: "Posts" },
                  { id: "activity", label: "Room" },
                  { id: "content", label: "Resource" },
                  { id: "followers", label: "Network" },
                ]
                  .filter((tab) => {
                    // Hide Room and Network tabs for visitors
                    if (!isOwnProfile && (tab.id === "activity" || tab.id === "followers")) {
                      return false;
                    }
                    // Show only About tab in edit mode
                    if (isEditMode && tab.id !== "about") {
                      return false;
                    }
                    return true;
                  })
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-2 px-1 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${
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
            <div className="p-3 md:p-4 bg-gradient-to-b from-black/5 to-transparent">
              {/* Alerts - Refined minimal style */}
              <div className="mb-3 md:mb-2 space-y-2">
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
                        <div className="grid grid-cols-1 gap-10">
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
                              Username
                            </label>
                            <input
                              type="text"
                              name="username"
                              value={formData.username || ""}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
                              placeholder="Choose a unique username"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Short Bio
                            </label>
                            <input
                              type="text"
                              name="shortBio"
                              value={formData.shortBio}
                              onChange={handleChange}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
                              placeholder="Brief description about yourself (max 150 characters)"
                              maxLength="150"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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
                            <select
                              name="college"
                              value={formData.college}
                              onChange={handleChange}
                              disabled={loadingColleges}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm [color-scheme:dark] disabled:opacity-50"
                            >
                              <option value="" className="bg-black">
                                {loadingColleges ? "Loading institutions..." : "Select Institution"}
                              </option>
                              {Array.isArray(colleges) && colleges.map((college) => (
                                <option key={college._id} value={college.name} className="bg-black">
                                  {college.name}
                                </option>
                              ))}
                            </select>
                            {loadingColleges && (
                              <p className="text-xs text-zinc-500 mt-1">Loading available institutions...</p>
                            )}
                          </div>
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                              Department
                            </label>
                            <select
                              name="branch"
                              value={formData.branch}
                              onChange={handleChange}
                              disabled={loadingBranches}
                              className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm [color-scheme:dark] disabled:opacity-50"
                            >
                              <option value="" className="bg-black">
                                {loadingBranches ? "Loading departments..." : "Select Department"}
                              </option>
                              {Array.isArray(branches) && branches.map((branch) => (
                                <option key={branch._id} value={branch.name} className="bg-black">
                                  {branch.name}
                                </option>
                              ))}
                            </select>
                            {loadingBranches && (
                              <p className="text-xs text-zinc-500 mt-1">Loading available departments...</p>
                            )}
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
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                      {/* Left Column - Main Info */}
                      <div className="lg:col-span-8 space-y-16">
                        <div className="space-y-8">
                          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-3">
                            Bio:
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
                            width={48}
                            height={48}
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
                            {/* Only show delete button for posts owned by current user */}
                            {post.author?._id === currentUser._id && (
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
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Room / Activity Tab */}
                  {activeTab === "activity" && (
                    <div className="space-y-6">
                      {/* Section Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <Message iconSize={24} className="text-gray-400" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">
                              Activity Room
                            </h2>
                            <p className="text-gray-500 text-sm font-medium">
                              Track your interactions and engagement
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Calendar iconSize={16} />
                          <span>Last 30 days</span>
                        </div>
                      </div>

                      {/* Activity Stats Overview */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { id: "liked", label: "Upvoted", count: userActivity.likedPosts?.length || 0, icon: Heart, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                          { id: "disliked", label: "Downvoted", count: userActivity.dislikedPosts?.length || 0, icon: Heart, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400", rotate: "rotate-180" },
                          { id: "comments", label: "Comments", count: userActivity.comments?.length || 0, icon: Message, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                          { id: "saved", label: "Saved", count: userActivity.savedPosts?.length || 0, icon: Bookmark, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                          { id: "starredTools", label: "Starred Tools", count: userActivity.starredTools?.length || 0, icon: "star", color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-yellow-400" },
                          { id: "likedNotes", label: "Liked Notes", count: userActivity.likedNotes?.length || 0, icon: Heart, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                        ].map((stat) => (
                          <button
                            key={stat.id}
                            onClick={() => setActivitySubTab(stat.id)}
                            className={`p-6 ${stat.color} border ${stat.borderColor} rounded-2xl transition-all hover:scale-105 ${
                              activitySubTab === stat.id ? "ring-2 ring-gray-600 shadow-lg" : "hover:shadow-lg hover:bg-gray-900/70"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className={`p-3 bg-black/50 rounded-xl ${stat.rotate || ""}`}>
                                {stat.id === "starredTools" ? (
                                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                ) : (
                                  <stat.icon iconSize={20} className={stat.iconColor} />
                                )}
                              </div>
                              <div className="text-center">
                                <p className="text-3xl font-black text-white mb-1">
                                  {stat.count}
                                </p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                  {stat.label}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Active Filter Indicator */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/30 border border-gray-800 rounded-xl">
                        <div className="flex items-center gap-2">
                          {activitySubTab === "liked" && <Heart iconSize={16} className="text-gray-400" />}
                          {activitySubTab === "disliked" && <Heart iconSize={16} className="text-gray-400 rotate-180" />}
                          {activitySubTab === "comments" && <Message iconSize={16} className="text-gray-400" />}
                          {activitySubTab === "saved" && <Bookmark iconSize={16} className="text-gray-400" />}
                          {activitySubTab === "starredTools" && (
                            <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                          {activitySubTab === "likedNotes" && <Heart iconSize={16} className="text-gray-400" />}
                        </div>
                        <span className="text-white font-medium capitalize">
                          {activitySubTab === "liked" && "Upvoted Posts"}
                          {activitySubTab === "disliked" && "Downvoted Posts"}
                          {activitySubTab === "comments" && "Commented Posts"}
                          {activitySubTab === "saved" && "Saved Posts"}
                          {activitySubTab === "starredTools" && "Starred Tools"}
                          {activitySubTab === "likedNotes" && "Liked Notes"}
                        </span>
                        <span className="text-gray-500 text-sm">
                          ({activitySubTab === "liked" && (userActivity.likedPosts?.length || 0)}
                          {activitySubTab === "disliked" && (userActivity.dislikedPosts?.length || 0)}
                          {activitySubTab === "comments" && (userActivity.comments?.length || 0)}
                          {activitySubTab === "saved" && (userActivity.savedPosts?.length || 0)}
                          {activitySubTab === "starredTools" && (userActivity.starredTools?.length || 0)}
                          {activitySubTab === "likedNotes" && (userActivity.likedNotes?.length || 0)} items)
                        </span>
                      </div>

                      {/* Activity Content */}
                      <div className="space-y-4">
                        {tabLoading ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-2 border-gray-800 border-t-gray-500 rounded-full animate-spin mb-4"></div>
                            <span className="text-gray-500 text-sm font-medium">Loading activity...</span>
                          </div>
                        ) : (
                          <>
                            {/* Upvoted Posts */}
                            {activitySubTab === "liked" && (
                              <div className="space-y-4">
                                {userActivity.likedPosts?.length === 0 ? (
                                  <div className="text-center py-12 px-8">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                      <Heart iconSize={48} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No upvoted posts yet</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                      Start engaging with content you find interesting. Your upvoted posts will appear here.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid gap-4">
                                    {userActivity.likedPosts.map((post) => (
                                      <div
                                        key={post._id}
                                        onClick={() => navigate(`/post/${post._id}`)}
                                        className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <Heart iconSize={16} className="text-gray-400 fill-current" />
                                              </div>
                                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                Upvoted
                                              </span>
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                              {post.title || "Untitled Post"}
                                            </h4>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                              {post.desc}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                                  {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <span>{post.author?.name || "Unknown"}</span>
                                              </div>
                                              <span>•</span>
                                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 mt-4">
                                            <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Downvoted Posts */}
                            {activitySubTab === "disliked" && (
                              <div className="space-y-4">
                                {userActivity.dislikedPosts?.length === 0 ? (
                                  <div className="text-center py-12 px-8">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                      <Heart iconSize={48} className="text-gray-400 rotate-180" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No downvoted posts</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                      Posts you downvote will be hidden from your feed and listed here for reference.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid gap-4">
                                    {userActivity.dislikedPosts.map((post) => (
                                      <div
                                        key={post._id}
                                        onClick={() => navigate(`/post/${post._id}`)}
                                        className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <Heart iconSize={16} className="text-gray-400 fill-current rotate-180" />
                                              </div>
                                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                Downvoted
                                              </span>
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                              {post.title || "Untitled Post"}
                                            </h4>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                              {post.desc}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                                  {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <span>{post.author?.name || "Unknown"}</span>
                                              </div>
                                              <span>•</span>
                                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 mt-4">
                                            <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Comments */}
                            {activitySubTab === "comments" && (
                              <div className="space-y-4">
                                {userActivity.comments?.length === 0 ? (
                                  <div className="text-center py-12 px-8">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                      <Message iconSize={48} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No comments yet</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                      Join the conversation! Your commented posts will appear here.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid gap-4">
                                    {userActivity.comments.map((post) => (
                                      <div
                                        key={post._id}
                                        onClick={() => navigate(`/post/${post._id}`)}
                                        className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <Message iconSize={16} className="text-gray-400" />
                                              </div>
                                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                Commented
                                              </span>
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                              {post.title || "Untitled Post"}
                                            </h4>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                              {post.desc}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                                  {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <span>{post.author?.name || "Unknown"}</span>
                                              </div>
                                              <span>•</span>
                                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 mt-4">
                                            <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Saved Posts */}
                            {activitySubTab === "saved" && (
                              <div className="space-y-4">
                                {userActivity.savedPosts?.length === 0 ? (
                                  <div className="text-center py-12 px-8">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                      <Bookmark iconSize={48} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No saved posts</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                      Save posts to read later. Your saved collection will appear here.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid gap-4">
                                    {userActivity.savedPosts.map((post) => (
                                      <div
                                        key={post._id}
                                        onClick={() => navigate(`/post/${post._id}`)}
                                        className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <Bookmark iconSize={16} className="text-gray-400 fill-current" />
                                              </div>
                                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                Saved
                                              </span>
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                              {post.title || "Untitled Post"}
                                            </h4>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                              {post.desc}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                                  {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <span>{post.author?.name || "Unknown"}</span>
                                              </div>
                                              <span>•</span>
                                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 mt-4">
                                            <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Starred Tools */}
                            {activitySubTab === "starredTools" && (
                              <div className="space-y-4">
                                {userActivity.starredTools?.length === 0 ? (
                                  <div className="text-center py-12 px-8">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                      <svg className="w-12 h-12 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                      </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No starred tools</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                      Star tools you find useful. Your starred tools will appear here.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid gap-4">
                                    {userActivity.starredTools.map((tool) => (
                                      <div
                                        key={tool._id}
                                        className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                              </div>
                                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                Starred Tool
                                              </span>
                                              {tool.starCount > 0 && (
                                                <span className="text-xs text-gray-500">{tool.starCount} stars</span>
                                              )}
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                              {tool.title}
                                            </h4>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                              {tool.description}
                                            </p>
                                          </div>
                                          <a
                                            href={tool.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all"
                                          >
                                            Open
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Liked Notes */}
                            {activitySubTab === "likedNotes" && (
                              <div className="space-y-4">
                                {userActivity.likedNotes?.length === 0 ? (
                                  <div className="text-center py-12 px-8">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                      <Heart iconSize={48} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No liked notes</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                      Like notes you find helpful. Your liked notes will appear here.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid gap-4">
                                    {userActivity.likedNotes.map((note) => (
                                      <div
                                        key={note._id}
                                        className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg"
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                              <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                                <Heart iconSize={16} className="text-gray-400 fill-current" />
                                              </div>
                                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                                Liked Note
                                              </span>
                                              {note.likeCount > 0 && (
                                                <span className="text-xs text-gray-500">{note.likeCount} likes</span>
                                              )}
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                              {note.title}
                                            </h4>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                              {note.description || note.subject}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                              {note.subject && (
                                                <>
                                                  <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400">
                                                    {note.subject}
                                                  </span>
                                                </>
                                              )}
                                              {note.semester && (
                                                <span>Sem {note.semester}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resource / Content Tab */}
                  {activeTab === "content" && (
                    <div className="space-y-6">
                      {tabLoading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                          <div className="w-12 h-12 border-2 border-gray-800 border-t-gray-500 rounded-full animate-spin mb-4"></div>
                          <span className="text-gray-500 text-sm font-medium">Loading resources...</span>
                        </div>
                      ) : (
                        <>
                          {/* Notes Section */}
                          {userContent.notes?.length > 0 && (
                            <div className="space-y-6">
                              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                                <div className="p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                                  <Page iconSize={20} className="text-gray-400" />
                                </div>
                                <div className="text-center md:text-left">
                                  <h3 className="text-lg md:text-xl font-bold text-white">Your Notes</h3>
                                  <p className="text-gray-500 text-xs md:text-sm">Resources you've uploaded to the library</p>
                                </div>
                              </div>
                              
                              <div className="grid gap-4">
                                {userContent.notes.map((note) => (
                                  <div
                                    key={note._id}
                                    onClick={() => window.open(note.fileUrl, '_blank')}
                                    className="p-6 bg-black border border-gray-800 rounded-xl hover:bg-gray-900 transition-all cursor-pointer group"
                                  >
                                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                                          <div className="p-2 bg-gray-900 rounded-lg border border-gray-700">
                                            <Page iconSize={16} className="text-gray-500" />
                                          </div>
                                          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                            {note.documentType || "DOCUMENT"}
                                          </span>
                                          {note.subject && (
                                            <span className="text-xs px-2 py-1 bg-gray-900 text-gray-500 rounded-full border border-gray-700">
                                              {note.subject}
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors">
                                          {note.title || "Untitled Note"}
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                          {note.description || "No description provided"}
                                        </p>
                                        
                                        {/* File Information */}
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600 mb-4">
                                          <span>📄 {note.fileName || "document.pdf"}</span>
                                          {note.fileSize && <span>•</span>}
                                          {note.fileSize && <span>{(note.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600">
                                          <span>Uploaded {new Date(note.createdAt).toLocaleDateString()}</span>
                                          {note.semester && <span>•</span>}
                                          {note.semester && <span>Semester {note.semester}</span>}
                                          {note.branch && <span>•</span>}
                                          {note.branch && <span>{note.branch}</span>}
                                          <span>•</span>
                                          <span>{note.views || 0} views</span>
                                        </div>

                                        {/* Tags */}
                                        {note.tags && note.tags.length > 0 && (
                                          <div className="flex flex-wrap gap-2 mt-3">
                                            {note.tags.map((tag, index) => (
                                              <span
                                                key={index}
                                                className="text-xs px-2 py-1 bg-gray-900 text-gray-500 rounded-full border border-gray-700"
                                              >
                                                #{tag}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 mt-4 md:mt-0">
                                        <ArrowRight iconSize={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty State */}
                          {(!userContent.notes?.length) && (
                            <div className="text-center py-16">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <Page iconSize={48} className="text-gray-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No resources uploaded yet</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Visit the Notes Library to upload your study materials, notes, and resources. They will appear here.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Network Section */}
                  {activeTab === "followers" && (
                    <div className="space-y-6">
                      {/* Section Header */}
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                          <User iconSize={24} className="text-gray-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white tracking-tight">
                            Network
                          </h2>
                          <p className="text-gray-500 text-sm font-medium">
                            Your connections and followers
                          </p>
                        </div>
                      </div>

                      {/* Network Stats Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="p-6 bg-black border border-gray-800 rounded-2xl hover:bg-gray-900 transition-all">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-gray-900 rounded-xl border border-gray-700">
                              <User iconSize={20} className="text-gray-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-black text-white mb-1">
                                {stats.followers?.length || 0}
                              </p>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Followers
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-black border border-gray-800 rounded-2xl hover:bg-gray-900 transition-all">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-gray-900 rounded-xl border border-gray-700">
                              <Heart iconSize={20} className="text-gray-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-black text-white mb-1">
                                {stats.following?.length || 0}
                              </p>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Following
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Network Content */}
                      <div className="space-y-6">
                        {/* Followers List */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-white mb-4">Followers</h3>
                          {stats.followers?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <User iconSize={48} className="text-gray-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No followers yet</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                When people follow you, they'll appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {stats.followers.map((follower) => {
                                // Generate handle from available fields
                                const generateHandle = (user) => {
                                  if (user.handle) return user.handle;
                                  if (user.username) return `@${user.username}`;
                                  if (user.name) {
                                    return `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
                                  }
                                  if (user.email) {
                                    const emailPrefix = user.email.split('@')[0];
                                    return `@${emailPrefix}`;
                                  }
                                  return "@user";
                                };
                                
                                return (
                                  <div
                                    key={follower._id}
                                    onClick={() => navigate(`/profile/${follower._id}`)}
                                    className="p-4 bg-black border border-gray-800 rounded-xl hover:bg-gray-900 transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold border border-gray-700">
                                          {follower.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                          <p className="text-white font-semibold group-hover:text-gray-300 transition-colors">
                                            {follower.name || "Unknown User"}
                                          </p>
                                          <p className="text-gray-500 text-sm">
                                            {generateHandle(follower)}
                                          </p>
                                        </div>
                                      </div>
                                      <ArrowRight iconSize={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Following List */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-white mb-4">Following</h3>
                          {stats.following?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <Heart iconSize={48} className="text-gray-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">Not following anyone</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Follow people to see their updates and build your network.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {stats.following.map((following) => {
                                // Generate handle from available fields
                                const generateHandle = (user) => {
                                  if (user.handle) return user.handle;
                                  if (user.username) return `@${user.username}`;
                                  if (user.name) {
                                    return `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
                                  }
                                  if (user.email) {
                                    const emailPrefix = user.email.split('@')[0];
                                    return `@${emailPrefix}`;
                                  }
                                  return "@user";
                                };
                                
                                return (
                                  <div
                                    key={following._id}
                                    onClick={() => navigate(`/profile/${following._id}`)}
                                    className="p-4 bg-black border border-gray-800 rounded-xl hover:bg-gray-900 transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold border border-gray-700">
                                          {following.name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                          <p className="text-white font-semibold group-hover:text-gray-300 transition-colors">
                                            {following.name || "Unknown User"}
                                          </p>
                                          <p className="text-gray-500 text-sm">
                                            {generateHandle(following)}
                                          </p>
                                        </div>
                                      </div>
                                      <ArrowRight iconSize={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
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
      </main>
    </div>
  );
};

export default ProfilePage;
