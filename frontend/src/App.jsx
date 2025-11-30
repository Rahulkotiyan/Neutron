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


function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // AUTH STATES (User is NULL by default = Guest)
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Function to guard actions (post, like, etc.)
  const handleProtectedAction = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return false;
    }
    return true;
  };

  const fallbackData = [
    {
      id: 1,
      author: {
        name: "Vex onwe loe",
        handle: "@logriinht",
        avatar: "https://i.pravatar.cc/150?img=11",
      },
      tag: "ANNOUNCEMENT",
      title: "Guest Lecture: AI in Healthcare - Tomorrow!",
      desc: "Ancle tonnt toms sexecarlav and tarasieret. Exomy itomi kilesg tinort the time.",
      stats: "4.5K",
    },
    {
      id: 2,
      author: {
        name: "Hyn santvirat",
        handle: "tep-to Ilot",
        avatar: "https://i.pravatar.cc/150?img=5",
      },
      tag: "MEME",
      title: "Foat tarfor AI, Ncelficas",
      desc: "aowroitaw: lait hootitont ciantais.",
      image:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      stats: "4.5K",
    },
  ];

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/posts")
      .then((response) => {
        setPosts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setPosts(fallbackData);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-300 selection:bg-white/20 selection:text-white">
      {/* AUTH MODAL */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* SIDEBAR Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* MAIN CONTENT AREA */}
      <main
        className={`flex-1 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) p-6 overflow-y-auto no-scrollbar relative z-0
        ${isSidebarOpen ? "ml-72" : "ml-0"} lg:mr-80`}
      >
        <div className="max-w-2xl mx-auto pt-4 min-w-[300px]">
          {/* HEADER with Toggle Button */}
          <div className="flex items-center justify-between gap-4 mb-6 sticky top-0 bg-zinc-950/80 backdrop-blur-md p-2 -mx-2 z-10 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black transition-all border border-white/5 active:scale-95 shadow-lg"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Campus Feed
              </h2>
            </div>

            {/* Header Login Button for Guests */}
            {!user && (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
              >
                <LogIn size={16} /> Login
              </button>
            )}
          </div>

          {/* CREATE POST INPUT (Protected) */}
          <div className="bg-black p-5 rounded-2xl shadow-xl border border-white/10 mb-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-50"></div>
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 to-black flex-shrink-0 p-[1px] border border-white/10">
                {user ? (
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
                    {user.name?.charAt(0) ||"U"}
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-zinc-500">
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  onClick={handleProtectedAction}
                  placeholder={
                    user
                      ? "Initiate protocol..."
                      : "Login to share your thoughts..."
                  }
                  className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-5 py-3 outline-none focus:ring-1 focus:ring-white/20 transition-all border border-white/5 placeholder:text-zinc-600 hover:bg-zinc-900"
                  readOnly={!user}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex gap-1 opacity-70">
                <ComposeActionButton
                  icon={<ImageIcon size={18} />}
                  label="Media"
                  color="text-zinc-500"
                />
                <ComposeActionButton
                  icon={<Video size={18} />}
                  label="Video"
                  color="text-zinc-500"
                />
              </div>
              <button
                onClick={handleProtectedAction}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                  user
                    ? "bg-white text-black hover:scale-105"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                Post
              </button>
            </div>
          </div>

          {/* POSTS GRID */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="w-10 h-10 border-4 border-zinc-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm tracking-widest uppercase">Syncing...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Rightbar />
    </div>
  );
}

const ComposeActionButton = ({ icon, label, color }) => (
  <button
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${color}`}
  >
    {icon} <span className="hidden sm:inline">{label}</span>
  </button>
);

export default App;