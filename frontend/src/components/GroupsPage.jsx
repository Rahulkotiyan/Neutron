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
  Mic,
  Video,
  Phone,
  Bell,
  Pin,
  Search,
  AtSign,
  Shield,
  UserPlus,
  Edit3,
  Volume2,
  VolumeX,
  Crown,
  ChevronDown,
  ChevronRight,
  Hash as HashIcon,
  Volume as VolumeIcon,
  User as UserIcon,
  Gift,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../utils/api";

const GroupsPage = ({ isSidebarOpen, currentUser, token }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showChannelCategories, setShowChannelCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("text");
  const [channelCategory, setChannelCategory] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [userStatus, setUserStatus] = useState("online");
  const [notifications, setNotifications] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const college = currentUser?.college || "AIT Bangalore";

  // Fetch groups for current college
  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 5000);
    return () => clearInterval(interval);
  }, []);

  // Set default channel when group changes
  useEffect(() => {
    if (activeGroup && activeGroup.channels && activeGroup.channels.length > 0) {
      setActiveChannel(activeGroup.channels[0]);
      fetchMessages(activeGroup.channels[0]._id);
    }
  }, [activeGroup]);

  // Enhanced fetch groups with real channels from backend
  const fetchGroups = async () => {
    try {
      const res = await api.get(`/groups/college/${college}`);
      const groupsWithChannels = res.data.map(group => ({
        ...group,
        channels: group.channels || [], // Use real channels from backend
        roles: group.roles || [
          { _id: "owner", name: "Owner", color: "#f472b6", permissions: ["*"], position: 0 },
          { _id: "admin", name: "Admin", color: "#8b5cf6", permissions: ["manage_channels", "kick_members", "ban_members"], position: 1 },
          { _id: "moderator", name: "Moderator", color: "#3b82f6", permissions: ["manage_messages", "mute_members"], position: 2 },
          { _id: "member", name: "Member", color: "#10b981", permissions: ["send_messages", "read_messages"], position: 3 },
        ],
        members: group.members || [],
        onlineMembers: group.onlineMembers || 0, // Use real online count from backend
      }));
      setGroups(groupsWithChannels);
      if (groupsWithChannels.length > 0 && !activeGroup) {
        setActiveGroup(groupsWithChannels[0]);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  // Fetch messages for a channel
  const fetchMessages = async (channelId) => {
    if (!channelId) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/groups/channel/${channelId}/messages?limit=100`);
      setMessages(res.data || []);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]); // Empty array instead of mock data
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message with enhanced features
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChannel || !token) return;

    const messageData = {
      content: newMessage,
      channelId: activeChannel._id,
      type: 'DEFAULT',
      mentions: [],
      attachments: [],
    };

    try {
      const res = await api.post(`/groups/channel/${activeChannel._id}/messages`, messageData);
      const newMsg = {
        ...res.data,
        user: currentUser,
        timestamp: new Date().toISOString(),
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Error sending message:", err);
      // Show error to user instead of fallback
      alert("Failed to send message. Please try again.");
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && activeChannel && token) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('channelId', activeChannel._id);
      
      try {
        const res = await api.post(`/groups/channel/${activeChannel._id}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        // Add file message to chat
        const newMsg = {
          ...res.data,
          user: currentUser,
          timestamp: new Date().toISOString(),
        };
        setMessages([...messages, newMsg]);
      } catch (err) {
        console.error("Error uploading file:", err);
        alert("Failed to upload file. Please try again.");
      }
    }
  };

  // Handle user role management
  const handleRoleAssignment = async (userId, roleId) => {
    if (!activeGroup || !token) return;
    
    try {
      await api.post(`/groups/${activeGroup._id}/roles/assign`, {
        userId,
        roleId,
      });
      // Refresh group data to update roles
      fetchGroups();
    } catch (err) {
      console.error("Error assigning role:", err);
      alert("Failed to assign role. Please try again.");
    }
  };

  // Handle channel creation
  const handleCreateChannel = async () => {
    if (!channelName.trim() || !activeGroup || !token) return;

    const newChannel = {
      name: channelName,
      type: channelType,
      category: channelCategory || "TEXT CHANNELS",
      groupId: activeGroup._id,
    };

    try {
      const res = await api.post(`/groups/${activeGroup._id}/channels`, newChannel);
      setActiveGroup(prev => ({
        ...prev,
        channels: [...prev.channels, res.data],
      }));
      setChannelName("");
      setChannelType("text");
      setChannelCategory("");
      setShowCreateChannelModal(false);
    } catch (err) {
      console.error("Error creating channel:", err);
      alert("Failed to create channel. Please try again.");
    }
  };

  // Handle invite generation
  const handleGenerateInvite = async () => {
    if (!activeGroup || !token) return;
    
    try {
      const res = await api.post(`/groups/${activeGroup._id}/invite`, {
        maxUses: 10,
        expiresIn: 86400, // 24 hours
      });
      
      // Copy invite link to clipboard
      const inviteLink = `${window.location.origin}/invite/${res.data.inviteCode}`;
      await navigator.clipboard.writeText(inviteLink);
      alert(`Invite link copied to clipboard!\n${inviteLink}`);
      setShowInviteModal(false);
    } catch (err) {
      console.error("Error generating invite:", err);
      alert("Failed to generate invite. Please try again.");
    }
  };

  // Handle message reactions
  const handleAddReaction = async (messageId, emoji) => {
    if (!token) return;
    
    try {
      await api.post(`/groups/channel/${activeChannel._id}/messages/${messageId}/reactions`, {
        emoji: emoji
      });
      fetchMessages(activeChannel._id); // Refresh messages
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  // Handle message editing
  const handleEditMessage = async (messageId, newContent) => {
    if (!token) return;
    
    try {
      await api.put(`/groups/channel/${activeChannel._id}/messages/${messageId}`, {
        content: newContent
      });
      fetchMessages(activeChannel._id); // Refresh messages
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    if (!token) return;
    
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await api.delete(`/groups/channel/${activeChannel._id}/messages/${messageId}`);
        fetchMessages(activeChannel._id); // Refresh messages
      } catch (err) {
        console.error("Error deleting message:", err);
      }
    }
  };

  // Handle message pinning
  const handlePinMessage = async (messageId) => {
    if (!token) return;
    
    try {
      await api.post(`/groups/channel/${activeChannel._id}/messages/${messageId}/pin`);
      fetchMessages(activeChannel._id); // Refresh messages
    } catch (err) {
      console.error("Error pinning message:", err);
    }
  };

  // Join group
  const handleJoinGroup = async (groupId) => {
    if (!token) {
      alert("Please login to join groups.");
      return;
    }
    
    try {
      await api.post(`/groups/${groupId}/join`);
      fetchGroups();
    } catch (err) {
      console.error("Error joining group:", err);
      alert("Failed to join group. Please try again.");
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId) => {
    if (!token) return;
    
    try {
      await api.post(`/groups/${groupId}/leave`);
      if (activeGroup?._id === groupId) {
        setActiveGroup(null);
        setActiveChannel(null);
        setMessages([]);
      }
      fetchGroups();
    } catch (err) {
      console.error("Error leaving group:", err);
      alert("Failed to leave group. Please try again.");
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a server name");
      return;
    }

    if (!token) {
      alert("You must be logged in to create a server. Please log in and try again.");
      return;
    }

    try {
      const response = await api.post("/groups", {
        name: groupName,
        description: groupDescription,
        college,
        // Create default channels
        channels: [
          { name: "general", type: "text", category: "TEXT CHANNELS" },
          { name: "random", type: "text", category: "TEXT CHANNELS" },
          { name: "General", type: "voice", category: "VOICE CHANNELS" },
        ],
      });
      
      console.log("Server created:", response.data);
      setGroupName("");
      setGroupDescription("");
      setShowCreateGroupModal(false);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err.response?.data || err.message);
      alert(
        `Error creating server: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const isUserInGroup = activeGroup?.members.some(
    (m) => m._id === currentUser?._id
  );

  const getUserRoleColor = (userId) => {
    if (!activeGroup) return "text-zinc-400";
    const userRole = activeGroup.roles.find(role => 
      activeGroup.members.find(member => member._id === userId)?.roles?.includes(role._id)
    );
    return userRole ? { color: userRole.color } : "text-zinc-400";
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

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

      {/* Server Sidebar - Discord Style */}
      <div className={`${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-20 lg:w-20 h-full bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 z-40 lg:z-auto flex flex-col`}>
        {/* Server List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer group relative"
               onClick={() => setShowCreateGroupModal(true)}>
            <svg className="w-6 h-6 text-zinc-400 group-hover:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Add Server
            </div>
          </div>
          
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all cursor-pointer group relative">
            <span className="text-white font-bold">N</span>
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Neutron Campus
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-2 space-y-2">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => {
                  setActiveGroup(group);
                  setShowMobileSidebar(false);
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all cursor-pointer group relative ${
                  activeGroup?._id === group._id ? 'bg-indigo-600 rounded-xl' : 'bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                <span className="text-white font-bold text-sm">
                  {group.name.charAt(0).toUpperCase()}
                </span>
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {group.name}
                </div>
                {group.onlineMembers > 0 && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Settings */}
        <div className="p-2 space-y-2">
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer relative group">
            <Mic size={20} className="text-zinc-400 group-hover:text-zinc-300" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Voice Settings
            </div>
          </div>
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer relative group">
            <Settings size={20} className="text-zinc-400 group-hover:text-zinc-300" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              User Settings
            </div>
          </div>
        </div>
      </div>

      {/* Channel Sidebar - Discord Style */}
      <div className={`${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-60 h-full bg-zinc-800 border-r border-zinc-700 transition-transform duration-300 z-30 lg:z-auto flex flex-col`}>
        {activeGroup ? (
          <>
            {/* Server Header */}
            <div className="h-12 border-b border-zinc-700 flex items-center justify-between px-4 cursor-pointer hover:bg-zinc-700/50 transition-colors">
              <div className="flex items-center gap-2">
                <ChevronDown size={16} className="text-zinc-400" />
                <span className="text-white font-semibold">{activeGroup.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="p-1 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  <UserPlus size={16} />
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1 hover:bg-zinc-600 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto">
              {/* Text Channels */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1">
                  <button
                    onClick={() => setShowChannelCategories(!showChannelCategories)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-zinc-300 text-xs font-semibold uppercase transition-colors"
                  >
                    {showChannelCategories ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Text Channels
                  </button>
                </div>
                
                {showChannelCategories && (
                  <div className="space-y-0.5 px-2">
                    {activeGroup.channels?.filter(ch => ch.type === 'text').map((channel) => (
                      <div
                        key={channel._id}
                        onClick={() => {
                          setActiveChannel(channel);
                          fetchMessages(channel._id);
                          setShowMobileSidebar(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors group ${
                          activeChannel?._id === channel._id
                            ? 'bg-zinc-700 text-white'
                            : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300'
                        }`}
                      >
                        <HashIcon size={16} className="text-zinc-400 group-hover:text-zinc-300" />
                        <span className="text-sm">{channel.name}</span>
                        {channel.nsfw && (
                          <span className="text-xs bg-red-600/20 text-red-400 px-1 rounded">NSFW</span>
                        )}
                      </div>
                    ))}
                    
                    {/* Create Channel Button */}
                    {isUserInGroup && (
                      <button
                        onClick={() => setShowCreateChannelModal(true)}
                        className="flex items-center gap-2 px-2 py-1 rounded text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300 transition-colors group"
                      >
                        <Plus size={16} className="text-zinc-400 group-hover:text-zinc-300" />
                        <span className="text-sm">Create Channel</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Voice Channels */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1">
                  <button
                    onClick={() => setShowChannelCategories(!showChannelCategories)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-zinc-300 text-xs font-semibold uppercase transition-colors"
                  >
                    {showChannelCategories ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Voice Channels
                  </button>
                </div>
                
                {showChannelCategories && (
                  <div className="space-y-0.5 px-2">
                    {activeGroup.channels?.filter(ch => ch.type === 'voice').map((channel) => (
                      <div
                        key={channel._id}
                        className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300 transition-colors group"
                      >
                        <VolumeIcon size={16} className="text-zinc-400 group-hover:text-zinc-300" />
                        <span className="text-sm">{channel.name}</span>
                        {channel.userLimit && (
                          <span className="text-xs text-zinc-500">{channel.userLimit}</span>
                        )}
                        {channel.connectedUsers && channel.connectedUsers > 0 && (
                          <span className="text-xs text-green-400">{channel.connectedUsers}</span>
                        )}
                      </div>
                    ))}
                    {(!activeGroup.channels || activeGroup.channels.filter(ch => ch.type === 'voice').length === 0) && (
                      <div className="text-xs text-zinc-600 px-2 py-1">
                        No voice channels yet
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Member List Preview */}
              <div className="border-t border-zinc-700 pt-4">
                <div className="px-2 py-1">
                  <span className="text-zinc-400 hover:text-zinc-300 text-xs font-semibold uppercase">
                    Online — {activeGroup.onlineMembers || 0}
                  </span>
                </div>
                <div className="space-y-0.5 px-2">
                  {activeGroup.members && activeGroup.members.length > 0 ? (
                    activeGroup.members.slice(0, 5).map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">{member.name}</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-600 px-2 py-1">
                      No members online
                    </div>
                  )}
                  {activeGroup.members && activeGroup.members.length > 5 && (
                    <button
                      onClick={() => setShowMembersModal(true)}
                      className="text-xs text-zinc-400 hover:text-zinc-300 px-2 py-1 transition-colors"
                    >
                      +{activeGroup.members.length - 5} more
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <HashIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select a server to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area - Discord Style */}
      <div className="flex-1 bg-zinc-900 flex flex-col min-h-0">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-800 shadow-sm">
              <div className="flex items-center gap-2">
                <HashIcon size={20} className="text-zinc-400" />
                <span className="text-white font-semibold">{activeChannel.name}</span>
                <span className="text-zinc-400 text-sm">
                  {activeChannel.type === 'voice' ? 'Voice Channel' : 'Text Channel'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMembersModal(!showMembersModal)}
                  className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  <Users size={16} />
                </button>
                <button
                  onClick={() => setShowSettingsModal(!showSettingsModal)}
                  className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  <Bell size={16} />
                </button>
                <button
                  onClick={() => {
                    // Find a message to pin or show pinned messages
                    alert("Pin feature coming soon!");
                  }}
                  className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  <Pin size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-zinc-900">
              <div className="px-4 py-2">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="animate-spin text-blue-500 w-6 h-6" size={24} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-20">
                    <HashIcon size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">Welcome to #{activeChannel.name}!</p>
                    <p className="text-sm mb-4">This is the beginning of the #{activeChannel.name} channel.</p>
                    <div className="text-xs text-zinc-600 space-y-1">
                      <p>• Type a message and press Enter to send</p>
                      <p>• Use @ to mention users</p>
                      <p>• Upload files with the attachment button</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {messages.map((msg, index) => (
                      <div key={msg._id} className="group hover:bg-zinc-800/30 px-4 py-2 -mx-4 rounded transition-colors">
                        <div className="flex gap-3">
                          <img
                            src={
                              msg.user?.avatar ||
                              "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                            }
                            alt={msg.user?.name}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white hover:underline cursor-pointer">
                                {msg.user?.name || "Unknown"}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {formatMessageTime(msg.timestamp)}
                              </span>
                              {msg.edited && (
                                <span className="text-xs text-zinc-600">(edited)</span>
                              )}
                            </div>
                            <div className="text-zinc-300 break-words">
                              <p className="text-sm leading-relaxed">{msg.content || msg.text}</p>
                            </div>
                            {/* Message reactions */}
                            <div className="flex items-center gap-2 mt-1">
                              <button 
                                onClick={() => handleAddReaction(msg._id, '👍')}
                                className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-300 transition-colors"
                              >
                                👍 {msg.reactions?.find(r => r.emoji === '👍')?.count || 0}
                              </button>
                              <button className="flex items-center gap-1 px-2 py-1 hover:bg-zinc-700 rounded text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Message Input - Discord Style */}
            {isUserInGroup ? (
              <div className="px-4 pb-4">
                <div className="bg-zinc-800 rounded-lg flex items-center gap-2 px-4 py-2 border border-zinc-700 focus-within:border-zinc-600 transition-colors">
                  <button 
                    onClick={() => alert("Emoji picker coming soon!")}
                    className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="text"
                    placeholder={`Message #${activeChannel.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-transparent text-white outline-none text-sm placeholder-zinc-500"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                      title="Upload file"
                    >
                      <Plus size={20} />
                    </button>
                    <button 
                      onClick={() => alert("Gift feature coming soon!")}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors" 
                      title="Gift"
                    >
                      <Gift size={20} />
                    </button>
                    <button 
                      onClick={() => alert("Voice recording coming soon!")}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors" 
                      title="Voice message"
                    >
                      <Mic size={20} />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4 flex justify-center">
                <button
                  onClick={() => handleJoinGroup(activeGroup._id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-semibold text-sm transition-colors"
                >
                  Join Server
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 px-4 min-h-full">
            <HashIcon size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-semibold mb-2">No Channel Selected</p>
            <p className="text-sm text-center text-zinc-400">
              Select a channel from the sidebar to start chatting
            </p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create New Server</h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Server Name</label>
                <input
                  type="text"
                  placeholder="Enter server name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:bg-zinc-700 border border-zinc-700 focus:border-blue-500/50 placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Server Description (Optional)</label>
                <textarea
                  placeholder="Describe your server"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:bg-zinc-700 border border-zinc-700 focus:border-blue-500/50 placeholder-zinc-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Create Server
                </button>
                <button
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create Channel</h2>
              <button
                onClick={() => setShowCreateChannelModal(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Channel Name</label>
                <input
                  type="text"
                  placeholder="Enter channel name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:bg-zinc-700 border border-zinc-700 focus:border-blue-500/50 placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Channel Type</label>
                <select
                  value={channelType}
                  onChange={(e) => setChannelType(e.target.value)}
                  className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:bg-zinc-700 border border-zinc-700 focus:border-blue-500/50"
                >
                  <option value="text">Text Channel</option>
                  <option value="voice">Voice Channel</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateChannel}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Create Channel
                </button>
                <button
                  onClick={() => setShowCreateChannelModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Invite to {activeGroup?.name}</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Share Invite Link</label>
                <div className="bg-zinc-800 p-3 rounded-lg">
                  <p className="text-zinc-400 text-sm">Click "Generate Invite" to create a new invite link</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateInvite}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Generate Invite
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{activeGroup?.name} Members</h2>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {activeGroup?.members?.map((member) => (
                <div key={member._id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                  <img
                    src={member.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{member.name}</p>
                    <p className="text-zinc-400 text-sm">{member.handle || member.email}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{activeGroup?.name} Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Server Overview</h3>
                <div className="bg-zinc-800 p-3 rounded-lg space-y-2">
                  <p className="text-zinc-300"><span className="text-zinc-500">Name:</span> {activeGroup?.name}</p>
                  <p className="text-zinc-300"><span className="text-zinc-500">Members:</span> {activeGroup?.members?.length || 0}</p>
                  <p className="text-zinc-300"><span className="text-zinc-500">Channels:</span> {activeGroup?.channels?.length || 0}</p>
                  <p className="text-zinc-300"><span className="text-zinc-500">Type:</span> {activeGroup?.type}</p>
                </div>
              </div>
              
              {isUserInGroup && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleLeaveGroup(activeGroup._id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Leave Server
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Close
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
