import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Hash, Volume2, Settings, Plus, Search, Bell, Pin, Users, Crown, Shield, Star,
  Mic, MicOff, Headphones, Video, VideoOff, ScreenShare, Phone, PhoneOff,
  Gift, Sticker, Smile, Paperclip, Send, MoreVertical, ChevronDown, ChevronRight,
  Edit, Trash2, Reply, Zap, X, Compass, Inbox, Bold, Italic, Strikethrough, Code2,
  MessageSquare, Download, Image, File
} from "lucide-react";

const GroupsPage = ({ isSidebarOpen, currentUser, token }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [boostLevel, setBoostLevel] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  const API_URL = "http://localhost:5000/api";

  // Mock data
  const mockGroups = [
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
      ],
    },
  ];

  const mockMessages = [
    {
      _id: "1",
      content: "Hey everyone! Welcome to the Computer Science Club! 🎉",
      user: { _id: "user1", name: "Admin", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" },
      timestamp: new Date(Date.now() - 3600000),
      type: "WELCOME",
      embeds: [{
        title: "Welcome to CS Club!",
        description: "This is where we discuss everything computer science related.",
        color: 0x00ff00,
      }],
    },
    {
      _id: "2",
      content: "Just finished my React project! Check it out 🚀",
      user: { _id: "user2", name: "Sarah Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
      timestamp: new Date(Date.now() - 1800000),
      attachments: [{
        id: "att1",
        filename: "react-project.png",
        url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
      }],
      reactions: [
        { emoji: "👍", count: 8, users: ["user1", "user3"], me: true },
        { emoji: "🔥", count: 5, users: ["user4", "user5"] },
      ],
    },
  ];

  const mockOnlineUsers = [
    { _id: "user1", name: "Alex Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", status: "online", game: "Visual Studio Code" },
    { _id: "user2", name: "Sarah Kim", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", status: "online", game: "Studying" },
  ];

  useEffect(() => {
    setGroups(mockGroups);
    setOnlineUsers(mockOnlineUsers);
    if (mockGroups.length > 0 && !activeGroup) {
      setActiveGroup(mockGroups[0]);
      setActiveChannel(mockGroups[0].channels[0]);
      setMessages(mockMessages);
      setMemberCount(mockGroups[0].memberCount);
      setBoostLevel(mockGroups[0].boostLevel);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChannel) return;

    const newMsg = {
      _id: Date.now().toString(),
      content: newMessage,
      user: currentUser,
      timestamp: new Date(),
      channel: activeChannel._id,
      type: "DEFAULT",
      reactions: [],
      attachments: [],
      embeds: [],
      edited: false,
      pinned: false,
    };

    if (replyingTo) {
      newMsg.reference = { messageId: replyingTo._id, user: replyingTo.user };
      setReplyingTo(null);
    }

    setMessages([...messages, newMsg]);
    setNewMessage("");
    scrollToBottom();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (messageId, emoji) => {
    setMessages(messages.map(msg => {
      if (msg._id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.me) {
            existingReaction.count--;
            existingReaction.users = existingReaction.users.filter(id => id !== currentUser._id);
            existingReaction.me = false;
          } else {
            existingReaction.count++;
            existingReaction.users.push(currentUser._id);
            existingReaction.me = true;
          }
        } else {
          if (!msg.reactions) msg.reactions = [];
          msg.reactions.push({
            emoji,
            count: 1,
            users: [currentUser._id],
            me: true,
          });
        }
      }
      return msg;
    }));
  };

  const handleReply = (message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const handleDelete = (messageId) => {
    setMessages(messages.map(msg => 
      msg._id === messageId 
        ? { ...msg, deleted: true, content: "[This message has been deleted]" }
        : msg
    ));
    setContextMenu(null);
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "VOICE": return <Volume2 size={16} />;
      case "ANNOUNCEMENT": return <Bell size={16} />;
      default: return <Hash size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "idle": return "bg-yellow-500";
      case "dnd": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getBoostBadge = (level) => {
    if (level === 0) return null;
    const colors = ["#FF73FA", "#F47FFF", "#FF45E3", "#FF6BCB"];
    return (
      <div 
        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: colors[level - 1] }}
      >
        <Zap size={12} />
        Level {level}
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const commonEmojis = ["😀", "😂", "❤️", "👍", "👎", "😢", "😡", "🎉", "🔥", "💯"];

  return (
    <div className={`flex h-full bg-[#0f172a] w-full relative transition-all duration-300 mt-16 md:mt-0 ${isSidebarOpen ? "lg:ml-72" : "lg:ml-0"}`}>
      {/* Server Sidebar */}
      <div className="w-20 bg-black border-r border-white/5 flex flex-col items-center py-3 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold hover:rounded-xl transition-all cursor-pointer">
          <Compass size={24} />
        </div>
        <div className="w-0.5 h-6 bg-white/10"></div>
        {groups.map((group) => (
          <div
            key={group._id}
            onClick={() => {
              setActiveGroup(group);
              setActiveChannel(group.channels[0]);
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all text-xl hover:rounded-xl relative group ${
              activeGroup?._id === group._id ? "bg-indigo-600 rounded-xl" : "bg-zinc-800 hover:bg-indigo-600"
            }`}
            title={group.name}
          >
            {group.icon}
            {group.boostLevel > 0 && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <Zap size={10} className="text-white" />
              </div>
            )}
          </div>
        ))}
        <button className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer bg-zinc-800 text-green-500 hover:bg-green-600 hover:text-white hover:rounded-xl transition-all">
          <Plus size={20} />
        </button>
      </div>

      {/* Channel Sidebar */}
      <div className="w-60 bg-[#111827] border-r border-white/5 flex flex-col overflow-hidden">
        {/* Server Header */}
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#0f1419]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center text-lg">
              {activeGroup?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {activeGroup?.name}
              </div>
              {getBoostBadge(boostLevel)}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-zinc-400 hover:text-white transition-colors">
              <Zap size={16} />
            </button>
            <button className="p-1 text-zinc-400 hover:text-white transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          {activeGroup?.categories?.map((category) => (
            <div key={category._id} className="mb-4">
              <div className="flex items-center justify-between px-2 py-1 cursor-pointer hover:text-zinc-300">
                <ChevronRight size={14} className="text-zinc-400" />
                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  {category.name}
                </span>
                <Plus size={14} className="text-zinc-400 hover:text-white" />
              </div>
              <div className="space-y-0.5 px-2">
                {activeGroup.channels
                  .filter(channel => channel.categoryId === category._id)
                  .map((channel) => (
                    <div
                      key={channel._id}
                      onClick={() => setActiveChannel(channel)}
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all ${
                        activeChannel?._id === channel._id
                          ? "bg-indigo-600/20 text-indigo-400"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      {getChannelIcon(channel.type)}
                      <span className="text-sm truncate">{channel.name}</span>
                      {channel.type === "VOICE" && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Users size={12} />
                          <span className="text-xs">3</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Panel */}
        <div className="h-14 bg-[#0f1419] border-t border-white/5 flex items-center px-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f1419]"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {currentUser?.name || "User"}
              </div>
              <div className="text-zinc-400 text-xs truncate">
                #{currentUser?.handle || "0000"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-zinc-400 hover:text-white transition-colors">
              <Mic size={16} />
            </button>
            <button className="p-1 text-zinc-400 hover:text-white transition-colors">
              <Headphones size={16} />
            </button>
            <button className="p-1 text-zinc-400 hover:text-white transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#1e293b]">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#0f1419]">
              <div className="flex items-center gap-2">
                {getChannelIcon(activeChannel.type)}
                <span className="text-white font-semibold">{activeChannel.name}</span>
                {activeChannel.type === "VOICE" && (
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Users size={14} />
                    <span className="text-xs">3</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeChannel.type === "TEXT" && (
                  <>
                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-all">
                      <Bell size={16} />
                    </button>
                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-all">
                      <Pin size={16} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setShowMemberList(!showMemberList)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-all"
                >
                  <Users size={16} />
                </button>
                <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-all">
                  <Search size={16} />
                </button>
                <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-all">
                  <Inbox size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            {activeChannel.type === "TEXT" ? (
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message._id} className="group hover:bg-[#2a3649]/50 px-2 py-2 -mx-2 rounded">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                            {message.user?.name?.charAt(0) || "U"}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white hover:underline cursor-pointer">
                              {message.user?.name}
                            </span>
                            <span className="text-zinc-400 text-xs">
                              {formatTimestamp(message.timestamp)}
                            </span>
                            {message.edited && (
                              <span className="text-zinc-500 text-xs">(edited)</span>
                            )}
                          </div>
                          
                          {/* Reply Reference */}
                          {message.reference && (
                            <div className="mb-2 p-2 bg-[#2a3649] rounded border-l-2 border-indigo-500">
                              <div className="text-xs text-zinc-400 mb-1">Replying to {message.reference.user?.name}</div>
                            </div>
                          )}
                          
                          <div className="text-zinc-300 text-sm break-words">
                            {message.content}
                          </div>
                          
                          {/* Embeds */}
                          {message.embeds?.map((embed, index) => (
                            <div key={index} className="mt-2 bg-[#2a3649] border-l-4 p-3 rounded" style={{ borderColor: `#${embed.color?.toString(16).padStart(6, '0')}` }}>
                              {embed.title && (
                                <div className="font-semibold text-white mb-1">{embed.title}</div>
                              )}
                              {embed.description && (
                                <div className="text-zinc-300 text-sm">{embed.description}</div>
                              )}
                            </div>
                          ))}
                          
                          {/* Attachments */}
                          {message.attachments?.map((attachment) => (
                            <div key={attachment.id} className="mt-2 bg-[#2a3649] p-3 rounded">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center">
                                  <Image size={20} className="text-zinc-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white text-sm truncate">{attachment.filename}</div>
                                  <div className="text-zinc-400 text-xs">Click to view</div>
                                </div>
                                <Download size={16} className="text-zinc-400 hover:text-white cursor-pointer" />
                              </div>
                            </div>
                          ))}
                          
                          {/* Reactions */}
                          {message.reactions?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.reactions.map((reaction, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleReaction(message._id, reaction.emoji)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                                    reaction.me ? "bg-indigo-600 text-white" : "bg-[#2a3649] text-zinc-300 hover:bg-[#3a4659]"
                                  }`}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Message Actions */}
                          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleReply(message)}
                              className="text-zinc-400 hover:text-white text-xs transition-colors"
                            >
                              <Reply size={14} />
                            </button>
                            <button className="text-zinc-400 hover:text-white text-xs transition-colors">
                              <Smile size={14} />
                            </button>
                            {message.user?._id === currentUser?._id && (
                              <button className="text-zinc-400 hover:text-white text-xs transition-colors">
                                <Edit size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setContextMenu({
                                  x: e.clientX,
                                  y: e.clientY,
                                  message,
                                });
                              }}
                              className="text-zinc-400 hover:text-white text-xs transition-colors"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Volume2 size={48} className="text-zinc-500 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">{activeChannel.name}</h3>
                  <p className="text-zinc-400 text-sm mb-4">Voice Channel</p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    Join Voice
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            {activeChannel.type === "TEXT" && (
              <div className="px-4 pb-4">
                {/* Reply Preview */}
                {replyingTo && (
                  <div className="mb-2 p-2 bg-[#2a3649] rounded border-l-2 border-indigo-500 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-zinc-400">Replying to {replyingTo.user?.name}</div>
                      <div className="text-sm text-zinc-300 truncate">{replyingTo.content}</div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <div className="bg-[#2a3649] rounded-lg">
                  <div className="flex items-center gap-2 p-2">
                    <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                      <Plus size={20} />
                    </button>
                    <input
                      ref={messageInputRef}
                      type="text"
                      placeholder={`Message #${activeChannel.name}`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-transparent text-white placeholder-zinc-400 outline-none text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <Gift size={20} />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <Sticker size={20} />
                      </button>
                      <div className="relative">
                        <button 
                          className="p-2 text-zinc-400 hover:text-white transition-colors"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <Smile size={20} />
                        </button>
                        {showEmojiPicker && (
                          <div className="absolute bottom-full mb-2 right-0 bg-[#2a3649] rounded-lg p-2 shadow-lg border border-white/10">
                            <div className="grid grid-cols-5 gap-1">
                              {commonEmojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setNewMessage(newMessage + emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="p-2 hover:bg-[#3a4659] rounded transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Paperclip size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-2">
                      <button className="text-zinc-400 hover:text-white transition-colors">
                        <Bold size={16} />
                      </button>
                      <button className="text-zinc-400 hover:text-white transition-colors">
                        <Italic size={16} />
                      </button>
                      <button className="text-zinc-400 hover:text-white transition-colors">
                        <Strikethrough size={16} />
                      </button>
                      <button className="text-zinc-400 hover:text-white transition-colors">
                        <Code2 size={16} />
                      </button>
                    </div>
                    <div className="text-zinc-500 text-xs">
                      Press Enter to send, Shift+Enter for new line
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash size={48} className="text-zinc-500 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Welcome to {activeGroup?.name}</h3>
              <p className="text-zinc-400 text-sm">Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Member List Sidebar */}
      <div className={`w-60 bg-[#111827] border-l border-white/5 flex flex-col transition-all duration-300 ${
        showMemberList ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4">
          <span className="text-white font-semibold">Members — {memberCount}</span>
          <button
            onClick={() => setShowMemberList(false)}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-xs font-semibold uppercase">Online — {onlineUsers.length}</span>
            </div>
            <div className="space-y-1">
              {onlineUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-2 p-1 rounded hover:bg-zinc-800 cursor-pointer">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-[#111827]`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{user.name}</div>
                    <div className="text-zinc-400 text-xs truncate">{user.game}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-[#2a3649] rounded-lg shadow-lg border border-white/10 py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleReply(contextMenu.message)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-zinc-300 hover:bg-[#3a4659] w-full text-left"
          >
            <Reply size={14} />
            Reply
          </button>
          {contextMenu.message.user?._id === currentUser?._id && (
            <button className="flex items-center gap-2 px-3 py-1 text-sm text-zinc-300 hover:bg-[#3a4659] w-full text-left">
              <Edit size={14} />
              Edit
            </button>
          )}
          <button
            onClick={() => handleDelete(contextMenu.message._id)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-red-400 hover:bg-[#3a4659] w-full text-left"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => console.log("Files uploaded:", e.target.files)}
        className="hidden"
      />
    </div>
  );
};

export default GroupsPage;
