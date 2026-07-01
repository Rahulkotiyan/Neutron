import React, { Suspense } from "react";
import {
  Message,
  Heart,
  Calendar,
  MapPin,
  Building,
  Mail,
  Trash,
  Bookmark,
  OpenBook,
  Page,
  ArrowRight,
  Refresh,
} from "iconoir-react";
const PostCard = React.lazy(() => import("./PostCard"));
import ProfileNetwork from "./ProfileNetwork";
import ProfileEditForm from "./ProfileEditForm";

const ProfileTabs = ({
  activeTab,
  setActiveTab,
  activitySubTab,
  setActivitySubTab,
  contentSubTab,
  setContentSubTab,
  tabLoading,
  userPosts,
  setUserPosts,
  userActivity,
  userContent,
  deletingPostId,
  setDeletingPostId,
  isOwnProfile,
  navigate,
  currentUser,
  token,
  viewingUser,
  formData,
  stats,
  handleDeletePost,
  fetchUserPostsForProfile,
  error,
  success,
  isEditMode,
  saving,
  handleChange,
  handleSave,
  colleges,
  loadingColleges,
  branches,
  loadingBranches,
  setFormData,
  avatarPreview,
  bannerPreview,
  handleFileChange,
  handleFollowToggle,
  handleSettings,
  handleLogout,
  setIsEditMode,
  isFollowing,
  followLoading,
  bannerInputRef,
  avatarInputRef,
}) => {
  return (
    <>
      {/* Integrated Tabs - Stable Full-Width Design */}
      <div className="mt-4 md:mt-6 border-t border-white/5 bg-gradient-to-b from-black/20 to-black/5 px-3 md:px-6">
        <div className="flex gap-4 md:gap-12 overflow-x-auto no-scrollbar py-2">
          {[
            { id: "about", label: "About" },
            { id: "posts", label: "Posts" },
            { id: "activity", label: "Room" },
            { id: "content", label: "Resource" },
            { id: "followers", label: "Network" },
          ]
            .filter((tab) => {
              if (!isOwnProfile && (tab.id === "activity" || tab.id === "followers")) {
                return false;
              }
              if (isEditMode && tab.id !== "about") {
                return false;
              }
              return true;
            })
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-1 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap active:scale-95 min-h-[44px] ${
                  activeTab === tab.id
                    ? "text-white scale-105"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"></div>
                )}
              </button>
            ))}
        </div>
      </div>

      {/* Solid Content Surface */}
      <div className="p-3 md:p-4 bg-gradient-to-b from-black/5 to-transparent">
        {/* Alerts - Refined minimal style */}
        <div className="mb-3 md:mb-2 space-y-2">
          {error && (
            <div className="py-3 px-4 bg-red-500/5 border border-red-500/20 rounded-lg text-red-500 text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] md:text-xs font-black uppercase tracking-widest text-center">
              {success}
            </div>
          )}
        </div>

        {/* Overview Tab - Unified Sheet Approach */}
        {activeTab === "about" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
            {isEditMode && isOwnProfile ? (
              <ProfileEditForm
                formData={formData}
                handleChange={handleChange}
                handleSave={handleSave}
                saving={saving}
                colleges={colleges}
                loadingColleges={loadingColleges}
                branches={branches}
                loadingBranches={loadingBranches}
                setFormData={setFormData}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-8 space-y-8 md:space-y-16">
                  <div className="space-y-8">
                    <h3 className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-3">
                      Bio:
                    </h3>
                    <p className="text-white text-3xl font-bold tracking-tight leading-relaxed max-w-3xl">
                      {formData.bio ||
                        "No information synced to this terminal."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 py-8 border-y border-white/5">
                    <div className="space-y-8">
                      <h3 className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.4em]">
                        Academic Foundation
                      </h3>
                      <div className="space-y-6">
                        {[
                          {
                            label: "College",
                            value: formData.college,
                            icon: <Building iconSize={14} />,
                          },
                          {
                            label: "Branch",
                            value: formData.branch,
                            icon: <OpenBook iconSize={14} />,
                          },
                          {
                            label: "Semester",
                            value: formData.semester,
                            icon: <Calendar iconSize={14} />,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex flex-col gap-1"
                          >
                            <span className="text-[10px] md:text-xs font-black uppercase text-zinc-600 tracking-widest">
                              {item.label}
                            </span>
                            <span className="text-white font-bold text-lg">
                              {item.value || "---"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-8">
                      <h3 className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.4em]">
                        Network Access
                      </h3>
                      <div className="space-y-6">
                        {[
                          {
                            label: "City",
                            value: formData.city,
                            icon: <MapPin iconSize={14} />,
                          },
                          {
                            label: "Mail Uplink",
                            value: viewingUser?.email,
                            icon: <Mail iconSize={14} />,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex flex-col gap-1"
                          >
                            <span className="text-[10px] md:text-xs font-black uppercase text-zinc-600 tracking-widest">
                              {item.label}
                            </span>
                            <span className="text-white font-bold text-lg">
                              {item.value || "---"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isEditMode && (
          <>
            {/* Posts Tab */}
            {activeTab === "posts" && (
              <div className="space-y-6">
                {userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <Message
                      width={48}
                      height={48}
                      className="mx-auto text-zinc-600 mb-4"
                    />
                    <p className="text-zinc-400">
                      No posts yet. Create your first post!
                    </p>
                  </div>
                ) : (
                  userPosts.map((post) => (
                    <div key={post._id} className="relative group">
                      <Suspense fallback={<div className="h-48 bg-zinc-800/30 rounded-lg animate-pulse" />}>
                        <PostCard
                          post={post}
                          currentUser={currentUser}
                          apiBaseUrl={import.meta.env.VITE_API_URL || "http://localhost:5000"}
                        />
                      </Suspense>
                      {post.author?._id === currentUser._id && (
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          disabled={deletingPostId === post._id}
                          className="absolute top-6 right-6 p-3 bg-red-600 hover:bg-red-700 disabled:bg-red-700/50 text-white rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 active:scale-95 min-h-[44px]"
                          title="Delete post"
                        >
                          {deletingPostId === post._id ? (
                            <Refresh iconSize={18} className="animate-spin" />
                          ) : (
                            <Trash iconSize={18} />
                          )}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Room / Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                      <Message iconSize={24} className="text-gray-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        Activity Room
                      </h2>
                      <p className="text-gray-500 text-sm font-medium">
                        Track your interactions and engagement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar iconSize={16} />
                    <span>Last 30 days</span>
                  </div>
                </div>

                {/* Activity Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: "liked", label: "Upvoted", count: userActivity.likedPosts?.length || 0, icon: Heart, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                    { id: "disliked", label: "Downvoted", count: userActivity.dislikedPosts?.length || 0, icon: Heart, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400", rotate: "rotate-180" },
                    { id: "comments", label: "Comments", count: userActivity.comments?.length || 0, icon: Message, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                    { id: "saved", label: "Saved", count: userActivity.savedPosts?.length || 0, icon: Bookmark, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                    { id: "starredTools", label: "Starred Tools", count: userActivity.starredTools?.length || 0, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-yellow-400" },
                    { id: "likedNotes", label: "Liked Notes", count: userActivity.likedNotes?.length || 0, icon: Heart, color: "bg-gray-900/50", borderColor: "border-gray-800", iconColor: "text-gray-400" },
                  ].map((stat) => (
                    <button
                      key={stat.id}
                      onClick={() => setActivitySubTab(stat.id)}
                      className={`p-6 ${stat.color} border ${stat.borderColor} rounded-2xl transition-all hover:scale-105 active:scale-95 min-h-[44px] ${
                        activitySubTab === stat.id ? "ring-2 ring-gray-600 shadow-lg" : "hover:shadow-lg hover:bg-gray-900/70"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 bg-black/50 rounded-xl ${stat.rotate || ""}`}>
                          {stat.id === "starredTools" ? (
                            <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ) : (
                            <stat.icon iconSize={20} className={stat.iconColor} />
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-black text-white mb-1">
                            {stat.count}
                          </p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active Filter Indicator */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/30 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    {activitySubTab === "liked" && <Heart iconSize={16} className="text-gray-400" />}
                    {activitySubTab === "disliked" && <Heart iconSize={16} className="text-gray-400 rotate-180" />}
                    {activitySubTab === "comments" && <Message iconSize={16} className="text-gray-400" />}
                    {activitySubTab === "saved" && <Bookmark iconSize={16} className="text-gray-400" />}
                    {activitySubTab === "starredTools" && (
                      <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                    {activitySubTab === "likedNotes" && <Heart iconSize={16} className="text-gray-400" />}
                  </div>
                  <span className="text-white font-medium capitalize">
                    {activitySubTab === "liked" && "Upvoted Posts"}
                    {activitySubTab === "disliked" && "Downvoted Posts"}
                    {activitySubTab === "comments" && "Commented Posts"}
                    {activitySubTab === "saved" && "Saved Posts"}
                    {activitySubTab === "starredTools" && "Starred Tools"}
                    {activitySubTab === "likedNotes" && "Liked Notes"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({activitySubTab === "liked" && (userActivity.likedPosts?.length || 0)}
                    {activitySubTab === "disliked" && (userActivity.dislikedPosts?.length || 0)}
                    {activitySubTab === "comments" && (userActivity.comments?.length || 0)}
                    {activitySubTab === "saved" && (userActivity.savedPosts?.length || 0)}
                    {activitySubTab === "starredTools" && (userActivity.starredTools?.length || 0)}
                    {activitySubTab === "likedNotes" && (userActivity.likedNotes?.length || 0)} items)
                  </span>
                </div>

                {/* Activity Content */}
                <div className="space-y-4">
                  {tabLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 border-2 border-gray-800 border-t-gray-500 rounded-full animate-spin mb-4"></div>
                      <span className="text-gray-500 text-sm font-medium">Loading activity...</span>
                    </div>
                  ) : (
                    <>
                      {/* Upvoted Posts */}
                      {activitySubTab === "liked" && (
                        <div className="space-y-4">
                          {userActivity.likedPosts?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <Heart iconSize={48} className="text-gray-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No upvoted posts yet</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Start engaging with content you find interesting. Your upvoted posts will appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {userActivity.likedPosts.map((post) => (
                                <div
                                  key={post._id}
                                  onClick={() => navigate(`/post/${post._id}`)}
                                  className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                          <Heart iconSize={16} className="text-gray-400 fill-current" />
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                          Upvoted
                                        </span>
                                      </div>
                                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                        {post.title || "Untitled Post"}
                                      </h4>
                                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {post.desc}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                            {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                          </div>
                                          <span>{post.author?.name || "Unknown"}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                      <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Downvoted Posts */}
                      {activitySubTab === "disliked" && (
                        <div className="space-y-4">
                          {userActivity.dislikedPosts?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <Heart iconSize={48} className="text-gray-400 rotate-180" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No downvoted posts</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Posts you downvote will be hidden from your feed and listed here for reference.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {userActivity.dislikedPosts.map((post) => (
                                <div
                                  key={post._id}
                                  onClick={() => navigate(`/post/${post._id}`)}
                                  className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                          <Heart iconSize={16} className="text-gray-400 fill-current rotate-180" />
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                          Downvoted
                                        </span>
                                      </div>
                                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                        {post.title || "Untitled Post"}
                                      </h4>
                                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {post.desc}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                            {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                          </div>
                                          <span>{post.author?.name || "Unknown"}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                      <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comments */}
                      {activitySubTab === "comments" && (
                        <div className="space-y-4">
                          {userActivity.comments?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <Message iconSize={48} className="text-gray-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No comments yet</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Join the conversation! Your commented posts will appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {userActivity.comments.map((post) => (
                                <div
                                  key={post._id}
                                  onClick={() => navigate(`/post/${post._id}`)}
                                  className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                          <Message iconSize={16} className="text-gray-400" />
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                          Commented
                                        </span>
                                      </div>
                                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                        {post.title || "Untitled Post"}
                                      </h4>
                                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {post.desc}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                            {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                          </div>
                                          <span>{post.author?.name || "Unknown"}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                      <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Saved Posts */}
                      {activitySubTab === "saved" && (
                        <div className="space-y-4">
                          {userActivity.savedPosts?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <Bookmark iconSize={48} className="text-gray-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No saved posts</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Save posts to read later. Your saved collection will appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {userActivity.savedPosts.map((post) => (
                                <div
                                  key={post._id}
                                  onClick={() => navigate(`/post/${post._id}`)}
                                  className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                          <Bookmark iconSize={16} className="text-gray-400 fill-current" />
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                          Saved
                                        </span>
                                      </div>
                                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                        {post.title || "Untitled Post"}
                                      </h4>
                                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {post.desc}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                            {post.author?.name?.charAt(0).toUpperCase() || "U"}
                                          </div>
                                          <span>{post.author?.name || "Unknown"}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4">
                                      <ArrowRight iconSize={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Starred Tools */}
                      {activitySubTab === "starredTools" && (
                        <div className="space-y-4">
                          {userActivity.starredTools?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <svg className="w-12 h-12 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No starred tools</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Star tools you find useful. Your starred tools will appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {userActivity.starredTools.map((tool) => (
                                <div
                                  key={tool._id}
                                  className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                          <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                          </svg>
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                          Starred Tool
                                        </span>
                                        {tool.starCount > 0 && (
                                          <span className="text-xs text-gray-500">{tool.starCount} stars</span>
                                        )}
                                      </div>
                                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                        {tool.title}
                                      </h4>
                                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {tool.description}
                                      </p>
                                    </div>
                                    <a
                                      href={tool.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all active:scale-95 min-h-[44px]"
                                    >
                                      Open
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Liked Notes */}
                      {activitySubTab === "likedNotes" && (
                        <div className="space-y-4">
                          {userActivity.likedNotes?.length === 0 ? (
                            <div className="text-center py-12 px-8">
                              <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                                <Heart iconSize={48} className="text-gray-400" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">No liked notes</h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                Like notes you find helpful. Your liked notes will appear here.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {userActivity.likedNotes.map((note) => (
                                <div
                                  key={note._id}
                                  className="group p-6 bg-gray-900/30 border border-gray-800 rounded-2xl hover:bg-gray-900/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                          <Heart iconSize={16} className="text-gray-400 fill-current" />
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                          Liked Note
                                        </span>
                                        {note.likeCount > 0 && (
                                          <span className="text-xs text-gray-500">{note.likeCount} likes</span>
                                        )}
                                      </div>
                                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors line-clamp-2">
                                        {note.title}
                                      </h4>
                                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {note.description || note.subject}
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-gray-600">
                                        {note.subject && (
                                          <>
                                            <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400">
                                              {note.subject}
                                            </span>
                                          </>
                                        )}
                                        {note.semester && (
                                          <span>Sem {note.semester}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Resource / Content Tab */}
            {activeTab === "content" && (
              <div className="space-y-6">
                {tabLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-2 border-gray-800 border-t-gray-500 rounded-full animate-spin mb-4"></div>
                    <span className="text-gray-500 text-sm font-medium">Loading resources...</span>
                  </div>
                ) : (
                  <>
                    {/* Notes Section */}
                    {userContent.notes?.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                          <div className="p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <Page iconSize={20} className="text-gray-400" />
                          </div>
                          <div className="text-center md:text-left">
                            <h3 className="text-lg md:text-xl font-bold text-white">Your Notes</h3>
                            <p className="text-gray-500 text-xs md:text-sm">Resources you've uploaded to the library</p>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          {userContent.notes.map((note) => (
                            <div
                              key={note._id}
                              onClick={() => window.open(note.fileUrl, '_blank')}
                              className="p-6 bg-black border border-gray-800 rounded-xl hover:bg-gray-900 transition-all cursor-pointer group active:scale-95"
                            >
                              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                                    <div className="p-2 bg-gray-900 rounded-lg border border-gray-700">
                                      <Page iconSize={16} className="text-gray-500" />
                                    </div>
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                      {note.documentType || "DOCUMENT"}
                                    </span>
                                    {note.subject && (
                                      <span className="text-xs px-2 py-1 bg-gray-900 text-gray-500 rounded-full border border-gray-700">
                                        {note.subject}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-white font-bold text-lg mb-2 group-hover:text-gray-300 transition-colors">
                                    {note.title || "Untitled Note"}
                                  </h4>
                                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                    {note.description || "No description provided"}
                                  </p>

                                  {/* File Information */}
                                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600 mb-4">
                                    <span>📄 {note.fileName || "document.pdf"}</span>
                                    {note.fileSize && <span>•</span>}
                                    {note.fileSize && <span>{(note.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                                  </div>

                                  {/* Metadata */}
                                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-gray-600">
                                    <span>Uploaded {new Date(note.createdAt).toLocaleDateString()}</span>
                                    {note.semester && <span>•</span>}
                                    {note.semester && <span>Semester {note.semester}</span>}
                                    {note.branch && <span>•</span>}
                                    {note.branch && <span>{note.branch}</span>}
                                    <span>•</span>
                                    <span>{note.views || 0} views</span>
                                  </div>

                                  {/* Tags */}
                                  {note.tags && note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {note.tags.map((tag, index) => (
                                        <span
                                          key={index}
                                          className="text-xs px-2 py-1 bg-gray-900 text-gray-500 rounded-full border border-gray-700"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-4 md:mt-0">
                                  <ArrowRight iconSize={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {(!userContent.notes?.length) && (
                      <div className="text-center py-16">
                        <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
                          <Page iconSize={48} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No resources uploaded yet</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          Visit the Notes Library to upload your study materials, notes, and resources. They will appear here.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Network Section */}
            {activeTab === "followers" && (
              <ProfileNetwork stats={stats} navigate={navigate} />
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ProfileTabs;
