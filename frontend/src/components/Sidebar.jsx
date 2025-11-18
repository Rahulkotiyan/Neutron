import React, { useContext } from "react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";
import { LayoutGrid, ChevronLeft ,Atom} from "lucide-react";
import {
  BookOpen,
  Newspaper,
  MessageSquare,
  Briefcase,
  Home,
  X,
  LogOut,
  User, // We will use this icon for Profile
} from "lucide-react";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const { user, selectedCollege, logout, isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- NEW STATE FOR DESKTOP COLLAPSE ---
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "College Wall", icon: Newspaper, path: "/wall" },
    { name: "Learning Resources", icon: BookOpen, path: "/resources" },
    { name: "Placements", icon: Briefcase, path: "/placements" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/home");
  };

  const NavItem = ({ item }) => (
    <li>
      <NavLink
        to={item.path}
        end={item.path === "/home"}
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
        className={({ isActive }) =>
          `flex items-center w-full space-x-3 p-3 rounded-lg text-left transition-colors
          ${isCollapsed ? "justify-center" : ""} 
          ${
            isActive
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`
        }
      >
        <item.icon size={20} />
        {/* --- Text is now conditional --- */}
        {!isCollapsed && <span className="font-medium">{item.name}</span>}
      </NavLink>
    </li>
  );

  const userName = user ? user.username || user.name : "Guest";

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* --- SIDEBAR NAV --- */}
      <nav
        className={`fixed lg:static inset-y-0 left-0 bg-gray-900 text-white flex flex-col z-30 
                  transition-all duration-300 ease-in-out
                  w-64 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                  lg:translate-x-0 ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Logo / Brand */}
        <div
          className={`flex items-center h-16 border-b border-gray-700 px-4 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Atom className="w-7 h-7 text-white" />
            {!isCollapsed && (
              <span className="text-2xl font-bold">Neutron Portal</span>
            )}
          </div>
          <button
            className="lg:hidden p-1 text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* College Name */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-b border-gray-700 border-opacity-50">
            <span className="text-sm font-light text-gray-400">
              {selectedCollege}
            </span>
          </div>
        )}

        {/* Nav Links */}
        <ul className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </ul>

        {/* User Info & Toggle Button */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          <div
            className={`flex items-center space-x-3 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold flex-shrink-0">
              {user ? userName.charAt(0) : <User size={20} />}
            </div>
            {/* --- User name/email is now conditional --- */}
            {!isCollapsed && (
              <div>
                <p className="font-semibold">{userName}</p>
                {isLoggedIn ? (
                  <p className="text-xs text-gray-400">{user.email}</p>
                ) : (
                  <p className="text-xs text-gray-400">Guest Mode</p>
                )}
              </div>
            )}
          </div>

          {/* --- Logout Button --- */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className={`w-full flex items-center space-x-2 p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <LogOut size={16} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          )}

          {/* --- NEW COLLAPSE TOGGLE BUTTON --- */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-full p-2 text-gray-400 hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft
              size={20}
              className={`transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </nav>
    </>
  );
}