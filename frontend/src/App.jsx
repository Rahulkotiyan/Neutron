import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  LogIn,
  Menu,
  Video,
  User as UserIcon,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import PostCard from "./components/PostCard";
import LoginModal from "./components/LoginModal";
import FeedPage from "./components/FeedPage";
import GroupsPage from "./components/GroupsPage";
import MarketPage from "./components/MarketPage";
import LostFoundPage from "./components/LostFoundPage";
import TimetablePage from "./components/TimetablePage";
import NotesLibraryPage from "./components/NotesLibraryPage";
import NoticesPage from "./components/NoticesPage";
import ConfessionsPage from "./components/ConfessionsPage";
import ProfilePage from "./components/ProfilePage";
import PremiumPlans from "./components/PremiumPlans";
import PaymentModal from "./components/PaymentModal";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import HomePage from "./components/HomePage";
import Header from "./components/Header";
import Resources from "./components/Resources";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import CreatePostModal from "./components/CreatePostModal";

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
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [refreshFeed, setRefreshFeed] = useState(0);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLoginSuccess = (data) => {
    console.log("User logged in:", data);
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-300 selection:bg-white/20 selection:text-white">
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
          />
          <div className="flex flex-1 mt-16">
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
            <div className="flex-1 overflow-auto">
              <Routes>
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
                  />
                  <Rightbar />
                </>
              }
            />
            <Route
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
            />

            <Route
              path="/confessions"
              element={
                <ConfessionsPage
                  isSidebarOpen={isSidebarOpen}
                  currentUser={user}
                  token={localStorage.getItem("token")}
                />
              }
            />
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
                />
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProfilePage
                  currentUser={user}
                  token={localStorage.getItem("token")}
                />
              }
            />
            <Route
              path="/market"
              element={
                <MarketPage
                  isSidebarOpen={isSidebarOpen}
                  currentUser={user}
                  token={localStorage.getItem("token")}
                />
              }
            />
            <Route
              path="/timetable"
              element={
                <TimetablePage
                  isSidebarOpen={isSidebarOpen}
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
            <Route
              path="/notices"
              element={
                <NoticesPage
                  isSidebarOpen={isSidebarOpen}
                  currentUser={user}
                  token={localStorage.getItem("token")}
                />
              }
            />
            <Route
              path="/resources"
              element={<Resources toggleSidebar={toggleSidebar} />}
            />
            <Route
              path="/premium"
              element={<PremiumPlans />}
            />
          </Routes>
        </div>
      </div>
    </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
