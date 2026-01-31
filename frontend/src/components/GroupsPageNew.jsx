import React, { useState, useEffect, useRef } from "react";
import {
  Hash, Volume2, Settings, Plus, Search, Bell, Pin, Users, Crown, Shield, Star,
  Mic, MicOff, Headphones, Video, VideoOff, ScreenShare, Phone, PhoneOff,
  Gift, Sticker, Smile, Paperclip, Send, MoreVertical, ChevronDown, ChevronRight,
  Edit, Trash2, Reply, Zap, X, Compass, Inbox, Bold, Italic, Strikethrough, Code2,
  MessageSquare, Download, Image, File, HelpCircle, Loader
} from "lucide-react";
import api from "../utils/api";

const GroupsPage = ({ isSidebarOpen, currentUser, token }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMemberList, setShowMemberList] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [boostLevel, setBoostLevel] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  const college = currentUser?.college || "AIT Bangalore";

  // Fetch groups for current college
  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeGroup && activeChannel) {
      fetchMessages();
    }
  }, [activeGroup, activeChannel]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/groups/college/${college}`);
      setGroups(res.data);
      if (res.data.length > 0 && !activeGroup) {
        setActiveGroup(res.data[0]);
        if (res.data[0].channels && res.data[0].channels.length > 0) {
          setActiveChannel(res.data[0].channels[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      // Use mock data if backend fails
      setGroups(getMockGroups());
      if (!activeGroup) {
        const mockGroup = getMockGroups()[0];
        setActiveGroup(mockGroup);
        setActiveChannel(mockGroup.channels[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeGroup || !activeChannel) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/groups/${activeGroup._id}/messages?channel=${activeChannel._id}&limit=100`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      // Use mock messages if backend fails
      setMessages(getMockMessages());
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeGroup || !activeChannel) return;

    try {
      const messageData = {
        text: newMessage,
        channel: activeChannel._id,
        type: "TEXT"
      };

      if (replyingTo) {
        messageData.replyTo = replyingTo._id;
      }

      const res = await api.post(`/groups/${activeGroup._id}/messages`, messageData);
      setMessages([...messages, res.data]);
      setNewMessage("");
      setReplyingTo(null);
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
      // Add mock message if backend fails
      const mockMessage = {
        _id: Date.now().toString(),
        user: currentUser,
        text: newMessage,
        channel: activeChannel._id,
        type: "TEXT",
        timestamp: new Date(),
        replyTo: replyingTo
      };
      setMessages([...messages, mockMessage]);
      setNewMessage("");
      setReplyingTo(null);
      scrollToBottom();
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      await api.post(`/groups/${activeGroup._id}/messages/${messageId}/reactions`, { emoji });
      // Update local state
      setMessages(messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), { emoji, user: currentUser._id }] }
          : msg
      ));
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  const pinMessage = async (messageId) => {
    try {
      await api.post(`/groups/${activeGroup._id}/messages/${messageId}/pin`);
      // Update local state
      setMessages(messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, pinned: true }
          : msg
      ));
    } catch (err) {
      console.error("Error pinning message:", err);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/groups/${activeGroup._id}/messages/${messageId}`);
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      fetchGroups();
    } catch (err) {
      console.error("Error joining group:", err);
    }
  };

  const leaveGroup = async (groupId) => {
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
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    try {
      const response = await api.post("/groups", {
        name: groupName,
        description: groupDescription,
        college,
        type: "CLUB"
      });
      console.log("Group created:", response.data);
      setGroupName("");
      setGroupDescription("");
      setShowCreateGroupModal(false);
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err.response?.data || err.message);
      alert(`Error creating group: ${err.response?.data?.message || err.message}`);
    }
  };

  // Mock data functions
  const getMockGroups = () => [
    {
      _id: "1",
      name: "Computer Science Club",
      icon: "💻",
      type: "CLUB",
      description: "For all CS enthusiasts and developers",
      memberCount: 245,
      onlineCount: 42,
      boostLevel: 2,
      categories: [
        { _id: "cat1", name: "General", position: 0 },
        { _id: "cat2", name: "Study Groups", position: 1 },
      ],
      channels: [
        { _id: "ch1", name: "general", type: "TEXT", categoryId: "cat1", position: 0 },
        { _id: "ch2", name: "announcements", type: "ANNOUNCEMENT", categoryId: "cat1", position: 1 },
        { _id: "ch3", name: "voice-general", type: "VOICE", categoryId: "cat1", position: 2 },
        { _id: "ch4", name: "algorithms", type: "TEXT", categoryId: "cat2", position: 0 },
        { _id: "ch5", name: "web-dev", type: "TEXT", categoryId: "cat2", position: 1 },
      ],
      roles: [
        { _id: "role1", name: "Admin", color: "#f04747", permissions: ["ADMINISTRATOR"] },
        { _id: "role2", name: "Moderator", color: "#faa61a", permissions: ["MANAGE_MESSAGES"] },
        { _id: "role3", name: "Member", color: "#47f047", permissions: [] },
      ],
      members: [
        { _id: "1", name: "Alex Chen", avatar: "👨‍💻", status: "online", roles: ["role1"] },
        { _id: "2", name: "Sarah Miller", avatar: "👩‍💻", status: "online", roles: ["role2"] },
        { _id: "3", name: "Mike Johnson", avatar: "🧑‍💻", status: "idle", roles: ["role3"] },
        { _id: "4", name: "Emma Davis", avatar: "👩‍🎓", status: "offline", roles: ["role3"] },
      ],
    },
    {
      _id: "2",
      name: "AI & Machine Learning",
      icon: "🤖",
      type: "CLUB",
      description: "Exploring the future of AI",
      memberCount: 189,
      onlineCount: 28,
      boostLevel: 1,
      channels: [
        { _id: "ch6", name: "general", type: "TEXT", categoryId: "cat1", position: 0 },
        { _id: "ch7", name: "research", type: "TEXT", categoryId: "cat1", position: 1 },
        { _id: "ch8", name: "projects", type: "TEXT", categoryId: "cat1", position: 2 },
      ],
    },
  ];

  const getMockMessages = () => [
    {
      _id: "1",
      user: { _id: "1", name: "Alex Chen", avatar: "👨‍💻" },
      text: "Welcome to the Computer Science Club! 🎉",
      channel: activeChannel?._id,
      type: "TEXT",
      timestamp: new Date(Date.now() - 3600000),
      reactions: [
        { emoji: "👋", count: 5, users: ["1", "2", "3"] },
        { emoji: "🎉", count: 3, users: ["1", "4"] }
      ],
      pinned: true,
    },
    {
      _id: "2",
      user: { _id: "2", name: "Sarah Miller", avatar: "👩‍💻" },
      text: "Hey everyone! Working on a new React project. Anyone interested in collaborating?",
      channel: activeChannel?._id,
      type: "TEXT",
      timestamp: new Date(Date.now() - 1800000),
      reactions: [{ emoji: "🙋‍♀️", count: 2, users: ["3", "4"] }],
    },
    {
      _id: "3",
      user: { _id: "3", name: "Mike Johnson", avatar: "🧑‍💻" },
      text: "Count me in! I've been wanting to build something cool with React.",
      channel: activeChannel?._id,
      type: "TEXT",
      timestamp: new Date(Date.now() - 900000),
      replyTo: "2",
    },
  ];

  const emojis = ["😀", "😂", "❤️", "👍", "👎", "😢", "😡", "🎉", "🤔", "👀", "🎯", "🔥", "💯", "🚀", "💡"];

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "TEXT": return <Hash size={16} />;
      case "VOICE": return <Volume2 size={16} />;
      case "ANNOUNCEMENT": return <Bell size={16} />;
      default: return <Hash size={16} />;
    }
  };

  const getRoleColor = (roleId) => {
    const role = activeGroup?.roles?.find(r => r._id === roleId);
    return role?.color || "#99aab5";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "#43b581";
      case "idle": return "#faa61a";
      case "dnd": return "#f04747";
      default: return "#747f8d";
    }
  };

  return (
    <div className={`flex h-full bg-[#0f172a] w-full relative transition-all duration-300 mt-16 md:mt-0 ${
      isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
    }`}>
      {/* Server Sidebar */}
      <div className="w-20 bg-[#202225] flex flex-col items-center py-3 space-y-2">
        <div className="w-12 h-12 bg-[#5865f2] rounded-2xl flex items-center justify-center text-white hover:rounded-xl transition-all cursor-pointer">
          <Compass size={24} />
        </div>
        <div className="w-8 h-0.5 bg-[#202225]"></div>
        {groups.map((group) => (
          <div
            key={group._id}
            onClick={() => {
              setActiveGroup(group);
              if (group.channels && group.channels.length > 0) {
                setActiveChannel(group.channels[0]);
              }
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all text-2xl hover:rounded-xl ${
              activeGroup?._id === group._id ? "bg-[#5865f2]" : "bg-[#36393f]"
            }`}
            title={group.name}
          >
            {group.icon}
            {group.boostLevel > 0 && (
              <div className="absolute -bottom-1 -right-1">
                <Star size={12} className="text-[#ff73fa]" fill="#ff73fa" />
              </div>
            )}
          </div>
        ))}
        <div className="w-12 h-12 rounded-2xl bg-[#36393f] flex items-center justify-center cursor-pointer hover:bg-[#5865f2] hover:rounded-xl transition-all">
          <Plus size={24} className="text-[#3ba55c]" onClick={() => setShowCreateGroupModal(true)} />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#36393f] flex items-center justify-center cursor-pointer hover:bg-[#5865f2] hover:rounded-xl transition-all">
          <Search size={24} className="text-[#8e9297]" />
        </div>
      </div>

      {/* Channel Sidebar */}
      <div className="w-60 bg-[#2f3136] flex flex-col">
        {activeGroup && (
          <>
            <div className="h-12 px-4 shadow-md flex items-center justify-between border-b border-black/10">
              <h2 className="font-semibold text-white flex items-center">
                <span className="mr-2">{activeGroup.icon}</span>
                {activeGroup.name}
              </h2>
              <div className="flex space-x-2">
                <Bell size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                <Pin size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                <Users size={16} className="text-[#8e9297] hover:text-white cursor-pointer" onClick={() => setShowMemberList(!showMemberList)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeGroup.categories?.map((category) => (
                <div key={category._id} className="mb-4">
                  <div className="px-2 py-2 flex items-center text-[#8e9297] hover:text-white cursor-pointer">
                    <ChevronRight size={12} className="mr-1" />
                    <span className="text-xs font-semibold uppercase">{category.name}</span>
                  </div>
                  {activeGroup.channels?.filter(ch => ch.categoryId === category._id).map((channel) => (
                    <div
                      key={channel._id}
                      onClick={() => setActiveChannel(channel)}
                      className={`px-2 py-1 mx-2 flex items-center text-[#8e9297] hover:text-white hover:bg-[#393d42] rounded cursor-pointer ${
                        activeChannel?._id === channel._id ? "bg-[#393d42] text-white" : ""
                      }`}
                    >
                      {getChannelIcon(channel.type)}
                      <span className="ml-2 text-sm">{channel.name}</span>
                      {channel.type === "ANNOUNCEMENT" && <Bell size={12} className="ml-auto" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="h-14 px-2 bg-[#292b2f] flex items-center">
              <div className="w-8 h-8 bg-[#7289da] rounded-full flex items-center justify-center text-white text-sm">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <div className="ml-2 flex-1">
                <div className="text-sm text-white font-medium">{currentUser?.name || "User"}</div>
                <div className="text-xs text-[#b9bbbe]">#{currentUser?.name?.split(" ")[0] || "user"}</div>
              </div>
              <div className="flex space-x-2">
                <Mic size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                <Headphones size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                <Settings size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#36393f]">
        {activeChannel && (
          <>
            {/* Chat Header */}
            <div className="h-12 px-4 shadow-md flex items-center justify-between border-b border-black/10">
              <div className="flex items-center">
                {getChannelIcon(activeChannel.type)}
                <span className="ml-2 font-semibold text-white">{activeChannel.name}</span>
                <span className="ml-2 text-xs text-[#8e9297]">General Discussion</span>
              </div>
              <div className="flex items-center space-x-4">
                <Bell size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                <Pin size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                <Users size={16} className="text-[#8e9297] hover:text-white cursor-pointer" onClick={() => setShowMemberList(!showMemberList)} />
                <div className="flex items-center space-x-2 bg-[#292b2f] px-2 py-1 rounded">
                  <Search size={16} className="text-[#8e9297]" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="bg-transparent text-sm text-white outline-none w-24"
                  />
                </div>
                <Inbox size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                <HelpCircle size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader className="animate-spin text-[#5865f2]" size={32} />
                </div>
              ) : (
                messages.map((message, index) => (
                  <div key={message._id} className="group mb-4 hover:bg-[#32353b] px-2 py-2 rounded">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-[#7289da] rounded-full flex items-center justify-center text-white mr-3 flex-shrink-0">
                        {message.user?.avatar || message.user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline">
                          <span className="font-semibold text-white mr-2">{message.user?.name}</span>
                          <span className="text-xs text-[#72767d]">{formatTime(message.timestamp)}</span>
                          {message.pinned && <Pin size={12} className="ml-2 text-[#faa61a]" />}
                        </div>
                        {message.replyTo && (
                          <div className="text-xs text-[#72767d] mb-1 ml-2 border-l-2 border-[#4f545c] pl-2">
                            Replying to {messages.find(m => m._id === message.replyTo)?.user?.name}
                          </div>
                        )}
                        <div className="text-[#dcddde] break-words">{message.text}</div>
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction, idx) => (
                              <div key={idx} className="flex items-center bg-[#4f545c] px-2 py-1 rounded text-xs">
                                <span>{reaction.emoji}</span>
                                <span className="ml-1 text-[#b9bbbe]">{reaction.count || 1}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ml-2">
                        <Reply size={16} className="text-[#8e9297] hover:text-white cursor-pointer" />
                        <MoreVertical size={16} className="text-[#8e9297] hover:text-white cursor-pointer" onClick={(e) => setContextMenu({ x: e.clientX, y: e.clientY, message })} />
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 pb-6">
              {replyingTo && (
                <div className="mb-2 flex items-center justify-between bg-[#4f545c] px-3 py-2 rounded">
                  <div className="text-sm text-[#b9bbbe">
                    Replying to {replyingTo.user?.name}
                  </div>
                  <X size={16} className="text-[#b9bbbe] cursor-pointer" onClick={() => setReplyingTo(null)} />
                </div>
              )}
              <div className="flex items-center bg-[#40444b] rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2 mr-2">
                  <Plus size={20} className="text-[#8e9297] hover:text-white cursor-pointer" />
                  <Paperclip size={20} className="text-[#8e9297] hover:text-white cursor-pointer" onClick={() => fileInputRef.current?.click()} />
                </div>
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message #${activeChannel?.name || 'channel'}`}
                  className="flex-1 bg-transparent text-white outline-none"
                />
                <div className="flex items-center space-x-2 ml-2">
                  <Gift size={20} className="text-[#8e9297] hover:text-white cursor-pointer" />
                  <Sticker size={20} className="text-[#8e9297] hover:text-white cursor-pointer" />
                  <Smile size={20} className="text-[#8e9297] hover:text-white cursor-pointer" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                </div>
              </div>
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 bg-[#2f3136] rounded-lg p-2 shadow-lg">
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji) => (
                      <div
                        key={emoji}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#5865f2] rounded cursor-pointer"
                        onClick={() => {
                          setNewMessage(newMessage + emoji);
                          setShowEmojiPicker(false);
                        }}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Member List */}
      {showMemberList && activeGroup && (
        <div className="w-60 bg-[#2f3136] flex flex-col">
          <div className="h-12 px-4 shadow-md flex items-center justify-between border-b border-black/10">
            <h3 className="font-semibold text-white">Members — {memberCount || activeGroup.memberCount}</h3>
            <X size={16} className="text-[#8e9297] hover:text-white cursor-pointer" onClick={() => setShowMemberList(false)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-2 py-2">
              <div className="text-xs font-semibold text-[#8e9297] uppercase mb-2">ONLINE — {onlineUsers.length || activeGroup.onlineCount}</div>
              {activeGroup.members?.filter(m => m.status === 'online').map((member) => (
                <div key={member._id} className="flex items-center px-2 py-2 hover:bg-[#393d42] rounded cursor-pointer">
                  <div className="relative">
                    <div className="w-8 h-8 bg-[#7289da] rounded-full flex items-center justify-center text-white text-sm">
                      {member.avatar}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#43b581] rounded-full border-2 border-[#2f3136]"></div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-white">{member.name}</div>
                    {member.roles?.map(roleId => (
                      <div key={roleId} className="text-xs" style={{ color: getRoleColor(roleId) }}>
                        {activeGroup.roles?.find(r => r._id === roleId)?.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-2 py-2">
              <div className="text-xs font-semibold text-[#8e9297] uppercase mb-2">OFFLINE — {activeGroup.members?.filter(m => m.status !== 'online').length}</div>
              {activeGroup.members?.filter(m => m.status !== 'online').map((member) => (
                <div key={member._id} className="flex items-center px-2 py-2 hover:bg-[#393d42] rounded cursor-pointer opacity-50">
                  <div className="w-8 h-8 bg-[#7289da] rounded-full flex items-center justify-center text-white text-sm">
                    {member.avatar}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-[#8e9297]">{member.name}</div>
                    {member.roles?.map(roleId => (
                      <div key={roleId} className="text-xs" style={{ color: getRoleColor(roleId) }}>
                        {activeGroup.roles?.find(r => r._id === roleId)?.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#36393f] rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">Create New Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-[#40444b] text-white rounded mb-3 outline-none"
            />
            <textarea
              placeholder="Group Description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#40444b] text-white rounded mb-4 outline-none h-24 resize-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 bg-[#5865f2] text-white rounded hover:bg-[#4752c4]"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="px-4 py-2 bg-[#5865f2] text-white rounded hover:bg-[#4752c4]"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-[#2f3136] rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <div className="px-4 py-2 hover:bg-[#393d42] cursor-pointer text-sm text-white flex items-center">
            <Reply size={14} className="mr-2" /> Reply
          </div>
          <div className="px-4 py-2 hover:bg-[#393d42] cursor-pointer text-sm text-white flex items-center">
            <Pin size={14} className="mr-2" /> Pin Message
          </div>
          <div className="px-4 py-2 hover:bg-[#393d42] cursor-pointer text-sm text-white flex items-center">
            <Edit size={14} className="mr-2" /> Edit
          </div>
          <div className="px-4 py-2 hover:bg-[#393d42] cursor-pointer text-sm text-[#f04747] flex items-center">
            <Trash2 size={14} className="mr-2" /> Delete
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            // Handle file upload
            console.log("File selected:", file);
          }
        }}
      />
    </div>
  );
};

export default GroupsPage;
