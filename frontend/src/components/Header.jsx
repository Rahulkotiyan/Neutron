import { BellNotification, Key, Menu, Plus, Search, Xmark, Refresh, Clock } from "iconoir-react";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationsDropdown from "./NotificationsDropdown";

const Header = ({ toggleSidebar, user, onLogin, onOpenCreatePost, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const showFeedElements = location.pathname === "/" || location.pathname === "/Feed";

  const API_URL = "http://localhost:5000/api";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unread count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Set up polling for new notifications
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      // Removed console.error
    }
  };

  const performSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    setIsSearching(true);
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { query: searchQuery },
      });
      setSearchResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchQuery("");

    switch (result.type) {
      case "user":
        navigate(`/profile/${result.id}`);
        break;
      case "post":
        // Navigate to post or open post detail
        break;
      case "note":
        navigate(`/notes`);
        break;
      default:
        break;
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case "user":
        return "👤";
      case "post":
        return "📝";
      case "note":
        return "📚";
      default:
        return "✨";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50">
      {/* LEFT: Logo & Mobile Menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className=" p-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 
          className="text-3xl font-extrabold flex items-center gap-3 tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-black shadow-lg shadow-zinc-500/10 text-white border border-white/10">
            N
            <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-pulse -mr-0.5 -mt-0.5 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
          </div>
          <span className={`bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 ${showFeedElements ? "hidden md:block" : "block"}`}>
            NEUTRON
          </span>
        </h1>
      </div>

      {/* CENTER: Search Bar */}
      {showFeedElements && (
      <div className="flex-1 mx-2 md:mx-4 max-w-xl" ref={searchRef}>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-0 group-focus-within:opacity-100 group-focus-within:animate-pulse transition duration-500 blur-[2px]"></div>

          {/* The Actual Input Container */}
          <div className="relative flex items-center bg-zinc-900 rounded-full group-focus-within:bg-black transition-colors">
            <Search
              className="absolute left-3 text-zinc-500 group-focus-within:text-blue-400 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search posts, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className="w-full bg-transparent border-none rounded-full py-2 pl-10 pr-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600 text-sm md:text-base relative z-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full p-1 transition-all cursor-pointer"
                type="button"
              >
                <Xmark size={16} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 flex items-center justify-center gap-2">
                  <Clock size={16} className="animate-spin" />
                  <span className="text-sm text-zinc-500">Searching...</span>
                </div>
              ) : (
                <>
                  {/* Users Results */}
                  {searchResults.users && searchResults.users.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-bold text-zinc-400 uppercase bg-zinc-800/50">
                        👤 Users ({searchResults.users.length})
                      </div>
                      {searchResults.users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleResultClick(user)}
                          className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 flex items-center gap-3"
                        >
                          <img
                            src={
                              user.avatar ||
                              "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                            }
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {user.handle}
                            </p>
                          </div>
                          {user.followers > 0 && (
                            <span className="text-xs text-zinc-500">
                              {user.followers} followers
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Posts Results */}
                  {searchResults.posts && searchResults.posts.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-bold text-zinc-400 uppercase bg-zinc-800/50">
                        📝 Posts ({searchResults.posts.length})
                      </div>
                      {searchResults.posts.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => handleResultClick(post)}
                          className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50"
                        >
                          <p className="text-sm font-semibold text-white line-clamp-1">
                            {post.title || post.desc}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {post.author && (
                              <span className="text-xs text-zinc-500">
                                by {post.author.name}
                              </span>
                            )}
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              {post.tag}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Notes Results */}
                  {searchResults.notes && searchResults.notes.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-bold text-zinc-400 uppercase bg-zinc-800/50">
                        📚 Notes ({searchResults.notes.length})
                      </div>
                      {searchResults.notes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => handleResultClick(note)}
                          className="w-full text-left px-4 py-2 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50"
                        >
                          <p className="text-sm font-semibold text-white">
                            {note.title}
                          </p>
                          <p className="text-xs text-zinc-500 line-clamp-1">
                            {note.subject}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {!searchResults.users?.length &&
                    !searchResults.posts?.length &&
                    !searchResults.notes?.length && (
                      <div className="p-4 text-center text-sm text-zinc-500">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {showFeedElements && user && (
          <button
            onClick={onOpenCreatePost}
            className="hidden md:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-all border border-white/5"
          >
            <Plus size={18} className="text-blue-400" />
            <span>Create</span>
          </button>
        )}
        {showFeedElements && user && (
          <button
            onClick={onOpenCreatePost}
            className="md:hidden p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-full"
          >
            <Plus size={20} className="text-blue-400" />
          </button>
        )}
        {showFeedElements && (
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="text-zinc-400 hover:text-white transition-colors relative"
        >
          <BellNotification size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 rounded-full border-2 border-black text-xs text-white flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        )}

        {user ? (
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/profile')}
          >
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white leading-none">
                {user.name}
              </p>
              <p className="text-[10px] text-zinc-500 leading-none mt-1">
                {user.handle}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full flex items-center justify-center" style={{ display: user.avatar ? 'none' : 'flex' }}>
                {user.name?.charAt(0)}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Key size={16} /> <span className="hidden sm:inline">Login</span>
          </button>
        )}
      </div>
      
      {/* Notifications Dropdown */}
      {showFeedElements && showNotifications && user && (
        <NotificationsDropdown 
          user={user} 
          onClose={() => {
            setShowNotifications(false);
            fetchUnreadCount(); // Refresh count when closing
          }} 
        />
      )}
    </header>
  );
};

export default Header;
