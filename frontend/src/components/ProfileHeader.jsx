import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Camera,
  MoreHoriz,
  Settings,
  LogOut,
} from "iconoir-react";

const ProfileHeader = ({
  viewingUser,
  currentUser,
  stats,
  isOwnProfile,
  isEditMode,
  formData,
  bannerPreview,
  avatarPreview,
  navigate,
  handleFileChange,
  handleFollowToggle,
  handleSettings,
  handleLogout,
  setIsEditMode,
  setActiveTab,
  isFollowing,
  followLoading,
  bannerInputRef,
  avatarInputRef,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Banner with Avatar inside */}
      <div className="h-20 md:h-48 bg-[#070708] relative group/banner">
        <input
          type="file"
          ref={bannerInputRef}
          onChange={(e) => handleFileChange(e, "banner")}
          className="hidden"
          accept="image/*"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-20 p-3 bg-black/40 backdrop-blur-xl hover:bg-white/10 rounded-full transition-all border border-white/10 shadow-2xl active:scale-95 min-h-[44px]"
        >
          <ArrowLeft iconSize={20} className="text-white" />
        </button>

        {isOwnProfile && isEditMode && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute inset-0 z-20 bg-black/40 hover:bg-black/50 flex items-center justify-center transition-all active:scale-95"
          >
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
              <Camera iconSize={24} />
            </div>
          </button>
        )}

        {bannerPreview || viewingUser?.banner ? (
          <img
            src={bannerPreview || viewingUser.banner}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-[#070708] to-black"></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>

        {/* Avatar - absolute bottom-left inside banner */}
        <div className="absolute -bottom-10 md:-bottom-16 left-4 md:left-8 z-30">
          <input
            type="file"
            ref={avatarInputRef}
            onChange={(e) => handleFileChange(e, "avatar")}
            className="hidden"
            accept="image/*"
          />
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-black border-[4px] md:border-[6px] border-[#0a0a0a] flex items-center justify-center text-xl md:text-4xl font-black text-white shadow-premium overflow-hidden relative group/avatar">
            {avatarPreview || viewingUser?.avatar ? (
              <img
                src={avatarPreview || viewingUser.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (viewingUser?.name || currentUser.name)
                ?.charAt(0)
                .toUpperCase()
            )}
            {isOwnProfile && isEditMode && (
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-white/20 backdrop-blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center z-20 cursor-pointer"
              >
                <Camera iconSize={32} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats + Action Buttons row (below banner) */}
      <div className="px-3 md:px-6 pt-4 relative z-10">
        <div className="flex items-center gap-3 md:gap-6 ml-[calc(5rem+8px)] md:ml-[calc(8rem+12px)] mt-2">
          {/* Stats */}
          <div className="flex gap-3 md:gap-6">
            <div
              onClick={() => setActiveTab("followers")}
              className="cursor-pointer group/stat flex flex-col items-center md:items-start active:scale-95 min-h-[44px]"
            >
              <div className="text-lg md:text-2xl font-black text-white group-hover/stat:text-white/80 transition-colors">
                {stats.followersCount}
              </div>
              <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-500">
                Followers
              </div>
            </div>
            <div
              onClick={() => setActiveTab("following")}
              className="cursor-pointer group/stat flex flex-col items-center md:items-start active:scale-95 min-h-[44px]"
            >
              <div className="text-lg md:text-2xl font-black text-white group-hover/stat:text-white/80 transition-colors">
                {stats.followingCount}
              </div>
              <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-500">
                Following
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ml-auto">
            {!isOwnProfile ? (
              <button
                onClick={handleFollowToggle}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 min-h-[44px] ${
                  isFollowing
                    ? "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                    : "bg-white text-black hover:bg-white/90 shadow-premium"
                }`}
              >
                {isFollowing ? "Connected" : "Connect"}
              </button>
            ) : (
              <>
                {/* Mobile: three-dot menu */}
                <div className="relative md:hidden" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95 min-h-[44px]"
                  >
                    <MoreHoriz iconSize={20} className="text-white" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          const next = !isEditMode;
                          setIsEditMode(next);
                          if (next) setActiveTab("about");
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest border-b border-white/5 active:scale-95 min-h-[44px]"
                      >
                        {isEditMode ? "Exit Edit Mode" : "Edit Profile"}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleSettings();
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest border-b border-white/5 flex items-center gap-2 active:scale-95 min-h-[44px]"
                      >
                        <Settings iconSize={14} /> Settings
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-white/5 text-xs font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 min-h-[44px]"
                      >
                        <LogOut iconSize={14} /> Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop: inline buttons */}
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => {
                      const next = !isEditMode;
                      setIsEditMode(next);
                      if (next) setActiveTab("about");
                    }}
                    className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest text-white transition-all text-center active:scale-95 min-h-[44px]"
                  >
                    {isEditMode ? "Exit Edit Mode" : "Edit Profile"}
                  </button>
                  <button
                    onClick={handleSettings}
                    className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest text-white transition-all text-center flex items-center justify-center gap-2 active:scale-95 min-h-[44px]"
                  >
                    <Settings iconSize={16} />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 sm:px-6 py-2.5 sm:py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest text-red-400 transition-all text-center flex items-center justify-center gap-2 active:scale-95 min-h-[44px]"
                  >
                    <LogOut iconSize={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-3 md:px-6 pb-3 mt-16 md:mt-24">
        <div className="space-y-3 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {viewingUser?.name}
          </h2>
          <p className="text-zinc-500 font-black text-xs md:text-sm tracking-widest italic">
            {viewingUser?.handle || "@" + viewingUser?.username}
          </p>
          {formData.shortBio && (
            <p className="text-white text-base md:text-lg max-w-2xl leading-relaxed font-medium mx-auto md:mx-0">
              {formData.shortBio}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
