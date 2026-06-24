import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import cacheManager from "./utils/cacheManager";
import { API_URL } from "./utils/api";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import LoginModal from "./components/LoginModal";
const FeedPage = lazy(() => import("./components/FeedPage"));
const ToolsComponent = lazy(() => import("./components/ToolsComponent"));
const AttendanceTracker = lazy(() => import("./components/AttendanceTracker"));
const NotesLibraryPage = lazy(() => import("./components/NotesLibraryPage"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const OnboardingPage = lazy(() => import("./components/OnboardingPage"));
import MobileFooter from "./components/MobileFooter";
const PostDetail = lazy(() => import("./components/PostDetail"));
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
const HomePage = lazy(() => import("./components/HomePage"));
import Header from "./components/Header";
import { GoogleOAuthProvider } from "@react-oauth/google";
import CreatePostModal from "./components/CreatePostModal";
import { SocketProvider } from "./context/SocketContext";
import CustomModal from "./components/CustomModal";
import LoadingFallback from "./components/LoadingFallback";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { capture, identify, pageView } from "./lib/analytics";

const api = axios.create({
  baseURL: API_URL,
});

const OnboardingRedirect = ({ user }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (user && !user.hasProfile && window.location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [user, navigate]);
  return null;
};

const AnalyticsTracker = () => {
  const location = useLocation();
  useEffect(() => {
    pageView(location.pathname, { url: location.pathname });
  }, [location]);
  return null;
};

function App() {
  const CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setIsLoginModalOpen(false);
    identify(data.id || data.email, { email: data.email, name: data.name });
    capture("user_login", { method: "google" });
    
    // Redirect to onboarding if no profile
    if (!data.hasProfile) {
      window.location.href = "/onboarding";
    }
  };

  const handleProfileCreated = (profileData) => {
    const updatedUser = { ...user, ...profileData, hasProfile: true };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    capture("user_logout");
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
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <SocketProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AnalyticsTracker />
          <OnboardingRedirect user={user} />
          <div className="flex overflow-clip bg-zinc-950 font-sans text-zinc-300 selection:bg-white/20 selection:text-white" style={{ minHeight: '100dvh' }}>
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
              onLoginSuccess={handleLoginSuccess}
            />
            <Header
              toggleSidebar={toggleSidebar}
              user={user}
              onLogin={() => setIsLoginModalOpen(true)}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onLogout={handleLogout}
            />
            <div className="flex flex-1 mt-12 md:mt-16 overflow-hidden">
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
              <div className="flex-1 overflow-auto no-scrollbar">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <>
                            <HomePage
                                refreshTrigger={refreshFeed}
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
                      path="/onboarding"
                      element={
                        <OnboardingPage
                          currentUser={user}
                          token={localStorage.getItem("token")}
                          onProfileCreated={handleProfileCreated}
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
                  </Routes>
                </Suspense>
              </div>
            </div>
          </div>
          <MobileFooter onOpenCreatePost={() => {
            if (!user) {
              setIsLoginModalOpen(true);
              return;
            }
            setIsCreatePostOpen(true);
          }} />
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
