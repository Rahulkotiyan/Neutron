import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";
import {
  BookOpen,
  Newspaper,
  MessageSquare,
  Briefcase,
  Home,
  X,
  LogOut,
  User,
} from "lucide-react";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const { user, selectedCollege, logout, isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", icon: Home, path: "/portal/home" },
    { name: "Learning Resources", icon: BookOpen, path: "/portal/resources" },
    { name: "College Wall", icon: Newspaper, path: "/portal/wall" },
    { name: "Community Chat", icon: MessageSquare, path: "/portal/chat" },
    { name: "Placements", icon: Briefcase, path: "/portal/placements" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/"); // Go back to login screen
  };

  const NavItem = ({ item }) => (
    <li>
      <NavLink
        to={item.path}
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
        className={({ isActive }) =>
          `flex items-center w-full space-x-3 p-3 rounded-lg text-left transition-colors
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
        }
      >
        <item.icon size={20} />
        <span className="font-medium">{item.name}</span>
      </NavLink>
    </li>
  );

  // --- FIX IS HERE ---
  // We check for user.username (from login) or user.name (from guest)
  const userName = user ? user.username || user.name : "Guest";

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <nav
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-30 transform transition-transform duration-300 ease-in-out
                          ${
                            isSidebarOpen
                              ? "translate-x-0"
                              : "-translate-x-full"
                          }
                          lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b border-gray-700">
          <span className="text-2xl font-bold">Neutron Portal</span>
          <button
            className="lg:hidden p-1 text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-4 py-2 border-b border-gray-700 border-opacity-50">
          <span className="text-sm font-light text-gray-400">
            {selectedCollege}
          </span>
        </div>

        <ul className="flex-1 py-4 px-3 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </ul>

        <div className="p-4 border-t border-gray-700 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {/* Use the 'userName' variable we defined */}
              {user ? userName.charAt(0) : <User size={20} />}
            </div>
            <div>
              {/* Use the 'userName' variable we defined */}
              <p className="font-semibold">{userName}</p>
              {isLoggedIn && user ? (
                <p className="text-xs text-gray-400">{user.email}</p>
              ) : (
                <p className="text-xs text-gray-400">Guest Mode</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
