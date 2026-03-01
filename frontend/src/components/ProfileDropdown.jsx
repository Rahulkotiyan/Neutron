import { useState, useEffect, useRef } from "react";
import {
  User,
  Settings,
  LogOut,
  OpenInBrowser,
  ArrowRight,
} from "iconoir-react";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = ({ user, onClose, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleProfileClick = () => {
    navigate("/profile");
    setIsOpen(false);
    onClose();
  };

  const handleSettingsClick = () => {
    // Navigate to settings or open settings modal
    setIsOpen(false);
    onClose();
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
    onClose();
  };

  const handleVisitProfile = () => {
    navigate(`/profile/${user._id || user.id}`);
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-16 left-4 right-4 sm:right-4 sm:left-auto sm:w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden max-w-xs"
      ref={dropdownRef}
    >
      {/* Profile Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white">{user?.name}</h4>
            <p className="text-sm text-zinc-400">
              @{user?.handle || user?.email?.split("@")[0]}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {user?.college || "AIT Bangalore"}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
        >
          <User iconSize={18} className="text-zinc-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">My Profile</p>
            <p className="text-xs text-zinc-500">View and edit your profile</p>
          </div>
          <ArrowRight iconSize={16} className="text-zinc-500" />
        </button>

        <button
          onClick={handleVisitProfile}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
        >
          <OpenInBrowser iconSize={18} className="text-zinc-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Visit Public Profile
            </p>
            <p className="text-xs text-zinc-500">View your public profile</p>
          </div>
          <ArrowRight iconSize={16} className="text-zinc-500" />
        </button>

        <button
          onClick={handleSettingsClick}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
        >
          <Settings iconSize={18} className="text-zinc-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Settings</p>
            <p className="text-xs text-zinc-500">
              Account and privacy settings
            </p>
          </div>
          <ArrowRight iconSize={16} className="text-zinc-500" />
        </button>

        <div className="border-t border-zinc-800 my-2"></div>

        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left group"
        >
          <LogOut
            iconSize={18}
            className="text-zinc-400 group-hover:text-red-400"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-red-400">
              Logout
            </p>
            <p className="text-xs text-zinc-500 group-hover:text-red-400">
              Sign out of your account
            </p>
          </div>
          <ArrowRight
            iconSize={16}
            className="text-zinc-500 group-hover:text-red-400"
          />
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-800/30">
        <p className="text-xs text-zinc-500 text-center">
          Member since{" "}
          {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default ProfileDropdown;
