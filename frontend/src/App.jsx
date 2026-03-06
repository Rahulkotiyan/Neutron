import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import cacheManager from "./utils/cacheManager";
import {
  Upload as ImageIcon,
  Link as LinkIcon,
  Menu,
  User as UserIcon,
} from "iconoir-react";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import PostCard from "./components/PostCard";
import LoginModal from "./components/LoginModal";
const FeedPage = lazy(() => import("./components/FeedPage"));
const GroupsPage = lazy(() => import("./components/GroupsPage"));
const EnhancedMarketPage = lazy(() => import("./components/EnhancedMarketPage"));
const LostFoundPage = lazy(() => import("./components/LostFoundPage"));
const ToolsComponent = lazy(() => import("./components/ToolsComponent"));
const AttendanceTracker = lazy(() => import("./components/AttendanceTracker"));
const TimetableWidget = lazy(() => import("./components/TimetableWidget"));
const AttendanceWidget = lazy(() => import("./components/AttendanceWidget"));
const NotesLibraryPage = lazy(() => import("./components/NotesLibraryPage"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
import PaymentModal from "./components/PaymentModal";
import MobileFooter from "./components/MobileFooter";
const PostDetail = lazy(() => import("./components/PostDetail"));
// import ChatsPage from "./components/ChatsPage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
const HomePage = lazy(() => import("./components/HomePage"));
import Header from "./components/Header";
const Resources = lazy(() => import("./components/Resources"));
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import ProfileModal from "./components/ProfileModal";
import CreatePostModal from "./components/CreatePostModal";
import { SocketProvider } from "./context/SocketContext";
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
import CustomModal from "./components/CustomModal";
import LoadingFallback from "./components/LoadingFallback";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

function App() {
  const CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [sessionExpiredModal, setSessionExpiredModal] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpiredModal(true);
    };
    window.addEventListener('session_expired', handleSessionExpired);
    
    // Initialize cache manager
    cacheManager.registerServiceWorker();
    
    return () => window.removeEventListener('session_expired', handleSessionExpired);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLoginSuccess = (data) => {
    console.log("User logged in:", data);
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setIsLoginModalOpen(false);
    
    // Check if user has profile, if not show profile creation modal
    if (!data.hasProfile) {
      setIsProfileModalOpen(true);
    }
  };

  const handleProfileCreated = (profileData) => {
    console.log("Profile created:", profileData);
    // Update user data with profile information
    const updatedUser = { ...user, ...profileData, hasProfile: true };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setIsProfileModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log(
        "✅ User data refreshed with admin status:",
        updatedUser.isAdmin,
      );
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <SocketProvider>
        <Router>
          <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-300 selection:bg-white/20 selection:text-white">
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
              onLoginSuccess={handleLoginSuccess}
            />
            <ProfileModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              onProfileCreated={handleProfileCreated}
              user={user}
            />
            <Header
              toggleSidebar={toggleSidebar}
              user={user}
              onLogin={() => setIsLoginModalOpen(true)}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onLogout={handleLogout}
            />
            <div className="flex flex-1 mt-16 overflow-hidden">
              <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                onLogin={() => setIsLoginModalOpen(true)}
                onLogout={handleLogout}
              />
              <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
                user={user}
                onPostCreated={() => setRefreshFeed((prev) => prev + 1)}
              />
              <div className="flex-1 overflow-auto pb-20 md:pb-0">
                <Suspense fallback={<LoadingFallback />}>
                  <Route
                    path="/"
                    element={
                      <>
                        <HomePage
                          refreshTrigger={null}
                          currentUser={user}
                          token={localStorage.getItem("token")}
                          isSidebarOpen={isSidebarOpen}
                        />
                        <Rightbar />
                      </>
                    }
                  />
                  <Route
                    path="/Feed"
                    element={
                      <>
                        <FeedPage
                          toggleSidebar={toggleSidebar}
                          user={user}
                          currentUser={user}
                          token={localStorage.getItem("token")}
                          onLogin={() => setIsLoginModalOpen(true)}
                          pageType="HOME"
                          collegeName={user?.college}
                          isSidebarOpen={isSidebarOpen}
                        />
                        <Rightbar />
                      </>
                    }
                  />
                  {/* <Route
              path="/lost-found"
              element={
                <>
                  <LostFoundPage
                    isSidebarOpen={isSidebarOpen}
                    currentUser={user}
                    token={localStorage.getItem("token")}
                  />
                </>
              }
            /> */}

                  <Route
                    path="/groups"
                    element={
                      <GroupsPage
                        currentUser={user}
                        token={localStorage.getItem("token")}
                        isSidebarOpen={isSidebarOpen}
                      />
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProfilePage
                        currentUser={user}
                        token={localStorage.getItem("token")}
                        onLogout={handleLogout}
                        isSidebarOpen={isSidebarOpen}
                      />
                    }
                  />
                  <Route
                    path="/profile/:userId"
                    element={
                      <ProfilePage
                        currentUser={user}
                        token={localStorage.getItem("token")}
                        onLogout={handleLogout}
                        isSidebarOpen={isSidebarOpen}
                      />
                    }
                  />
                  <Route
                    path="/post/:postId"
                    element={
                      <PostDetail
                        currentUser={user}
                        token={localStorage.getItem("token")}
                      />
                    }
                  />
                  {/* <Route
              path="/market"
              element={
                <EnhancedMarketPage
                  isSidebarOpen={isSidebarOpen}
                  currentUser={user}
                  token={localStorage.getItem("token")}
                />
              }
            /> */}
                  {/* <Route
              path="/market-old"
              element={
                <MarketPage
                  isSidebarOpen={isSidebarOpen}
                  currentUser={user}
                  token={localStorage.getItem("token")}
                />
              }
            /> */}
                  <Route
                    path="/tools"
                    element={
                      <ToolsComponent
                        isSidebarOpen={isSidebarOpen}
                        currentUser={user}
                        token={localStorage.getItem("token")}
                      />
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <AttendanceTracker
                        currentUser={user}
                        token={localStorage.getItem("token")}
                      />
                    }
                  />
                  <Route
                    path="/notes"
                    element={
                      <NotesLibraryPage
                        isSidebarOpen={isSidebarOpen}
                        currentUser={user}
                        token={localStorage.getItem("token")}
                      />
                    }
                  />
                  {/* <Route
                    path="/chats"
                    element={
                      <ChatsPage
                        currentUser={user}
                        token={localStorage.getItem("token")}
                        isSidebarOpen={isSidebarOpen}
                      />
                    }
                  /> */}
                  <Route
                    path="/resources"
                    element={<Resources toggleSidebar={toggleSidebar} />}
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminDashboard
                        user={user}
                        refreshUserData={refreshUserData}
                        sidebarOpen={isSidebarOpen}
                      />
                    }
                  />
                </Suspense>
              </div>
            </div>
          </div>
          <MobileFooter />
        </Router>
      </SocketProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 10000000 }}
        toastStyle={{
          background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
          color: "#f3f4f6",
          border: "1px solid #374151",
          borderRadius: "0.5rem",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        }}
        progressStyle={{
          background: "linear-gradient(90deg, #6b7280 0%, #9ca3af 100%)",
        }}
      />
      <CustomModal
        isOpen={sessionExpiredModal}
        onClose={() => {
          setSessionExpiredModal(false);
          window.location.href = "/";
        }}
        title="Session Expired"
        message="Your session has expired. Please log in again to continue."
        type="warning"
      />
    </GoogleOAuthProvider>
  );
}

export default App;
