import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Plus, Settings, Lock, User as UserIcon, ArrowLeft, Hashtag,
  Bell, UserPlus, MoreHoriz,
} from "iconoir-react";

import { useNavigate } from "react-router-dom";
import GroupsModals from "./groups/GroupsModals";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

function GradientAvatar({ initials, from, to, size = "md", online }) {
  const sz = { sm: "w-9 h-9 text-[11px]", md: "w-11 h-11 text-xs", lg: "w-16 h-16 text-lg", xl: "w-20 h-20 text-xl" };
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sz[size]} rounded-full flex items-center justify-center font-bold text-white select-none`}
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initials}
      </div>
      {online !== undefined && size !== "xl" && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${online ? "bg-emerald-400" : "bg-zinc-700"}`} />
      )}
    </div>
  );
}

function GroupRow({ group, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 outline-none group ${
        active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
      }`}
    >
      {active && <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-full bg-white" />}
      <GradientAvatar initials={group.icon} from={group.from} to={group.to} size="md" online={group.isMember} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-semibold text-white truncate">{group.name}</span>
          <span className="text-[10px] text-zinc-500 ml-2 shrink-0">{group.lastTime}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-500 truncate">{group.lastMsg}</p>
          {group.unread > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center">
              {group.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

const GroupsPage = ({ isSidebarOpen, currentUser }) => {
  const navigate = useNavigate();
  const { socket, isConnected, sendMessage, emitTyping } = useSocket();

  const [activeGroup, setActiveGroup] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [showRight, setShowRight] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [e2eeStatus, setE2eeStatus] = useState("unavailable");
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pendingMessages = useRef(new Set());
  const [deliveredMessages, setDeliveredMessages] = useState(new Set());
  const [readMessages, setReadMessages] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoData, setInfoData] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupType, setGroupType] = useState("CLUB");
  const [joinPolicy, setJoinPolicy] = useState("PUBLIC");
  const [messagePermission, setMessagePermission] = useState("everyone");
  const [assignAsAdmin, setAssignAsAdmin] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupCreationError, setGroupCreationError] = useState(null);
  const [errorContext, setErrorContext] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const API_URL = "http://localhost:5000/api";

  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const token = localStorage.getItem("token");
      if (!token) { setGroups([]); return; }

      const res = await axios.get(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        const transformedGroups = res.data.data.map(group => ({
          id: group._id,
          _id: group._id,
          name: group.name,
          type: group.type.toLowerCase(),
          icon: group.name.substring(0, 2).toUpperCase(),
          description: group.description || "",
          members: group.stats?.memberCount || group.members?.length || 1,
          channels: group.channels || [],
          isMember: group.members?.some(m => m.userId?._id === currentUser?._id || m.userId === currentUser?._id) || false,
          from: group.type === "CLUB" ? "#6366f1" : group.type === "DEPT" ? "#10b981" : "#f59e0b",
          to: group.type === "CLUB" ? "#8b5cf6" : group.type === "DEPT" ? "#34d399" : "#f97316",
          lastMsg: "Group created!",
          lastTime: "Just now",
          unread: 0,
          owner: group.owner,
          admins: group.admins,
        }));
        setGroups(transformedGroups);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const fetchGroupDetail = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        return res.data.data;
      }
    } catch (error) {
      console.error("Error fetching group detail:", error);
    }
    return null;
  };

  const fetchChannelMessages = async (channelId, limit = 50, before) => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/groups/channel/${channelId}/messages?limit=${limit}`;
      if (before) url += `&before=${before}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  const fetchMembers = async (groupId) => {
    try {
      setIsLoadingMembers(true);
      const token = localStorage.getItem("token");
      if (!token) { setMembers([]); return; }

      const res = await axios.get(`${API_URL}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.data && Array.isArray(res.data.data.members)) {
        const transformedMembers = res.data.data.members.map(member => {
          const userId = member.user || member.userId;
          return {
            id: userId?._id || userId,
            name: userId?.name || "Unknown",
            initials: (userId?.name || "U").substring(0, 2).toUpperCase(),
            role: member.roleId?.name?.toLowerCase() || "member",
            online: userId?.isActive || false,
          };
        });
        setMembers(transformedMembers);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchGroups();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return formatTime(ts);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // ── Socket listeners for active channel ────────────────────────────────

  useEffect(() => {
    if (!activeChannel?._id || !socket) return;

    socket.emit("join_channel", activeChannel._id);

    const handleNewMessage = (msg) => {
      if (msg.channel !== activeChannel._id) return;
      // Skip own messages — already handled by optimistic update + ACK
      if (msg.user?._id === currentUser?._id) return;
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Auto-send delivery confirmation
      if (socket) {
        socket.emit("messages_delivered", { channelId: activeChannel._id, messageIds: [msg._id] });
      }
    };

    const handleTyping = ({ userId, name, channelId }) => {
      if (channelId !== activeChannel._id || userId === currentUser?._id) return;
      setTypingUsers(prev => {
        if (prev.some(u => u.userId === userId)) return prev;
        return [...prev, { userId, name }];
      });
    };

    const handleStopTyping = ({ userId, channelId }) => {
      if (channelId !== activeChannel._id) return;
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("messages_delivered_ack", ({ messageIds }) => {
      setDeliveredMessages(prev => new Set([...prev, ...messageIds]));
    });
    socket.on("messages_read", ({ userId, messageIds }) => {
      if (userId !== currentUser?._id) return;
      setReadMessages(prev => new Set([...prev, ...messageIds]));
    });
    socket.on("message_deleted", ({ messageId, channelId }) => {
      if (channelId !== activeChannel._id) return;
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    return () => {
      socket.emit("leave_channel", activeChannel._id);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("messages_delivered_ack");
      socket.off("messages_read");
      socket.off("message_deleted");
      setTypingUsers([]);
    };
  }, [activeChannel?._id, socket, currentUser?._id]);

  // ── Load messages when channel changes ─────────────────────────────────

  useEffect(() => {
    if (!activeChannel?._id) return;
    loadMessages();
  }, [activeChannel?._id]);

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    setMessages([]);
    setHasMoreMessages(true);
    pendingMessages.current = new Set();
    const msgs = await fetchChannelMessages(activeChannel._id, 50);
    setMessages(msgs);
    setIsLoadingMessages(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages || messages.length === 0) return;
    setLoadingMore(true);
    const oldestMsg = messages[0];
    const msgs = await fetchChannelMessages(activeChannel._id, 50, oldestMsg.createdAt);
    if (msgs.length < 50) setHasMoreMessages(false);
    setMessages(prev => [...msgs, ...prev]);
    setLoadingMore(false);
  };

  // ── Scroll to top handler for infinite scroll ──────────────────────────

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el || !hasMoreMessages || loadingMore) return;
    if (el.scrollTop < 100) loadMoreMessages();
  }, [hasMoreMessages, loadingMore]);

  // ── Select a group ────────────────────────────────────────────────────

  const selectGroup = async (g) => {
    setActiveGroup(g);
    setMessages([]);
    setShowRight(true);

    // Set initial channel from group data immediately
    const channels = g.channels || [];
    const textChannels = channels.filter(c => c.type === "TEXT" || c.type === "ANNOUNCEMENT");
    if (textChannels.length > 0) {
      const firstCh = textChannels.find(c => c.name === "general") || textChannels[0];
      setActiveChannel({ ...firstCh, _id: firstCh._id || firstCh.id });
    } else {
      setActiveChannel(null);
    }

    // Fetch fresh detail in background
    const detail = await fetchGroupDetail(g._id || g.id);
    if (detail) {
      const updatedGroup = { ...g, channels: detail.channels || [], owner: detail.owner, admins: detail.admins };
      setActiveGroup(updatedGroup);
    }

    fetchMembers(g._id || g.id);
  };

  // ── File upload ──────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const compressImageClient = (file, maxSize = 1920, quality = 0.8) => {
    return new Promise((resolve) => {
      const supported = ["image/jpeg", "image/png", "image/webp"];
      if (!supported.includes(file.type)) {
        resolve(file);
        return;
      }
      if (file.size < 500 * 1024) {
        resolve(file);
        return;
      }
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width <= maxSize && img.height <= maxSize && file.size < 1024 * 1024) {
          resolve(file);
          return;
        }
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        }, "image/jpeg", quality);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // ── Send message ──────────────────────────────────────────────────────

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const hasAttach = selectedFile !== null;
    if (!newMessage.trim() && !hasAttach) return;
    if (!activeChannel || !activeGroup) return;

    const text = newMessage.trim();
    let attachments = [];

    if (hasAttach) {
      setIsUploading(true);
      try {
        const fileToUpload = await compressImageClient(selectedFile);
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const res = await axios.post(
          `${API_URL}/groups/channel/${activeChannel._id}/upload`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
        if (res.data.success) attachments = [res.data.data];
        else throw new Error("Upload failed");
      } catch (err) {
        console.error("Upload error:", err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsSending(true);

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    pendingMessages.current.add(tempId);

    const optimisticMsg = {
      _id: tempId,
      group: activeGroup._id || activeGroup.id,
      channel: activeChannel._id,
      content: text,
      type: "DEFAULT",
      createdAt: new Date().toISOString(),
      attachments,
      user: {
        _id: currentUser._id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      _optimistic: true,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const ack = await sendMessage({
        groupId: activeGroup._id || activeGroup.id,
        channelId: activeChannel._id,
        content: text,
        type: "DEFAULT",
        attachments,
      });

      pendingMessages.current.delete(tempId);
      setMessages(prev => prev.map(m =>
        m._id === tempId
          ? { ...m, _id: ack.messageId, _optimistic: false }
          : m
      ));
    } catch (err) {
      pendingMessages.current.delete(tempId);
      setMessages(prev => prev.map(m =>
        m._id === tempId ? { ...m, _failed: true, _optimistic: false } : m
      ));
    } finally {
      setIsSending(false);
    }
  };

  // ── Context menu ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setMenuTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setMenuTarget(msg);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleCopyMessage = () => {
    const text = menuTarget?.content || menuTarget?._plaintext || "";
    if (text) navigator.clipboard.writeText(text);
    setShowMenu(false);
    setMenuTarget(null);
  };

  const handleDeleteMessage = async () => {
    const msg = menuTarget;
    if (!msg) return;
    setShowMenu(false);
    setMenuTarget(null);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_URL}/groups/channel/${activeChannel._id}/messages/${msg._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.filter(m => m._id !== msg._id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handlePinMessage = async () => {
    const msg = menuTarget;
    if (!msg) return;
    setShowMenu(false);
    setMenuTarget(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/groups/channel/${activeChannel._id}/messages/${msg._id}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages(prev => prev.map(m =>
          m._id === msg._id ? { ...m, pinned: !m.pinned } : m
        ));
      }
    } catch (err) {
      console.error("Pin error:", err);
    }
  };

  const handleInfoMessage = async () => {
    const msg = menuTarget;
    if (!msg) return;
    setShowMenu(false);
    setMenuTarget(null);
    setLoadingInfo(true);
    setShowInfoModal(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/groups/channel/${activeChannel._id}/messages/${msg._id}/reads`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInfoData(res.data.data || []);
    } catch (err) {
      setInfoData([]);
    } finally {
      setLoadingInfo(false);
    }
  };

  // ── Typing handler ────────────────────────────────────────────────────

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (activeChannel) emitTyping(activeChannel._id);
  };

  // ── Channel switch ────────────────────────────────────────────────────

  const switchChannel = (channel) => {
    const chId = channel._id || channel.id;
    if (chId === activeChannel?._id) return;
    setActiveChannel({ ...channel, _id: chId });
  };

  // ── Group creation ────────────────────────────────────────────────────

  const resetCreateGroupModal = () => {
    setShowCreateGroupModal(false);
    setCreateStep(1);
    setGroupName("");
    setGroupDescription("");
    setGroupType("CLUB");
    setJoinPolicy("PUBLIC");
    setMessagePermission("everyone");
    setAssignAsAdmin(false);
    setMemberSearch("");
    setMemberResults([]);
    setInvitedMembers([]);
    setGroupCreationError(null);
    setErrorContext(null);
  };

  const searchUsers = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/search?query=${query}`);
      setMemberResults(res.data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const addInviteMember = (user) => {
    const userId = user.id || user._id;
    if (!invitedMembers.find(m => (m.id || m._id) === userId)) {
      setInvitedMembers([...invitedMembers, user]);
    }
    setMemberSearch("");
    setMemberResults([]);
  };

  const removeInviteMember = (id) => {
    setInvitedMembers(invitedMembers.filter(m => (m.id || m._id) !== id));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setGroupCreationError(null);
    setErrorContext(null);
    setIsCreatingGroup(true);

    try {
      const token = localStorage.getItem("token");
      const payload = { name: groupName, description: groupDescription, type: groupType, joinPolicy, messagePermission };

      const res = await axios.post(`${API_URL}/groups`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newGroup = res.data.data;
      if (invitedMembers.length > 0) {
        for (const member of invitedMembers) {
          const memberId = member.id || member._id;
          try {
            await axios.post(`${API_URL}/groups/${newGroup._id}/members`, { userId: memberId }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (assignAsAdmin) {
              const adminRole = newGroup.roles?.find(r => r.name === "Admin");
              if (adminRole) {
                await axios.patch(`${API_URL}/groups/${newGroup._id}/members/${memberId}/role`,
                  { roleId: adminRole._id },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }
            }
          } catch (memberError) {
            setGroupCreationError(`Failed to add member`);
          }
        }
      }
      await fetchGroups();
      resetCreateGroupModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create group";
      setGroupCreationError(errorMessage);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#070708] w-full">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-zinc-400 mb-8 max-w-sm mx-auto">You must be logged in to view and participate in Groups & Clubs.</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg active:scale-95">Return to Home</button>
        </div>
      </div>
    );
  }

  const filtered = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = filterType === "all" || (filterType === "groups" && g.type === "group") || (filterType === "clubs" && g.type === "club");
    return matchSearch && matchType;
  });

  const isActiveMember = activeGroup?.isMember || false;

  return (
    <div className="flex h-full w-full overflow-hidden text-white md:pb-0 pb-0" style={{ background: "#0a0a0a", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* LEFT PANEL */}
      <aside className={`flex flex-col shrink-0 border-r border-white/[0.04] transition-all duration-300 h-full ${showRight ? "hidden md:flex" : "flex"} w-full md:w-[320px] lg:w-[360px]`} style={{ background: "#111111" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0">
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">Orbit</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">Groups & Clubs</p>
          </div>
          <button onClick={() => setShowCreateGroupModal(true)} className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.07] flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90" title="New group"><Plus size={16} /></button>
        </div>

        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:bg-white/[0.07] focus:border-white/[0.15] transition-all" />
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-3 shrink-0">
          {[["all","All"], ["groups","Groups"], ["clubs","Clubs"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val)} className={`px-3.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${filterType === val ? "bg-white text-black border-white" : "bg-transparent text-zinc-500 border-white/[0.08] hover:text-white hover:border-white/20"}`}>{label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "none" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-700"><Search size={26} /><p className="text-xs font-bold uppercase tracking-widest">No results</p></div>
          ) : (
            filtered.map((g) => <GroupRow key={g.id} group={g} active={activeGroup?.id === g.id} onClick={() => selectGroup(g)} />)
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-0 border-t border-white/[0.04] shrink-0 md:py-3" style={{ background: "#0a0a0a" }}>
          <GradientAvatar initials={(currentUser?.name?.[0] || "U").toUpperCase()} from="#6366f1" to="#8b5cf6" size="sm" online={true} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.name || "Profile"}</p>
            <p className="text-[10px] text-zinc-500">Active now</p>
          </div>
          <button className="p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-white/[0.05] transition-all"><Settings size={16} /></button>
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 h-full ${showRight ? "flex" : "hidden md:flex"}`} style={{ background: "#0a0a0a" }}>
        {activeGroup ? (
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] shrink-0 z-10" style={{ background: "rgba(17,17,17,0.85)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-center gap-3">
                <button className="md:hidden p-1.5 -ml-1.5 text-zinc-500 hover:text-white transition-colors" onClick={() => setShowRight(false)}><ArrowLeft size={20} /></button>
                <GradientAvatar initials={activeGroup.icon} from={activeGroup.from} to={activeGroup.to} size="sm" />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white leading-tight truncate">{activeGroup.name}</h2>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[240px]">{activeGroup.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-600 bg-white/[0.03] px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> Offline
                  </span>
                )}
              </div>
            </header>

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-5 py-2 border-b border-white/[0.04] shrink-0" style={{ background: "rgba(17,17,17,0.6)" }}>
              {["chat", "about", "members"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? "bg-white text-black shadow-lg"
                      : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]"
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                {!isActiveMember && (
                  <button className="px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-white text-black hover:bg-zinc-100 transition-all active:scale-95 shadow-lg">
                    + Join
                  </button>
                )}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "none" }}>
              {/* ─── CHAT TAB ─── */}
              {activeTab === "chat" && (
                <>
                  {/* Messages */}
                  <div ref={messagesContainerRef} onScroll={handleScroll} className="px-5 py-5 space-y-0.5" style={{ minHeight: activeChannel ? "auto" : "100%" }}>
                    {activeChannel ? (
                      <>
                        {loadingMore && (
                          <div className="flex justify-center py-3">
                            <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                        {!hasMoreMessages && messages.length > 0 && (
                          <div className="text-center py-3">
                            <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Beginning of conversation</span>
                          </div>
                        )}
                        {isLoadingMessages ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Loading messages...</p>
                            </div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-[#050505] border border-white/[0.03] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                              <Hashtag size={26} className="text-zinc-700" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-2 tracking-tight">#{activeChannel.name}</h3>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">
                              Start a new conversation
                            </p>
                          </div>
                        ) : (
                          messages.map((msg, i) => {
                            const prevMsg = messages[i - 1];
                            const isSequence = prevMsg && (prevMsg.user?._id || prevMsg.user) === (msg.user?._id || msg.user) && new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 300000;
                            const isMine = (msg.user?._id || msg.user) === (currentUser?._id || currentUser?.id);
                            const isRead = readMessages.has(msg._id);

                            return (
                              <div key={msg._id} onContextMenu={(e) => handleContextMenu(e, msg)} className={`group flex ${isMine ? "flex-row-reverse" : ""} pl-4 pr-5 py-1.5 transition-all duration-200 ${!isSequence ? "mt-3" : ""} hover:bg-white/[0.01] rounded-xl -mx-4 px-4`}>
                                {!isSequence && !isMine ? (
                                  <div className="w-9 h-9 rounded-xl bg-black flex-shrink-0 overflow-hidden mr-3 mt-0.5 border border-white/[0.05] shadow-xl shadow-white/5">
                                    {msg.user?.avatar ? (
                                      <img src={msg.user.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-white/[0.02] text-zinc-600 uppercase tracking-widest">
                                        {msg.user?.name?.[0]?.toUpperCase() || "?"}
                                      </div>
                                    )}
                                  </div>
                                ) : !isSequence && isMine ? (
                                  <div className="w-9 h-9 rounded-xl bg-black flex-shrink-0 overflow-hidden ml-3 mt-0.5 border border-white/[0.05] shadow-xl shadow-white/5">
                                    {currentUser?.avatar ? (
                                      <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black bg-white/[0.02] text-zinc-600 uppercase tracking-widest">
                                        {currentUser?.name?.[0]?.toUpperCase() || "U"}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className={`w-9 ${isMine ? "ml-3" : "mr-3"} flex-shrink-0`} />
                                )}

                                <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"}`}>
                                  {!isSequence && (
                                    <div className={`flex items-center gap-2 mb-1 ${isMine ? "justify-end" : ""}`}>
                                      <span className="font-bold text-xs text-white/80 hover:text-zinc-300 cursor-pointer transition-colors tracking-tight">
                                        {isMine ? "You" : msg.user?.name}
                                      </span>
                                      <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">
                                        {formatTime(msg.createdAt)}
                                      </span>
                                    </div>
                                  )}
                                  <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                    isMine
                                      ? "bg-white text-black rounded-2xl rounded-br-sm shadow-lg"
                                      : "bg-white/[0.06] text-zinc-200 rounded-2xl rounded-bl-sm border border-white/[0.04]"
                                  } ${msg._optimistic ? "opacity-70" : ""} ${msg._failed ? "opacity-40 border-red-500/30" : ""} ${msg.content && msg.attachments?.length ? "px-4 pt-2.5" : msg.attachments?.length ? "p-1.5" : "px-4 py-2.5"}`}>
                                    {msg.content && <div className={msg.attachments?.length ? "mb-2" : ""}>{msg.content}</div>}
                                    {msg.attachments?.length > 0 && (
                                      <div className="space-y-1">
                                        {msg.attachments.map(att => (
                                          att.contentType?.startsWith("image/") ? (
                                            <img
                                              key={att.id}
                                              src={att.url}
                                              alt={att.filename}
                                              className="max-w-full rounded-lg cursor-pointer select-none"
                                              style={{ maxHeight: "400px", objectFit: "contain" }}
                                              loading="lazy"
                                              onClick={() => setLightboxImage(att.url)}
                                            />
                                          ) : (
                                            <a
                                              key={att.id}
                                              href={att.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                                                isMine ? "bg-black/5 hover:bg-black/10" : "bg-white/[0.08] hover:bg-white/[0.12]"
                                              }`}
                                            >
                                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                              <div className="min-w-0">
                                                <p className="text-xs font-medium truncate max-w-[220px]">{att.filename}</p>
                                                <p className="text-[10px] opacity-50 mt-0.5">{getFileSize(att.size)}</p>
                                              </div>
                                            </a>
                                          )
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {isMine && !msg._optimistic && !msg._failed && (
                                    <div className="flex items-center gap-0.5 mt-1 justify-end">
                                      <span className={`text-[9px] ${isRead ? "text-blue-400" : "text-zinc-600"}`}>
                                        {isRead ? "✓✓" : "✓"}
                                      </span>
                                    </div>
                                  )}
                                  {msg._failed && (
                                    <span className="text-[8px] text-red-500/60 font-bold uppercase tracking-widest mt-1">Failed to send</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                              {typingUsers.map(u => u.name).join(", ")} typing...
                            </span>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full px-8 text-center pt-20">
                        <div className="w-16 h-16 bg-[#050505] border border-white/[0.03] rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                          <Hashtag size={26} className="text-zinc-800" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-400 mb-1">Starting conversation</h3>
                        <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Loading channel...</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ─── ABOUT TAB ─── */}
              {activeTab === "about" && (
                <div className="px-6 py-6 space-y-5" style={{ animation: "fadeUp 0.25s ease-out" }}>
                  <div className="h-28 rounded-2xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${activeGroup.from}30, ${activeGroup.to}18)`, border: `1px solid ${activeGroup.from}28` }}>
                    <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }} />
                  </div>
                  <div className="flex items-start justify-between gap-4 -mt-2">
                    <div className="flex items-center gap-4">
                      <GradientAvatar initials={activeGroup.icon} from={activeGroup.from} to={activeGroup.to} size="lg" />
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">{activeGroup.name}</h2>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ background: `${activeGroup.from}22`, color: activeGroup.from, border: `1px solid ${activeGroup.from}44` }}>
                          {activeGroup.type}
                        </span>
                      </div>
                    </div>
                    {!isActiveMember && (
                      <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-100 transition-all active:scale-95 shadow-lg shrink-0">
                        <Plus size={14} /> Join
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{activeGroup.description}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Members", value: (activeGroup.members || 0).toLocaleString() },
                      { label: "Type", value: (activeGroup.type || "club").charAt(0).toUpperCase() + (activeGroup.type || "club").slice(1) },
                      { label: "Status", value: isActiveMember ? "Joined ✓" : "Open" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-center">
                        <p className="text-base font-bold text-white">{value}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">About</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">{activeGroup.description}</p>
                  </div>
                </div>
              )}

              {/* ─── MEMBERS TAB ─── */}
              {activeTab === "members" && (
                <div className="px-5 py-4 space-y-0.5" style={{ animation: "fadeUp 0.25s ease-out" }}>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-3 py-2">
                    {isLoadingMembers ? "Loading..." : `${members.length} Members`}
                  </p>
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer border border-transparent hover:border-white/[0.04] group">
                      <GradientAvatar initials={m.initials} from={activeGroup.from} to={activeGroup.to} size="sm" online={m.online} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                        <p className="text-[10px] text-zinc-600 capitalize">{m.role} · {m.online ? "Online" : "Offline"}</p>
                      </div>
                      {m.role === "admin" && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.06]">Admin</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message input — fixed at bottom, outside scrollable area */}
            {activeChannel && activeTab === "chat" && (
              <div className="px-4 pb-0 pt-3 border-t border-white/[0.04] shrink-0 md:pb-4" style={{ background: "rgba(17,17,17,0.85)", backdropFilter: "blur(16px)" }}>
                {!isActiveMember ? (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <Lock size={14} className="text-zinc-700" />
                    <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Join this group to send messages</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                    {selectedFile && (
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          {selectedFile.type?.startsWith("image/") ? (
                            <img src={URL.createObjectURL(selectedFile)} alt="preview" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-zinc-500">{getFileSize(selectedFile.size)}</p>
                          </div>
                        </div>
                        <button type="button" onClick={removeSelectedFile} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition" disabled={isUploading || isSending}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-rar-compressed,application/x-7z-compressed,application/json"
                        className="hidden"
                      />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 w-10 h-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition flex items-center justify-center" disabled={isUploading || isSending}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      </button>
                      <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2.5 border transition-all bg-white/[0.04] border-white/[0.07] focus-within:bg-white/[0.07] focus-within:border-white/[0.16]">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={handleTyping}
                          placeholder={`Message ${activeGroup.name}…`}
                          disabled={isSending || isUploading}
                          className="flex-1 bg-transparent outline-none text-sm text-white placeholder-zinc-600 disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                        className="min-w-[44px] h-11 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-100 disabled:opacity-20 disabled:grayscale transition-all active:scale-90 shadow-lg shadow-white/10 shrink-0 px-4"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : isSending ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center"><Hashtag size={32} className="text-zinc-800" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Select a community</h3>
              <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest font-bold">Choose a group or club to start chatting</p>
            </div>
          </div>
        )}
      </main>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img
            src={lightboxImage}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showMenu && menuTarget && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[180px] bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl py-1 overflow-hidden"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button
            onClick={handleCopyMessage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
          <button
            onClick={handlePinMessage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>
            {menuTarget.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={handleDeleteMessage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
          <div className="border-t border-white/[0.06] my-1" />
          <button
            onClick={handleInfoMessage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Info
          </button>
        </div>
      )}

      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setShowInfoModal(false); setInfoData([]); }}
        >
          <div
            className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl w-[320px] max-h-[60vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">Message Info</h3>
              <button onClick={() => { setShowInfoModal(false); setInfoData([]); }} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-2 overflow-y-auto max-h-[50vh]" style={{ scrollbarWidth: "none" }}>
              {loadingInfo ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                </div>
              ) : infoData.length === 0 ? (
                <p className="text-center text-sm text-zinc-600 py-8 font-bold uppercase tracking-widest">No views yet</p>
              ) : (
                infoData.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03]">
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {r.userId?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.userId?.name || "Unknown"}</p>
                      <p className="text-[10px] text-zinc-600">{r.readAt ? formatTime(r.readAt) : ""}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <GroupsModals
        showCreateGroupModal={showCreateGroupModal}
        resetCreateGroupModal={resetCreateGroupModal}
        createStep={createStep}
        setCreateStep={setCreateStep}
        groupName={groupName}
        setGroupName={setGroupName}
        groupDescription={groupDescription}
        setGroupDescription={setGroupDescription}
        groupType={groupType}
        setGroupType={setGroupType}
        joinPolicy={joinPolicy}
        setJoinPolicy={setJoinPolicy}
        messagePermission={messagePermission}
        setMessagePermission={setMessagePermission}
        assignAsAdmin={assignAsAdmin}
        setAssignAsAdmin={setAssignAsAdmin}
        memberSearch={memberSearch}
        setMemberSearch={setMemberSearch}
        memberResults={memberResults}
        searchUsers={searchUsers}
        addInviteMember={addInviteMember}
        invitedMembers={invitedMembers}
        removeInviteMember={removeInviteMember}
        isCreatingGroup={isCreatingGroup}
        handleCreateGroup={handleCreateGroup}
        groupCreationError={groupCreationError}
        errorContext={errorContext}
      />
    </div>
  );
};

export default GroupsPage;