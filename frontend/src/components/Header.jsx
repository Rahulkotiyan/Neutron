import React, { useContext } from "react";
import AuthContext from "../context/AuthContext.jsx";
import { Search, Menu,Atom } from "lucide-react";
import { useLocation } from "react-router-dom";


export default function Header({ setIsSidebarOpen }) {
  const { user, searchQuery, setSearchQuery } = useContext(AuthContext);
  const userName = user ? user.username || user.name : "?";
  const location = useLocation();

  // Only show search bar on Home (Resources) page to avoid confusion
  const showSearch = location.pathname === "/home" || location.pathname === "/";

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6 z-10">
      <button
        className="lg:hidden text-gray-600"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Atom size={28} />
      </button>
      <div className="hidden md:block flex-1 max-w-2xl mx-auto">
        {showSearch && (
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={20} className="text-gray-400" />
            </span>
            {/* --- CONNECTED SEARCH INPUT --- */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by subject..."
              className="pl-10 pr-4 py-2 w-full rounded-full bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-black"
            />
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm">
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  );
}