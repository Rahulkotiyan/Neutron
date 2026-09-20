import React, { useState, useEffect, lazy, Suspense, useCallback } from "react";
import axios from "axios";
import cacheManager from "./utils/cacheManager";
import { API_URL } from "./utils/api";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import LoginModal from "./components/LoginModal";
import FeedPage from "./components/FeedPage";
import ToolsComponent from "./components/ToolsComponent";
import NotesLibraryPage from "./components/NotesLibraryPage";
import HomePage from "./components/HomePage";
const AttendanceTracker = lazy(() => import("./components/AttendanceTracker"));
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
import Header from "./components/Header";
import { GoogleOAuthProvider } from "@react-oauth/google";
import CreatePostModal from "./components/CreatePostModal";
import { SocketProvider } from "./context/SocketContext";
import CustomModal from "./components/CustomModal";
import LoadingFallback from "./components/LoadingFallback";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { capture, identify, pageView } from "./lib/analytics";
import { initAnalytics } from "./lib/analytics";
import FeedbackFAB from "./components/FeedbackFAB";

const api = axios.create({
  baseURL: API_URL,
});

const OnboardingRedirect = ({ user }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (
      user &&
      !user.hasProfile &&
      window.location.pathname !== "/onboarding"
    ) {
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
    window.addEventListener("session_expired", handleSessionExpired);

    // Initialize cache manager
    cacheManager.registerServiceWorker();
    initAnalytics();

    return () =>
      window.removeEventListener("session_expired", handleSessionExpired);
  }, []);

  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    [],
  );

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const openCreatePostModal = useCallback(() => setIsCreatePostOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);
  const closeCreatePostModal = useCallback(
    () => setIsCreatePostOpen(false),
    [],
  );

  const handleLoginSuccess = useCallback((data) => {
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setIsLoginModalOpen(false);
    identify(data.id || data.email, { email: data.email, name: data.name });
    capture("user_login", { method: "google" });

    // Notify SocketContext so the socket (re)connects immediately.
    window.dispatchEvent(new Event("auth_changed"));

    // Redirect to onboarding if no profile
    if (!data.hasProfile) {
      window.location.href = "/onboarding";
    }
  }, []);

  const handleProfileCreated = useCallback(
    (profileData) => {
      const updatedUser = { ...user, ...profileData, hasProfile: true };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    },
    [user],
  );

  const handleProfileUpdate = useCallback(
    (profileData) => {
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    },
    [user],
  );

  const handleLogout = useCallback(() => {
    capture("user_logout");
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Notify SocketContext so the stale socket is torn down immediately.
    window.dispatchEvent(new Event("auth_changed"));
  }, []);

  const handleRefreshFeed = useCallback(
    () => setRefreshFeed((prev) => prev + 1),
    [],
  );

  const handleMobileCreatePost = useCallback(() => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsCreatePostOpen(true);
  }, [user]);

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
          <div
            className="flex overflow-clip bg-zinc-950 font-sans text-zinc-300 selection:bg-white/20 selection:text-white"
            style={{ minHeight: "100dvh" }}
          >
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={closeLoginModal}
              onLoginSuccess={handleLoginSuccess}
            />
            <Header
              toggleSidebar={toggleSidebar}
              user={user}
              onLogin={openLoginModal}
              onOpenCreatePost={openCreatePostModal}
              onLogout={handleLogout}
            />
            <div className="flex flex-1 mt-12 md:mt-16 overflow-hidden">
              <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                onLogin={openLoginModal}
                onLogout={handleLogout}
              />
              <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={closeCreatePostModal}
                user={user}
                onPostCreated={handleRefreshFeed}
              />
              <div className="flex-1 overflow-auto no-scrollbar">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <HomePage
                          refreshTrigger={refreshFeed}
                          currentUser={user}
                          token={localStorage.getItem("token")}
                          isSidebarOpen={isSidebarOpen}
                        />
                        <Rightbar />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/Feed"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
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
                      </Suspense>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <ProfilePage
                          currentUser={user}
                          token={localStorage.getItem("token")}
                          onLogout={handleLogout}
                          onUserUpdate={handleProfileUpdate}
                          isSidebarOpen={isSidebarOpen}
                        />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/profile/:userId"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <ProfilePage
                          currentUser={user}
                          token={localStorage.getItem("token")}
                          onLogout={handleLogout}
                          onUserUpdate={handleProfileUpdate}
                          isSidebarOpen={isSidebarOpen}
                        />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/onboarding"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <OnboardingPage
                          currentUser={user}
                          token={localStorage.getItem("token")}
                          onProfileCreated={handleProfileCreated}
                        />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/post/:postId"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <PostDetail
                          currentUser={user}
                          token={localStorage.getItem("token")}
                        />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/tools"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <ToolsComponent
                          isSidebarOpen={isSidebarOpen}
                          currentUser={user}
                          token={localStorage.getItem("token")}
                        />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/attendance"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <AttendanceTracker
                          currentUser={user}
                          token={localStorage.getItem("token")}
                        />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/notes"
                    element={
                      <Suspense fallback={<LoadingFallback />}>
                        <NotesLibraryPage
                          isSidebarOpen={isSidebarOpen}
                          currentUser={user}
                          token={localStorage.getItem("token")}
                        />
                      </Suspense>
                    }
                  />
                </Routes>
              </div>
            </div>
          </div>
          <MobileFooter onOpenCreatePost={handleMobileCreatePost} />
        </Router>
        <FeedbackFAB user={user} />
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
