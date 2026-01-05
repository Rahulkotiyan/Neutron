import { Hash, Menu, Plus, Users, Settings, Send, Loader, MessageCircle, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

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
  const messagesEndRef = useRef(null);

  const API_URL = "http://localhost:5000/api";
  const college = currentUser?.college || "AIT Bangalore";

  // Fetch groups for current college
  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/groups/college/${college}`);
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
      const res = await axios.get(`${API_URL}/groups/${groupId}/messages?limit=100`);
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
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const res = await axios.post(
        `${API_URL}/groups/${activeGroup._id}/messages`,
        { text: newMessage },
        config
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
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      await axios.post(`${API_URL}/groups/${groupId}/join`, {}, config);
      fetchGroups();
    } catch (err) {
      console.error("Error joining group:", err);
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      await axios.post(`${API_URL}/groups/${groupId}/leave`, {}, config);
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
    if (!groupName.trim() || !token) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      await axios.post(
        `${API_URL}/groups`,
        { name: groupName, description: groupDescription, college },
        config
      );
      setGroupName("");
      setGroupDescription("");
      setShowCreateGroupModal(false);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const isUserInGroup = activeGroup?.members.some(m => m._id === currentUser?._id);

  return (
    <div
      className={`flex h-full bg-[#0f172a] w-full relative transition-all duration-300 pt-16 ${
        isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
      }`}
    >
      {/* Groups Sidebar */}
      <div className="w-[72px] bg-black border-r border-white/5 flex flex-col items-center py-4 space-y-4">
        {groups.map((g) => (
          <div
            key={g._id}
            onClick={() => {
              setActiveGroup(g);
              fetchMessages(g._id);
            }}
            title={g.name}
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all text-xs font-bold truncate ${
              activeGroup?._id === g._id
                ? "bg-blue-600 text-white rounded-xl"
                : "bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white hover:rounded-xl"
            }`}
          >
            {g.name.substring(0, 2).toUpperCase()}
          </div>
        ))}
        <button
          onClick={() => setShowCreateGroupModal(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer bg-zinc-800 text-zinc-400 hover:bg-green-600 hover:text-white hover:rounded-xl transition-all"
          title="Create Group"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Groups List */}
      <div className="w-60 bg-[#111827] border-r border-white/5 flex flex-col hidden md:flex overflow-y-auto">
        <div className="h-14 border-b border-white/5 flex items-center px-4 font-bold text-white sticky top-0 bg-[#0f1419]">
          {college}
        </div>
        <div className="p-2 space-y-1">
          {groups.length === 0 ? (
            <div className="text-zinc-500 text-sm p-4 text-center">No groups yet</div>
          ) : (
            groups.map((g) => (
              <div
                key={g._id}
                onClick={() => {
                  setActiveGroup(g);
                  fetchMessages(g._id);
                }}
                className={`flex items-center justify-between px-2 py-2 rounded cursor-pointer transition-all ${
                  activeGroup?._id === g._id
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Hash size={16} />
                  <span className="text-sm truncate">{g.name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[#1e293b] flex flex-col">
        {activeGroup ? (
          <>
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1419]">
              <div className="flex items-center gap-2 text-white font-bold">
                <Hash size={20} />
                {activeGroup.name}
              </div>
              <div className="flex items-center gap-2">
                <button
                  title="Members"
                  className="p-2 hover:bg-zinc-700 rounded"
                >
                  <Users size={18} />
                </button>
                {isUserInGroup && (
                  <button
                    onClick={() => handleLeaveGroup(activeGroup._id)}
                    title="Leave Group"
                    className="p-2 hover:bg-red-600/20 text-red-400 rounded"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="animate-spin text-blue-500" size={32} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <MessageCircle size={48} className="mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg._id} className="flex gap-3 group">
                    <img
                      src={msg.user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                      alt={msg.user?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {msg.user?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.edited && (
                          <span className="text-xs text-zinc-600">(edited)</span>
                        )}
                      </div>
                      <p className="text-zinc-300 break-words">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {isUserInGroup ? (
              <div className="p-4 border-t border-white/5">
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
                    className="flex-1 bg-[#2a3649] text-white p-3 rounded-xl outline-none focus:bg-[#3a4659]"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-xl transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-white/5 flex justify-center">
                <button
                  onClick={() => handleJoinGroup(activeGroup._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold"
                >
                  Join Group
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <MessageCircle size={48} className="mb-4 opacity-50" />
            <p>Select a group to start chatting</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] p-6 rounded-lg border border-white/10 w-96">
            <h2 className="text-xl font-bold text-white mb-4">Create New Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#2a3649] text-white p-3 rounded mb-4 outline-none focus:bg-[#3a4659]"
            />
            <textarea
              placeholder="Group Description (optional)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full bg-[#2a3649] text-white p-3 rounded mb-4 outline-none focus:bg-[#3a4659] resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsPage;