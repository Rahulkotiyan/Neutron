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
  const groupMenuRef = useRef(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoData, setInfoData] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState(new Set());
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addMemberResults, setAddMemberResults] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [memberMenuTarget, setMemberMenuTarget] = useState(null);
  const inputRef = useRef(null);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState(null);
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

  // ── Socket listeners for active group presence ─────────────────────────

  useEffect(() => {
    if (!activeGroup?._id || !activeGroup?.id || !socket) return;
    const gid = activeGroup._id || activeGroup.id;

    socket.emit("join_group", gid);

    const handlePresence = ({ userId, online }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (online) next.add(userId); else next.delete(userId);
        return next;
      });
    };

    socket.on("user_presence", handlePresence);

    socket.on("presence_snapshot", ({ userIds }) => {
      setOnlineUsers(new Set(userIds));
    });

    return () => {
      socket.emit("leave_group", gid);
      socket.off("user_presence", handlePresence);
      socket.off("presence_snapshot");
    };
  }, [activeGroup?._id, activeGroup?.id, socket]);

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
    const replyingTo = replyTo;
    setReplyTo(null);
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
      replyTo: replyingTo ? { _id: replyingTo._id, content: replyingTo.content, user: { name: replyingTo.user?.name } } : null,
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
        replyTo: replyingTo?._id || null,
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
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setShowGroupMenu(false);
      }
      if (memberMenuTarget) {
        setMemberMenuTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [memberMenuTarget]);

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

  // ── Group menu actions ──────────────────────────────────────────────

  const handleAddMember = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/groups/${activeGroup._id || activeGroup.id}/members`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddMemberResults([]);
      setAddMemberSearch("");
    } catch (err) {
      console.error("Add member error:", err);
    }
  };

  const searchAddMember = async (q) => {
    setAddMemberSearch(q);
    if (q.trim().length < 2) { setAddMemberResults([]); return; }
    try {
      const res = await axios.get(`${API_URL}/search?query=${q}`);
      setAddMemberResults(res.data.users || []);
    } catch (err) {
      setAddMemberResults([]);
    }
  };

  const handleSelectMessages = () => {
    setShowGroupMenu(false);
    setSelectMode(true);
    setSelectedMsgIds(new Set());
  };

  const toggleSelectMsg = (id) => {
    setSelectedMsgIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const ids = [...selectedMsgIds];
    try {
      const token = localStorage.getItem("token");
      await Promise.all(ids.map(id =>
        axios.delete(
          `${API_URL}/groups/channel/${activeChannel._id}/messages/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ));
      setMessages(prev => prev.filter(m => !ids.includes(m._id)));
      setSelectMode(false);
      setSelectedMsgIds(new Set());
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  };

  const handleClearChat = () => {
    setShowGroupMenu(false);
    setMessages([]);
  };

  const handleReportGroup = () => {
    setShowGroupMenu(false);
    if (confirm("Report this group to moderators?")) {
      console.log("Group reported:", activeGroup?._id || activeGroup?.id);
    }
  };

  // ── Admin member actions ──────────────────────────────────────────────

  const getGroupId = () => activeGroup?._id || activeGroup?.id;

  const handleKickMember = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/groups/${getGroupId()}/members/${userId}/kick`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err) { console.error("Kick error:", err); }
  };

  const handleBanMember = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/groups/${getGroupId()}/members/${userId}/ban`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err) { console.error("Ban error:", err); }
  };

  const handleToggleAdmin = async (userId, makeAdmin) => {
    try {
      const token = localStorage.getItem("token");
      if (makeAdmin) {
        const groupDetail = await axios.get(`${API_URL}/groups/${getGroupId()}`, { headers: { Authorization: `Bearer ${token}` } });
        const adminRole = groupDetail.data.data?.roles?.find(r => r.name === "Admin");
        if (adminRole) {
          await axios.patch(`${API_URL}/groups/${getGroupId()}/members/${userId}/role`, { roleId: adminRole._id }, { headers: { Authorization: `Bearer ${token}` } });
        }
      } else {
        await axios.patch(`${API_URL}/groups/${getGroupId()}/members/${userId}/role`, { roleId: null }, { headers: { Authorization: `Bearer ${token}` } });
      }
      const gid = getGroupId();
      const detail = await fetchGroupDetail(gid);
      if (detail) setActiveGroup(prev => ({ ...prev, admins: detail.admins }));
      fetchMembers(gid);
    } catch (err) { console.error("Role change error:", err); }
  };

  // ── Context menu actions ────────────────────────────────────────────

  const handleReplyMessage = () => {
    const msg = menuTarget;
    if (!msg) return;
    setReplyTo({ _id: msg._id, content: msg.content, user: msg.user, attachments: msg.attachments });
    setShowMenu(false);
    setMenuTarget(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleReportMessage = async () => {
    const msg = menuTarget;
    if (!msg) return;
    setShowMenu(false);
    setMenuTarget(null);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/groups/${activeGroup._id || activeGroup.id}/channel/${activeChannel._id}/messages/${msg._id}/report`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Report error:", err);
    }
  };

  const handleSelectFromMenu = () => {
    const msg = menuTarget;
    if (!msg) return;
    setShowMenu(false);
    setMenuTarget(null);
    setSelectMode(true);
    setSelectedMsgIds(new Set([msg._id]));
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
    setGroupAvatar(null);
    setGroupAvatarPreview(null);
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

      let iconUrl = null;
      if (groupAvatar) {
        const formData = new FormData();
        formData.append("file", groupAvatar);
        const uploadRes = await axios.post(`${API_URL}/groups/avatar`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.success) iconUrl = uploadRes.data.data.url;
      }

      const payload = { name: groupName, description: groupDescription, type: groupType, joinPolicy, messagePermission, ...(iconUrl && { icon: iconUrl }) };

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
                {selectMode ? (
                  <>
                    <span className="text-[11px] text-zinc-500 font-bold tracking-wider">{selectedMsgIds.size} selected</span>
                    <button onClick={() => { setSelectMode(false); setSelectedMsgIds(new Set()); }} className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors px-3 py-1.5">
                      Cancel
                    </button>
                  </>
                ) : (
                  <div className="relative" ref={groupMenuRef}>
                    <button onClick={() => setShowGroupMenu(prev => !prev)} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                    {showGroupMenu && (
                      <div className="absolute top-full right-0 mt-1 w-52 bg-zinc-900 border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                        <button onClick={() => { setShowGroupMenu(false); setShowAddMember(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors text-left">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                          Add Members
                        </button>
                        <button onClick={handleSelectMessages} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors text-left">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          Select Messages
                        </button>
                        <div className="h-px bg-white/[0.06] mx-3 my-1" />
                        <button onClick={handleClearChat} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors text-left">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          Clear Chat
                        </button>
                        <button onClick={handleReportGroup} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition-colors text-left">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Report Group
                        </button>
                      </div>
                    )}
                  </div>
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
                  <div ref={messagesContainerRef} onScroll={handleScroll} className="px-5 py-5 space-y-0.5" style={{ minHeight: activeChannel ? "auto" : "100%", paddingBottom: selectMode && selectedMsgIds.size > 0 ? "72px" : "20px" }}>
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
                              <div key={msg._id} onContextMenu={(e) => handleContextMenu(e, msg)} onClick={() => { if (selectMode) toggleSelectMsg(msg._id); }} className={`group flex ${isMine ? "flex-row-reverse" : ""} items-start pl-4 pr-5 py-1.5 transition-all duration-200 ${!isSequence ? "mt-3" : ""} hover:bg-white/[0.01] rounded-xl -mx-4 px-4 ${selectMode ? "cursor-pointer" : ""} ${selectedMsgIds.has(msg._id) ? "bg-white/[0.04]" : ""}`}>
                                {selectMode && (
                                  <div className={`flex-shrink-0 ${isMine ? "ml-3 order-1" : "mr-3"} mt-2`} onClick={(e) => { e.stopPropagation(); toggleSelectMsg(msg._id); }}>
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedMsgIds.has(msg._id) ? "bg-white border-white" : "border-zinc-600 hover:border-zinc-400"}`}>
                                      {selectedMsgIds.has(msg._id) && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                      )}
                                    </div>
                                  </div>
                                )}
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
                                  {msg.replyTo && (() => {
                                    const replied = messages.find(m => m._id === msg.replyTo);
                                    return replied ? (
                                      <div className={`mb-1.5 px-3 py-2 rounded-xl ${isMine ? "bg-black/5" : "bg-white/[0.08]"} border-l-2 ${isMine ? "border-black/30" : "border-white/30"}`}>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">{replied.user?.name || "Unknown"}</p>
                                        <p className="text-xs text-zinc-400 truncate">{replied.content || (replied.attachments?.length > 0 ? "Attachment" : "")}</p>
                                      </div>
                                    ) : null;
                                  })()}
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
                  {members.map((m) => {
                    const isOnline = onlineUsers.has(m.id);
                    const ownerId = activeGroup?.owner?._id || activeGroup?.owner;
                    const isOwner = ownerId === m.id;
                    const isAdmin = (activeGroup?.admins || []).some(a => (a._id || a) === m.id);
                    const currentUserId = currentUser?._id || currentUser?.id;
                    const isCurrentUserOwner = ownerId === currentUserId;
                    const isCurrentUserAdmin = isCurrentUserOwner || (activeGroup?.admins || []).some(a => (a._id || a) === currentUserId);
                    const roleLabel = isOwner ? "Owner" : isAdmin ? "Admin" : "Member";
                    const showActions = (isCurrentUserAdmin && !isOwner && m.id !== currentUserId) || (isCurrentUserOwner && m.id !== currentUserId);
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/[0.04] group">
                        <div className="relative shrink-0">
                          <GradientAvatar initials={m.initials} from={activeGroup.from} to={activeGroup.to} size="sm" />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${isOnline ? "bg-emerald-500" : "bg-zinc-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                            {isOwner && <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-500 border border-yellow-500/20">Owner</span>}
                            {isAdmin && !isOwner && <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">Admin</span>}
                          </div>
                          <p className="text-[10px] text-zinc-600">{isOnline ? "Online" : "Offline"}</p>
                        </div>
                        {showActions && (
                          <div className="relative shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setMemberMenuTarget(memberMenuTarget?.id === m.id ? null : m); }} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </button>
                            {memberMenuTarget?.id === m.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden z-50 py-1">
                                <button onClick={() => { handleToggleAdmin(m.id, !isAdmin); setMemberMenuTarget(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors text-left">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                  {isAdmin ? "Remove Admin" : "Make Admin"}
                                </button>
                                <button onClick={() => { handleKickMember(m.id); setMemberMenuTarget(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition-colors text-left">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                  Kick
                                </button>
                                <button onClick={() => { handleBanMember(m.id); setMemberMenuTarget(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition-colors text-left">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                  Ban
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    {replyTo && (
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] border-l-2 border-l-white/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Replying to {replyTo.user?.name || "Unknown"}</p>
                          <p className="text-xs text-zinc-400 truncate">{replyTo.content || (replyTo.attachments?.length > 0 ? "📎 Attachment" : "")}</p>
                        </div>
                        <button type="button" onClick={() => setReplyTo(null)} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    )}
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
                          ref={inputRef}
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
          className="fixed z-50 min-w-[190px] bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl py-1 overflow-hidden"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button
            onClick={handleReplyMessage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Reply
          </button>
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
            onClick={handleSelectFromMenu}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Select
          </button>
          <div className="border-t border-white/[0.06] my-1" />
          <button
            onClick={handleDeleteMessage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
          <button
            onClick={handleReportMessage}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.06] transition text-left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Report
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

      {/* ── Add Members Overlay ── */}
      {showAddMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setShowAddMember(false); setAddMemberSearch(""); setAddMemberResults([]); }}
        >
          <div
            className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl w-[340px] max-h-[60vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">Add Members</h3>
              <button onClick={() => { setShowAddMember(false); setAddMemberSearch(""); setAddMemberResults([]); }} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-3">
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={addMemberSearch}
                  onChange={(e) => searchAddMember(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-[40vh]" style={{ scrollbarWidth: "none" }}>
                {addMemberResults.length === 0 && addMemberSearch.length >= 2 ? (
                  <p className="text-center text-sm text-zinc-600 py-8 font-bold uppercase tracking-widest">No users found</p>
                ) : addMemberSearch.length < 2 ? (
                  <p className="text-center text-sm text-zinc-600 py-8">Type at least 2 characters</p>
                ) : (
                  addMemberResults.map(user => (
                    <div key={user._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.03]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-white truncate">{user.name}</span>
                      </div>
                      <button
                        onClick={() => handleAddMember(user._id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-white bg-white/[0.08] hover:bg-white/[0.14] px-3.5 py-1.5 rounded-lg transition shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Select Mode Bottom Bar ── */}
      {selectMode && selectedMsgIds.size > 0 && (
        <div className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t border-white/[0.06] z-20" style={{ background: "rgba(17,17,17,0.95)", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400 font-bold transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete ({selectedMsgIds.size})
            </button>
            <button
              onClick={() => { setSelectMode(false); setSelectedMsgIds(new Set()); }}
              className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition px-4 py-2.5"
            >
              Cancel
            </button>
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
        groupAvatar={groupAvatar}
        setGroupAvatar={setGroupAvatar}
        groupAvatarPreview={groupAvatarPreview}
        setGroupAvatarPreview={setGroupAvatarPreview}
      />
    </div>
  );
};

export default GroupsPage;