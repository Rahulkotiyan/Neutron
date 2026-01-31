import {
  Hash,
  Menu,
  Plus,
  Users,
  Settings,
  Send,
  Loader,
  MessageCircle,
  LogOut,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../utils/api";
import GroupBoost from "./GroupBoost";
import GroupStories from "./GroupStories";
import GroupAnalytics from "./GroupAnalytics";

const GroupsPage = ({ isSidebarOpen, currentUser, token }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const college = currentUser?.college || "AIT Bangalore";

  // Fetch groups for current college
  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get(`/groups/college/${college}`);
      setGroups(res.data);
      if (res.data.length > 0 && !activeGroup) {
        setActiveGroup(res.data[0]);
        fetchMessages(res.data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  // Fetch messages for a group
  const fetchMessages = async (groupId) => {
    if (!groupId) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/groups/${groupId}/messages?limit=100`);
      setMessages(res.data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeGroup || !token) return;

    try {
      const res = await api.post(
        `/groups/${activeGroup._id}/messages`,
        { text: newMessage }
      );
      setMessages([...messages, res.data]);
      setNewMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Join group
  const handleJoinGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      fetchGroups();
    } catch (err) {
      console.error("Error joining group:", err);
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/leave`);
      if (activeGroup?._id === groupId) {
        setActiveGroup(null);
        setMessages([]);
      }
      fetchGroups();
    } catch (err) {
      console.error("Error leaving group:", err);
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (!token) {
      alert(
        "You must be logged in to create a group. Please log in and try again."
      );
      return;
    }

    try {
      const response = await api.post(
        "/groups",
        { name: groupName, description: groupDescription, college }
      );
      console.log("Group created:", response.data);
      setGroupName("");
      setGroupDescription("");
      setShowCreateGroupModal(false);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err.response?.data || err.message);
      alert(
        `Error creating group: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const isUserInGroup = activeGroup?.members.some(
    (m) => m._id === currentUser?._id
  );

  return (
    <div className={`flex min-h-screen bg-zinc-950 w-full relative ${isSidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="p-2 bg-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Groups Sidebar */}
      <div className={` ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-72 lg:w-80 h-full bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 z-40 lg:z-auto flex flex-col`}>
        <div className="p-3 sm:p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white">Groups</h2>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="lg:hidden p-1 hover:bg-zinc-800 rounded text-zinc-400"
            >
              <X size={20} />
            </button>
          </div>

          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Plus size={16} />
            Create Group
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto mb-3 text-zinc-500" />
              <p className="text-sm text-zinc-400">No groups yet</p>
              <p className="text-xs text-zinc-500 mt-1">Create your first group!</p>
            </div>
          ) : (
            <div className="space-y-1 sm:space-y-2">
              {groups.map((g) => (
                <div
                  key={g._id}
                  onClick={() => {
                    setActiveGroup(g);
                    fetchMessages(g._id);
                    setShowMobileSidebar(false);
                  }}
                  className={`flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 rounded-lg cursor-pointer transition-all ${
                    activeGroup?._id === g._id
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Hash size={14} className="flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{g.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-zinc-900 flex flex-col min-h-0">
        {activeGroup ? (
          <>
            {/* Header */}
            <div className="h-14 sm:h-16 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-4 lg:px-6 bg-zinc-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base min-w-0">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-1 hover:bg-zinc-700 rounded text-zinc-400"
                >
                  <Menu size={16} />
                </button>
                <Hash size={16} className="flex-shrink-0 text-zinc-400" />
                <span className="truncate">{activeGroup.name}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  title="Analytics"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="p-1.5 sm:p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-600"
                >
                  <Settings size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  title="Members"
                  className="p-1.5 sm:p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-600"
                >
                  <Users size={14} className="sm:w-4 sm:h-4" />
                </button>
                {isUserInGroup && (
                  <button
                    onClick={() => handleLeaveGroup(activeGroup._id)}
                    title="Leave Group"
                    className="p-1.5 sm:p-2 hover:bg-red-600/20 text-red-400 rounded transition-colors border border-transparent hover:border-red-500/30"
                  >
                    <LogOut size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Free Features Section */}
            <div className="border-b border-zinc-800 bg-zinc-800/50">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {/* Group Boost */}
                <GroupBoost
                  groupId={activeGroup._id}
                  groupName={activeGroup.name}
                  currentBoostLevel={activeGroup.boostLevel || 0}
                  onBoostSuccess={(data) => {
                    setActiveGroup((prev) => ({
                      ...prev,
                      boostLevel: data.group.boostLevel,
                      boostCount: data.group.boostCount,
                      boostFeatures: data.group.boostFeatures,
                    }));
                  }}
                />

                {/* Group Stories */}
                <GroupStories
                  groupId={activeGroup._id}
                  groupName={activeGroup.name}
                  userCanPost={true}
                  maxStoriesPerDay={999}
                />
              </div>
            </div>

            {/* Analytics Section */}
            {showAnalytics && (
              <div className="border-b border-zinc-800 bg-zinc-800/50">
                <div className="p-3 sm:p-4">
                  <GroupAnalytics
                    groupId={activeGroup._id}
                    groupName={activeGroup.name}
                  />
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3 lg:space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader
                    className="animate-spin text-blue-500 w-6 h-6 sm:w-8 sm:h-8"
                    size={24}
                  />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <MessageCircle
                    size={32}
                    className="mb-3 sm:mb-4 opacity-50"
                  />
                  <p className="text-sm sm:text-base">No messages yet</p>
                  <p className="text-xs sm:text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className="flex gap-2 sm:gap-3 group">
                    <img
                      src={
                        msg.user?.avatar ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                      }
                      alt={msg.user?.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-xs sm:text-sm md:text-base">
                          {msg.user?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.edited && (
                          <span className="text-xs text-zinc-600">
                            (edited)
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {isUserInGroup ? (
              <div className="p-3 sm:p-4 border-t border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Message #${activeGroup.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-zinc-800 text-white px-2 sm:px-3 py-2 sm:py-3 rounded-xl outline-none focus:bg-zinc-700 text-xs sm:text-sm border border-zinc-700 focus:border-blue-500/50 placeholder-zinc-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 sm:p-3 rounded-xl transition-all flex-shrink-0 border border-blue-500 hover:border-blue-400"
                  >
                    <Send size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 border-t border-zinc-800 flex justify-center">
                <button
                  onClick={() => handleJoinGroup(activeGroup._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full font-semibold text-xs sm:text-sm border border-blue-500 hover:border-blue-400"
                >
                  Join Group
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 px-3 sm:px-4 min-h-full">
            <MessageCircle
              size={32}
              className="mb-3 sm:mb-4 opacity-50"
            />
            <p className="text-xs sm:text-base text-center">
              Select a group to start chatting
            </p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Create New Group
              </h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg outline-none focus:bg-zinc-700 border border-zinc-700 focus:border-blue-500/50 placeholder-zinc-500 text-sm sm:text-base"
              />
              <textarea
                placeholder="Group Description (Optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full bg-zinc-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg outline-none focus:bg-zinc-700 border border-zinc-700 focus:border-blue-500/50 placeholder-zinc-500 text-sm sm:text-base resize-none"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm border border-blue-500 hover:border-blue-400"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm border border-zinc-600 hover:border-zinc-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
