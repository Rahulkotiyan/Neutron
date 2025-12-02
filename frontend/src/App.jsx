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
import HomePage from "./components/HomePage";
import Header from "./components/Header";
import Resources from "./components/Resources";


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
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
        <Header
          toggleSidebar={toggleSidebar}
          user={user}
          onLogin={() => setIsLoginModalOpen(true)}
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
                <HomePage />
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
              <Resources toggleSidebar={toggleSidebar}/>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;