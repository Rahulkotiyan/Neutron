import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import CustomModal from "./CustomModal";
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";
import { compressImage, validateImage } from '../utils/imageCompression';
import { API_URL } from '../utils/api';

const ProfilePage = ({ currentUser, token, onLogout, onUserUpdate, isSidebarOpen }) => {
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

      setViewingUser(res.data);
      setAvatarPreview(null);
      setBannerPreview(null);
      if (onUserUpdate) onUserUpdate(res.data);

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
          <div className="flex flex-col items-center gap-3 md:gap-6">
          <div className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full animate-spin"></div>
          <span className="text-[10px] md:text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">
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
            className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 min-h-[44px]"
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
        <div className="flex-1 min-h-screen bg-black pb-16 md:pb-0 overflow-y-auto selection:bg-white/20 relative no-scrollbar">
          {/* Unified Template Surface - Expanded and Cohesive */}
          <div className="max-w-6xl mx-auto px-0 md:px-6 relative z-10 pt-4 pb-16 md:pb-0">
            <div className="relative overflow-hidden glass-main md:rounded-[2.5rem] border-b md:border md:border-white/10 shadow-premium flex flex-col">
          <ProfileHeader
            viewingUser={viewingUser}
            currentUser={currentUser}
            stats={stats}
            isOwnProfile={isOwnProfile}
            isEditMode={isEditMode}
            formData={formData}
            bannerPreview={bannerPreview}
            avatarPreview={avatarPreview}
            navigate={navigate}
            handleFileChange={handleFileChange}
            handleFollowToggle={handleFollowToggle}
            handleSettings={handleSettings}
            handleLogout={handleLogout}
            setIsEditMode={setIsEditMode}
            setActiveTab={setActiveTab}
            isFollowing={isFollowing}
            followLoading={followLoading}
            bannerInputRef={bannerInputRef}
            avatarInputRef={avatarInputRef}
          />

            <ProfileTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activitySubTab={activitySubTab}
              setActivitySubTab={setActivitySubTab}
              contentSubTab={contentSubTab}
              setContentSubTab={setContentSubTab}
              tabLoading={tabLoading}
              userPosts={userPosts}
              setUserPosts={setUserPosts}
              userActivity={userActivity}
              userContent={userContent}
              deletingPostId={deletingPostId}
              setDeletingPostId={setDeletingPostId}
              isOwnProfile={isOwnProfile}
              navigate={navigate}
              currentUser={currentUser}
              token={token}
              viewingUser={viewingUser}
              formData={formData}
              stats={stats}
              handleDeletePost={handleDeletePost}
              fetchUserPostsForProfile={fetchUserPostsForProfile}
              error={error}
              success={success}
              isEditMode={isEditMode}
              saving={saving}
              handleChange={handleChange}
              handleSave={handleSave}
              colleges={colleges}
              loadingColleges={loadingColleges}
              branches={branches}
              loadingBranches={loadingBranches}
              setFormData={setFormData}
              avatarPreview={avatarPreview}
              bannerPreview={bannerPreview}
              handleFileChange={handleFileChange}
              handleFollowToggle={handleFollowToggle}
              handleSettings={handleSettings}
              handleLogout={handleLogout}
              setIsEditMode={setIsEditMode}
              isFollowing={isFollowing}
              followLoading={followLoading}
              bannerInputRef={bannerInputRef}
              avatarInputRef={avatarInputRef}
            />
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
    </main>
    </div>
  );
};

export default ProfilePage;
