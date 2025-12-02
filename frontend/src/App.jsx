import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  LogIn,
  Menu,
  Video,
  User as UserIcon
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import PostCard from "./components/PostCard";
import LoginModal from "./components/LoginModal";
import FeedPage from "./components/FeedPage";
import GroupsPage from "./components/GroupsPage";
import MarketPage from "./components/MarketPage";
import TimetablePage from "./components/TimetablePage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default on mobile
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleLoginSuccess = (data) => {
    setUser(data);
    setIsLoginModalOpen(false);
  };
  const handleLogout = () => setUser(null);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-300 selection:bg-white/20 selection:text-white">
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          user={user}
          onLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
        />

        <Routes>
          <Route
            path="/"
            element={
              <>
                <FeedPage
                  toggleSidebar={toggleSidebar}
                  user={user}
                  onLogin={() => setIsLoginModalOpen(true)}
                  pageType="HOME"
                />
                <Rightbar />
              </>
            }
          />
          <Route
            path="/feed"
            element={
              <>
                <FeedPage
                  toggleSidebar={toggleSidebar}
                  user={user}
                  onLogin={() => setIsLoginModalOpen(true)}
                  pageType="HOME"
                />
                <Rightbar />
              </>
            }
          />
          <Route
            path="/lost-found"
            element={
              <>
                <FeedPage
                  toggleSidebar={toggleSidebar}
                  user={user}
                  onLogin={() => setIsLoginModalOpen(true)}
                  pageType="LOST_FOUND"
                />
                <Rightbar />
              </>
            }
          />
          <Route
            path="/notices"
            element={
              <>
                <FeedPage
                  toggleSidebar={toggleSidebar}
                  user={user}
                  onLogin={() => setIsLoginModalOpen(true)}
                  pageType="NOTICES"
                />
                <Rightbar />
              </>
            }
          />
          <Route
            path="/confessions"
            element={
              <>
                <FeedPage
                  toggleSidebar={toggleSidebar}
                  user={user}
                  onLogin={() => setIsLoginModalOpen(true)}
                  pageType="CONFESSIONS"
                />
                <Rightbar />
              </>
            }
          />

          <Route
            path="/groups"
            element={<GroupsPage toggleSidebar={toggleSidebar} />}
          />
          <Route
            path="/market"
            element={<MarketPage toggleSidebar={toggleSidebar} />}
          />
          <Route
            path="/timetable"
            element={<TimetablePage toggleSidebar={toggleSidebar} />}
          />

          <Route
            path="/resources"
            element={
              <main className="flex-1 w-full p-10 text-white lg:ml-72">
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 bg-zinc-900 rounded-xl text-zinc-400 mb-4"
                >
                  <Menu size={20} />
                </button>
                <h1 className="text-2xl font-bold">Notes Library</h1>
                <p className="text-zinc-500 mt-2">
                  Folder structure coming soon...
                </p>
              </main>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;