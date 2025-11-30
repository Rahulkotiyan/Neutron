import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Menu,
  Video,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import PostCard from "./components/PostCard";

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
      {/* SIDEBAR Component */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* MAIN CONTENT AREA */}
      {/* Added duration-300 and cubic-bezier for smooth slide without jerkiness */}
      <main
        className={`flex-1 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) p-6 overflow-y-auto no-scrollbar relative z-0
        ${isSidebarOpen ? "ml-72" : "ml-0"} lg:mr-80`}
      >
        <div className="max-w-2xl mx-auto pt-4 min-w-[300px]">
          {/* HEADER with Toggle Button */}
          <div className="flex items-center gap-4 mb-6 sticky top-0 bg-zinc-950/80 backdrop-blur-md p-2 -mx-2 z-10 rounded-xl">
            <button
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-white hover:text-black transition-all border border-white/5 active:scale-95 shadow-lg"
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Campus Feed
            </h2>
          </div>

          {/* CREATE POST INPUT */}
          <div className="bg-black p-5 rounded-2xl shadow-xl border border-white/10 mb-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-50"></div>
            <div className="flex gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 to-black flex-shrink-0 p-[1px] border border-white/10">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">
                  RK
                </div>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Initiate protocol..."
                  className="w-full bg-zinc-900/50 text-zinc-200 rounded-xl px-5 py-3 outline-none focus:ring-1 focus:ring-white/20 transition-all border border-white/5 placeholder:text-zinc-600 hover:bg-zinc-900"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex gap-1">
                <ComposeActionButton
                  icon={<ImageIcon size={18} />}
                  label="Media"
                  color="text-zinc-500 hover:text-white hover:bg-white/10"
                />
                <ComposeActionButton
                  icon={<Video size={18} />}
                  label="Video"
                  color="text-zinc-500 hover:text-white hover:bg-white/10"
                />
                <ComposeActionButton
                  icon={<LinkIcon size={18} />}
                  label="Link"
                  color="text-zinc-500 hover:text-white hover:bg-white/10"
                />
              </div>
              <button className="bg-white text-black px-6 py-2 rounded-lg font-bold text-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all">
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
