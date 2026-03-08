import {
  Hashtag,
  Menu,
  Plus,
  Group,
  Settings,
  Send,
  Refresh,
  Message,
  LogOut,
  Xmark,
  Microphone,
  MediaVideo,
  Phone,
  Bell,
  Pin,
  Search,
  AtSign,
  Shield,
  UserPlus,
  Edit,
  Crown,
  ArrowDown,
  ArrowRight,
  Lock,
  User as UserIcon,
  Gift,
  Emoji,
  Upload,
  MediaImage as ImageIcon,
  InfoCircle,
  TriangleFlag,
  Trash,
  MoreHoriz,
} from "iconoir-react";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import CustomModal from "./CustomModal";
import {
  generateGroupKey,
  encryptGroupKey,
  decryptGroupKey,
  decryptMessage,
  cacheGroupKey,
  getCachedGroupKey,
  loadPrivateKey,
  clearGroupKey,
} from "../utils/crypto";

// Modular Components
import OrbitRail from "./groups/OrbitRail";
import ChannelSidebar from "./groups/ChannelSidebar";
import ChatArea from "./groups/ChatArea";
import MemberSidebar from "./groups/MemberSidebar";
import GroupsModals from "./groups/GroupsModals";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:5000/api";

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString();
};

// ─── Component ────────────────────────────────────────────────────────────────

const GroupsPage = ({ isSidebarOpen, currentUser, token }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(
    window.innerWidth >= 1024,
  );
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showChannelCategories, setShowChannelCategories] = useState({
    text: true,
    // voice: true, // COMMENTED OUT - Voice channels disabled
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("overview");
  const [messageContextMenu, setMessageContextMenu] = useState(null); // { messageId, x, y }
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("text");
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [e2eeStatus, setE2eeStatus] = useState("idle"); // idle | loading | ready | error
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  // Phase 2: member invite state
  const [createStep, setCreateStep] = useState(1); // 1 = details, 2 = add members
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [invitedMembers, setInvitedMembers] = useState([]); // [{_id, name, handle, publicKey}]
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  // Phase 4: UI state
  const [activeChatTab, setActiveChatTab] = useState("chat"); // chat | files
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollMultiple, setPollMultiple] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  // Invites
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket, isConnected, sendEncryptedMessage } = useSocket();

  const college = currentUser?.college || "AIT Bangalore";

  // ── Responsive ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowMembersModal(false);
        setShowMobileSidebar(false);
      } else {
        setShowMembersModal(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mutual exclusion for mobile sidebars
  useEffect(() => {
    if (window.innerWidth < 1024) {
      if (showMembersModal) setShowMobileSidebar(false);
    }
  }, [showMembersModal]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      if (showMobileSidebar) setShowMembersModal(false);
    }
  }, [showMobileSidebar]);

  // ── E2EE: decrypt group key for the active group ────────────────────────────
  const unlockGroupKey = useCallback(
    async (group) => {
      if (!group || !currentUser) return;
      if (getCachedGroupKey(group._id)) {
        setE2eeStatus("ready");
        return;
      }

      setE2eeStatus("loading");
      try {
        const userId = currentUser._id || currentUser.id;
        // Find this user's encrypted key in the members array
        const memberEntry = group.members?.find(
          (m) => (m.userId?._id || m.userId)?.toString() === userId?.toString(),
        );

        // Check if user is actually a member of the group
        if (!memberEntry) {
          setE2eeStatus("idle");
          return;
        }

        if (!memberEntry?.encryptedGroupKey) {
          setE2eeStatus("error");
          return;
        }

        const privateKey = await loadPrivateKey();
        if (!privateKey) {
          setE2eeStatus("error");
          return;
        }

        const aesKey = await decryptGroupKey(
          memberEntry.encryptedGroupKey,
          privateKey,
        );
        cacheGroupKey(group._id, aesKey);
        setE2eeStatus("ready");
      } catch (err) {
        setE2eeStatus("error");
      }
    },
    [currentUser],
  );

  // ── E2EE: decrypt a batch of messages ─────────────────────────────────────
  const decryptMessages = useCallback(async (rawMessages, groupId) => {
    const aesKey = getCachedGroupKey(groupId);
    if (!aesKey) {
      return rawMessages.map((m) => ({
        ...m,
        _plaintext: m.content || "[No key - ask admin for access]",
      }));
    }

    return Promise.all(
      rawMessages.map(async (m) => {
        if (m.ciphertext && m.iv) {
          const _plaintext = await decryptMessage(m.ciphertext, m.iv, aesKey);
          return { ...m, _plaintext };
        }
        return { ...m, _plaintext: m.content || "" };
      }),
    );
  }, []);

  // ── E2EE: owner/admin auto key distribution for members ───────────────────
  const autoDistributeKeysForGroup = useCallback(
    async (group) => {
      if (!group || !currentUser) return;

      const myId = currentUser._id || currentUser.id;
      if (!myId) return;

      const ownerId = group.owner?._id || group.owner;
      const adminIds = (group.admins || []).map((a) => a._id || a);
      const isOwnerOrAdmin =
        ownerId?.toString() === myId.toString() ||
        adminIds.some((id) => id?.toString() === myId.toString());

      if (!isOwnerOrAdmin) return;

      const aesKey = getCachedGroupKey(group._id);
      if (!aesKey) return; // Owner/admin must have already unlocked the group key on this device

      const membersNeedingKey = (group.members || []).filter(
        (m) => !m.encryptedGroupKey && (m.userId?._id || m.userId),
      );
      if (membersNeedingKey.length === 0) return;

      try {
        await Promise.allSettled(
          membersNeedingKey.map((m) => {
            const targetId = m.userId?._id || m.userId;
            return distributeKeyToMember(group._id, targetId, aesKey);
          }),
        );

        // Refresh group so UI sees updated encryptedGroupKey flags
        const { data: freshGroup } = await api.get(`/groups/${group._id}`);
        setActiveGroup(freshGroup);
        setGroups((prev) =>
          prev.map((g) => (g._id === freshGroup._id ? freshGroup : g)),
        );
      } catch (err) {
      }
    },
    [currentUser],
  );

  // ── Phase 4: helper – derive files/notes list ─────────────────────────────
  const filesAndNotes = messages.filter((m) => {
    const hasAttachments = m.attachments && m.attachments.length > 0;
    const text = m._plaintext || m.content || "";
    const looksLikeUrl = /https?:\/\/\S+/i.test(text);
    return hasAttachments || looksLikeUrl;
  });

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = async (message) => {
      if (
        !activeChannel ||
        message.channel?.toString() !== activeChannel._id?.toString()
      )
        return;
      // Decrypt on the fly
      const aesKey = getCachedGroupKey(message.group || activeGroup?._id);
      let _plaintext = message.content || "";
      if (aesKey && message.ciphertext && message.iv) {
        _plaintext = await decryptMessage(
          message.ciphertext,
          message.iv,
          aesKey,
        );
      }
      const decrypted = { ...message, _plaintext };

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, decrypted];
      });
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    };

    const handleUserTyping = ({ userId, name, channelId }) => {
      if (channelId !== activeChannel?._id) return;
      setTypingUsers((prev) =>
        prev.find((u) => u.userId === userId)
          ? prev
          : [...prev, { userId, name }],
      );
    };

    const handleUserStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    const handleGroupUpdated = () => fetchGroups();

    const handlePollUpdated = ({ messageId, poll }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, poll } : m)),
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                content: "",
                ciphertext: null,
                iv: null,
                attachments: [],
                poll: null,
                embeds: [],
                _plaintext: "",
                deleted: true,
                deletedTimestamp: new Date(),
              }
            : m,
        ),
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("group_updated", handleGroupUpdated);
    socket.on("poll_updated", handlePollUpdated);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("group_updated", handleGroupUpdated);
      socket.off("poll_updated", handlePollUpdated);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [socket, activeChannel, activeGroup]);

  // ── Join / leave socket rooms ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !currentUser) return;
    if (activeGroup) socket.emit("join_group", activeGroup._id);
    if (activeChannel) socket.emit("join_channel", activeChannel._id);
    return () => {
      if (activeGroup) socket.emit("leave_group", activeGroup._id);
      if (activeChannel) socket.emit("leave_channel", activeChannel._id);
    };
  }, [socket, activeGroup, activeChannel]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
  }, [currentUser]);

  // ── Default channel ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeGroup?.channels?.length > 0) {
      if (
        !activeChannel ||
        !activeGroup.channels.find((c) => c._id === activeChannel._id)
      ) {
        const defaultCh =
          activeGroup.channels.find((c) => c.name === "general") ||
          activeGroup.channels[0];
        setActiveChannel(defaultCh);
      }
    }
    if (activeGroup) unlockGroupKey(activeGroup);
  }, [activeGroup]);

  // ── When owner/admin with key opens a group, auto-share keys with members ─
  useEffect(() => {
    if (activeGroup) {
      autoDistributeKeysForGroup(activeGroup);
    }
  }, [activeGroup, autoDistributeKeysForGroup]);

  // ── Fetch & decrypt messages on channel change ─────────────────────────────
  useEffect(() => {
    if (activeChannel) fetchMessages(activeChannel._id);
  }, [activeChannel]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchGroups = async () => {
    if (!currentUser) return; // Don't fetch if not logged in
    
    try {
      const res = await api.get("/groups");
      const allGroups = res.data?.data || [];
      // Show all groups in the same college (or all if college not set),
      // plus any groups the user owns, regardless of college
      const visibleGroups = allGroups.filter((g) => {
        const userId = currentUser?._id || currentUser?.id;
        const isOwner = g.owner?._id?.toString() === userId?.toString() || g.owner?.toString() === userId?.toString();

        if (!currentUser?.college) return true;
        return isOwner || (!g.college || g.college === currentUser.college);
      });

      setGroups(visibleGroups);
      if (visibleGroups.length > 0 && !activeGroup)
        setActiveGroup(visibleGroups[0]);
    } catch (err) {
      console.error("fetchGroups error:", err);
    }
  };

  // ── Join group ─────────────────────────────────────────────────────────────
  const handleJoinGroup = async () => {
    if (!activeGroup) return;
    try {
      const { data } = await api.post(`/groups/${activeGroup._id}/join`);
      const updated = data;
      setGroups((prev) => {
        const exists = prev.some((g) => g._id === updated._id);
        if (exists) {
          return prev.map((g) => (g._id === updated._id ? updated : g));
        }
        return [updated, ...prev];
      });
      setActiveGroup(updated);
      
      // Check if user was added without a key (join request approved scenario)
      const userId = currentUser?._id || currentUser?.id;
      const memberEntry = updated.members?.find(
        (m) => (m.userId?._id || m.userId)?.toString() === userId?.toString(),
      );
      
      if (memberEntry && !memberEntry.encryptedGroupKey) {
        // User joined but doesn't have a key yet - show info message
        setModalConfig({
          isOpen: true,
          title: "Joined Successfully",
          message: `You have joined "${activeGroup.name}". Please wait for the admin to distribute the encryption key to read messages.`,
          type: "info",
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to join group";
      setModalConfig({
        isOpen: true,
        title: "Join Failed",
        message: msg,
        type: "error",
      });
    }
  };

  // ── Invite link generation ────────────────────────────────────────────────
  const handleGenerateInvite = async () => {
    if (!activeGroup) return;
    try {
      setIsGeneratingInvite(true);
      const { data } = await api.post(`/groups/${activeGroup._id}/invite`, {
        maxUses: 50,
        expiresIn: 7 * 24 * 60 * 60, // 7 days
      });
      setInviteCode(data.inviteCode);
    } catch (err) {
      console.error("Invite generation error:", err);
      const msg =
        err?.response?.data?.message || "Failed to generate invite link";
      setModalConfig({
        isOpen: true,
        title: "Invite Failed",
        message: msg,
        type: "error",
      });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(
        `/groups/channel/${channelId}/messages?limit=50`,
      );
      const raw = res.data?.data || [];
      const decrypted = await decryptMessages(raw, activeGroup?._id);
      setMessages(decrypted);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    } catch (err) {
      console.error("fetchMessages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── Phase 4: Poll creation & voting ───────────────────────────────────────

  const resetPollModal = () => {
    setShowPollModal(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollMultiple(false);
    setIsCreatingPoll(false);
  };

  const handlePollOptionChange = (index, value) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addPollOption = () => {
    setPollOptions((prev) => [...prev, ""]);
  };

  const removePollOption = (index) => {
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePoll = async (e) => {
    e?.preventDefault();
    if (!activeChannel || isCreatingPoll) return;
    const cleanedOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || cleanedOptions.length < 2) return;

    try {
      setIsCreatingPoll(true);
      const { data } = await api.post(
        `/groups/channel/${activeChannel._id}/polls`,
        {
          question: pollQuestion.trim(),
          options: cleanedOptions,
          multiple: pollMultiple,
        },
      );
      setMessages((prev) => [...prev, data]);
      resetPollModal();
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    } catch (err) {
      console.error("createPoll error:", err);
      setModalConfig({
        isOpen: true,
        title: "Poll Failed",
        message: "Could not create poll. Please try again.",
        type: "error",
      });
      setIsCreatingPoll(false);
    }
  };

  const handleVotePoll = async (messageId, optionId) => {
    if (!activeChannel) return;
    try {
      const { data } = await api.post(
        `/groups/channel/${activeChannel._id}/messages/${messageId}/vote`,
        { optionId },
      );
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, poll: data } : m)),
      );
    } catch (err) {
      console.error("votePoll error:", err);
    }
  };

  // ── File Upload Handlers ──────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const uploadFile = async (file, channelId) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      const { data } = await api.post(`/groups/channel/${channelId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      return data; // Returns the attachment object
    } catch (err) {
      console.error("File upload failed:", err);
      throw new Error(err?.response?.data?.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // ── Send message (E2EE) ────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChannel || isSending) return;

    // Check channel message permissions
    const channelPermissions = activeChannel.messagePermissions || "everyone";
    if (channelPermissions === "admin") {
      const isAdmin = isActiveOwner || isActiveAdmin;
      if (!isAdmin) {
        setModalConfig({
          isOpen: true,
          title: "Permission Denied",
          message: "Only admins can send messages in this channel.",
          type: "error",
        });
        return;
      }
    }

    const aesKey = getCachedGroupKey(activeGroup?._id);
    if (!aesKey) {
      setModalConfig({
        isOpen: true,
        title: "Encryption Error",
        message: "Group key not loaded. Please wait a moment and try again.",
        type: "error",
      });
      return;
    }

    setIsSending(true);
    let attachment = null;

    try {
      if (selectedFile) {
        attachment = await uploadFile(selectedFile, activeChannel._id);
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: "Upload Failed",
        message: err.message,
        type: "error",
      });
      setIsSending(false);
      return;
    }

    const optimisticMsg = {
      _id: `opt_${Date.now()}`,
      group: activeGroup._id,
      channel: activeChannel._id,
      _plaintext: newMessage,
      type: "ENCRYPTED",
      timestamp: new Date().toISOString(),
      user: {
        _id: currentUser?._id || currentUser?.id,
        name: currentUser?.name,
        avatar: currentUser?.avatar,
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      80,
    );

    try {
      await sendEncryptedMessage({
        groupId: activeGroup._id,
        channelId: activeChannel._id,
        groupAesKey: aesKey,
        text: optimisticMsg._plaintext,
        attachments: attachment ? [attachment] : [],
      });
      clearSelectedFile();
    } catch (err) {
      console.error("sendEncryptedMessage failed:", err);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      setModalConfig({
        isOpen: true,
        title: "Send Failed",
        message: err.message,
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  // ── Typing indicator ───────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !activeChannel) return;
    socket.emit("typing", {
      channelId: activeChannel._id,
      groupId: activeGroup?._id,
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { channelId: activeChannel._id });
    }, 2000);
  };

  // ── Phase 2: distribute AES group key to a single member ─────────────────
  const distributeKeyToMember = async (groupId, userId, aesKey) => {
    try {
      // 1. Fetch target user's public key
      const { data } = await api.get(`/keys/${userId}`);
      if (!data?.publicKey) throw new Error("No public key found for user");
      // 2. Encrypt AES key with their RSA public key
      const encryptedGroupKey = await encryptGroupKey(aesKey, data.publicKey);
      // 3. Store in DB
      //    First try to add as a new member; if already a member, fall back to updating their key
      try {
        await api.post(`/groups/${groupId}/members`, {
          userId,
          encryptedGroupKey,
        });
      } catch (err) {
        const status = err?.response?.status;
        if (status === 400) {
          // Likely "User is already a member" – update key instead
          await api.patch(`/groups/${groupId}/members/${userId}/key`, {
            encryptedGroupKey,
          });
        } else {
          throw err;
        }
      }
    } catch (err) {
    }
  };

  const handleDistributeKeyToMember = async (memberUserId) => {
    if (!activeGroup) return;
    const aesKey = getCachedGroupKey(activeGroup._id);
    if (!aesKey) {
      setModalConfig({
        isOpen: true,
        title: "Encryption Error",
        message:
          "Group key not loaded on this device. Open the group with the owner/admin account and try again.",
        type: "error",
      });
      return;
    }
    try {
      await distributeKeyToMember(activeGroup._id, memberUserId, aesKey);
      // Refresh group to get updated encryptedGroupKey flags
      const { data } = await api.get(`/groups/${activeGroup._id}`);
      setActiveGroup(data);
      setGroups((prev) => prev.map((g) => (g._id === data._id ? data : g)));
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Failed to share key";
      setModalConfig({
        isOpen: true,
        title: "Key Distribution Failed",
        message: msg,
        type: "error",
      });
    }
  };

  // ── Phase 2: search users for the invite step ─────────────────────────────
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setMemberResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await api.get(
        `/users/search?q=${encodeURIComponent(query)}`,
      );
      const myId = currentUser?._id || currentUser?.id;
      setMemberResults(
        (data || []).filter(
          (u) => u._id !== myId && !invitedMembers.some((m) => m._id === u._id),
        ),
      );
    } catch (err) {
      setMemberResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addInviteMember = (user) => {
    setInvitedMembers((prev) => [...prev, user]);
    setMemberResults((prev) => prev.filter((u) => u._id !== user._id));
    setMemberSearch("");
  };

  const removeInviteMember = (userId) => {
    setInvitedMembers((prev) => prev.filter((u) => u._id !== userId));
  };

  const resetCreateGroupModal = () => {
    setShowCreateGroupModal(false);
    setCreateStep(1);
    setGroupName("");
    setGroupDescription("");
    setMemberSearch("");
    setMemberResults([]);
    setInvitedMembers([]);
  };

  // ── Create group (Phase 2: full multi-member key distribution) ────────────
  const handleCreateGroup = async () => {
    if (!groupName.trim() || isCreatingGroup) return;
    setIsCreatingGroup(true);
    try {
      // 1. Create the group (creator is added automatically by backend)
      const res = await api.post("/groups", {
        name: groupName,
        description: groupDescription,
        college,
      });
      const createdGroup = res.data;
      const groupId = createdGroup?._id;
      if (!groupId) throw new Error("No group ID returned");

      // 2. Generate AES-GCM-256 group key (one per group, lives in memory)
      const aesKey = await generateGroupKey();
      cacheGroupKey(groupId, aesKey);

      // 3. Distribute AES key to the creator (self)
      const myId = currentUser?._id || currentUser?.id;
      await distributeKeyToMember(groupId, myId, aesKey);

      // 4. Distribute AES key to every invited member (in parallel)
      if (invitedMembers.length > 0) {
        await Promise.allSettled(
          invitedMembers.map((member) =>
            distributeKeyToMember(groupId, member._id, aesKey),
          ),
        );
      }

      resetCreateGroupModal();

      // Fetch the freshly created group so we have updated members (with encryptedGroupKey)
      const { data: freshGroup } = await api.get(`/groups/${groupId}`);
      setGroups((prev) => [freshGroup, ...prev]);
      setActiveGroup(freshGroup);
    } catch (err) {
      console.error("createGroup error:", err);
      setModalConfig({
        isOpen: true,
        title: "Creation Failed",
        message: err.message || "Failed to create orbit",
        type: "error",
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // ── Leave Group ───────────────────────────────────────────────────────
  const handleLeaveGroup = async () => {
    if (!activeGroup || !isActiveMember) return;
    
    if (!window.confirm(`Are you sure you want to leave "${activeGroup.name}"? You will lose access to all channels and messages.`)) {
      return;
    }

    try {
      await api.post(`/groups/${activeGroup._id}/leave`);
      
      // Remove group from local state
      setGroups(prev => prev.filter(g => g._id !== activeGroup._id));
      
      // Clear cached key for this group
      clearGroupKey(activeGroup._id);
      
      // Reset active group and channel
      setActiveGroup(null);
      setActiveChannel(null);
      
      // Clear messages
      setMessages([]);
      
      setModalConfig({
        isOpen: true,
        title: "Left Group",
        message: `You have successfully left "${activeGroup.name}"`,
        type: "success"
      });
    } catch (err) {
      console.error("leaveGroup error:", err);
      setModalConfig({
        isOpen: true,
        title: "Leave Failed",
        message: err.message || "Failed to leave group",
        type: "error"
      });
    }
  };

  // ── Leave Channel ─────────────────────────────────────────────────────
  const handleLeaveChannel = async () => {
    if (!activeChannel || !isActiveMember) return;
    
    if (!window.confirm(`Are you sure you want to leave "#${activeChannel.name}"? You will lose access to all messages in this channel.`)) {
      return;
    }

    try {
      await api.post(`/groups/${activeGroup._id}/channels/${activeChannel._id}/leave`);
      
      // Remove channel from local state
      setActiveGroup(prev => ({
        ...prev,
        channels: prev.channels.filter(c => c._id !== activeChannel._id)
      }));
      
      // Reset active channel
      setActiveChannel(null);
      
      // Clear messages for this channel
      setMessages([]);
      
      setModalConfig({
        isOpen: true,
        title: "Left Channel",
        message: `You have successfully left "#${activeChannel.name}"`,
        type: "success"
      });
    } catch (err) {
      console.error("leaveChannel error:", err);
      setModalConfig({
        isOpen: true,
        title: "Leave Failed",
        message: err.message || "Failed to leave channel",
        type: "error"
      });
    }
  };
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim() || !activeGroup) return;
    try {
      const res = await api.post(`/groups/${activeGroup._id}/channels`, {
        name: channelName,
        type: channelType,
      });
      setActiveGroup((prev) => ({
        ...prev,
        channels: [...(prev.channels || []), res.data],
      }));
      setShowCreateChannelModal(false);
      setChannelName("");
    } catch (err) {
      setModalConfig({
        isOpen: true,
        title: "Creation Failed",
        message: "Failed to create channel",
        type: "error",
      });
    }
  };

  // ── Update Channel Permissions ──────────────────────────────────────────
  const handleUpdateChannelPermissions = async (channelId, permissions) => {
    if (!activeGroup) return;
    try {
      await api.put(`/groups/${activeGroup._id}/channels/${channelId}`, {
        messagePermissions: permissions,
      });
      setActiveGroup((prev) => ({
        ...prev,
        channels: prev.channels.map((c) =>
          c._id === channelId ? { ...c, messagePermissions: permissions } : c
        ),
      }));
    } catch (err) {
      console.error("Failed to update channel permissions:", err);
      setModalConfig({
        isOpen: true,
        title: "Update Failed",
        message: "Failed to update channel permissions",
        type: "error",
      });
    }
  };

  const handleDeleteChannel = async (channelId, channelName) => {
    if (!activeGroup || !window.confirm(`Are you sure you want to delete "#${channelName}"? This action is permanent.`)) return;
    try {
      await api.delete(`/groups/${activeGroup._id}/channels/${channelId}`);
      setActiveGroup(prev => ({
        ...prev,
        channels: prev.channels.filter(c => c._id !== channelId)
      }));
      if (activeChannel?._id === channelId) {
        setActiveChannel(null);
        setMessages([]);
      }
      setModalConfig({
        isOpen: true,
        title: "Channel Deleted",
        message: `Channel "#${channelName}" has been successfully deleted.`,
        type: "success"
      });
    } catch (err) {
      console.error("Failed to delete channel:", err);
      setModalConfig({
        isOpen: true,
        title: "Deletion Failed",
        message: "Failed to delete channel. Please try again.",
        type: "error"
      });
    }
  };

  // ── E2EE badge ────────────────────────────────────────────────────────────
  const E2EEBadge = () => {
    // Don't show E2EE status for non-members
    if (!isActiveMember) {
      return null;
    }

    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
          e2eeStatus === "ready"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : e2eeStatus === "loading"
              ? "bg-white/[0.02] text-zinc-500 border border-white/[0.05]"
              : e2eeStatus === "error"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-black text-zinc-600 border border-white/[0.03]"
        }`}
      >
        <Lock size={9} />
        {e2eeStatus === "ready"
          ? "Encrypted"
          : e2eeStatus === "loading"
            ? "Decrypting…"
            : e2eeStatus === "error"
              ? "Key Error"
              : "Encrypted"}
      </div>
    );
  };

  // ── Members list ───────────────────────────────────────────────────────────
  // Keep full member objects so we retain encryptedGroupKey and role info
  const membersList = activeGroup?.members || [];

  const currentUserId = currentUser?._id || currentUser?.id;
  const isActiveMember = !!(
    activeGroup &&
    currentUserId &&
    (activeGroup.members || []).some((m) => {
      const uid = m.userId?._id || m.userId;
      return uid?.toString() === currentUserId.toString();
    })
  );
  const isActiveOwner = !!(
    activeGroup &&
    currentUserId &&
    (activeGroup.owner?._id || activeGroup.owner)?.toString() ===
      currentUserId.toString()
  );
  const isActiveAdmin = !!(
    activeGroup &&
    currentUserId &&
    (activeGroup.admins || []).some(
      (a) => (a._id || a || "").toString() === currentUserId.toString(),
    )
  );

  // ── Message context menu handlers ──────────────────────────────────────────
  const handleMessageContextMenu = (e, messageId) => {
    e.preventDefault();
    e.stopPropagation();

    let x = e.clientX;
    let y = e.clientY;

    if (x + 160 > window.innerWidth) {
      x = window.innerWidth - 170;
    }

    if (y + 100 > window.innerHeight) {
      y = y - 100;
    }

    setMessageContextMenu({ messageId, x, y });
  };

  const handleReportMessage = async (messageId) => {
    if (!activeChannel) return;
    try {
      await api.post(`/groups/channel/${activeChannel._id}/messages/${messageId}/report`, {
        reason: "intel_report"
      });
      setMessageContextMenu(null);
      setModalConfig({
        isOpen: true,
        title: "Report Filed",
        message: "Message has been flagged for personnel review.",
        type: "info"
      });
    } catch (err) {
      console.error("handleReportMessage error:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!activeChannel) return;
    try {
      const res = await api.delete(`/groups/channel/${activeChannel._id}/messages/${messageId}`);
      if (res.data) {
        // Update local state immediately for the user who deleted
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? {
                  ...m,
                  content: "",
                  ciphertext: null,
                  iv: null,
                  attachments: [],
                  poll: null,
                  embeds: [],
                  _plaintext: "",
                  deleted: true,
                  deletedTimestamp: new Date(),
                }
              : m,
          ),
        );
      }
      setMessageContextMenu(null);
    } catch (err) {
      console.error("handleDeleteMessage error:", err);
      setModalConfig({
        isOpen: true,
        title: "Revocation Failed",
        message: err.response?.data?.message || "Failed to delete message.",
        type: "error"
      });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────

  // Settings Modal Components
  // Settings Modal Components
  const SettingsOverview = () => (
  <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 sm:w-24 sm:h-24 bg-black rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-2xl sm:text-4xl font-black text-white border border-white/[0.05] shadow-2xl mb-4 sm:mb-6">
        {activeGroup?.name?.[0]?.toUpperCase()}
      </div>
      <h2 className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase">{activeGroup?.name}</h2>
      <p className="text-zinc-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mt-2">Active Orbit Status</p>
    </div>

    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      {[
        { label: 'Personnel', value: activeGroup?.members?.length || 0 },
        { label: 'Channels', value: activeGroup?.channels?.length || 0 },
        { label: 'Security', value: 'E2EE' },
        { label: 'Latency', value: '0.04ms' }
      ].map((stat, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/[0.03] p-4 sm:p-6 rounded-2xl sm:rounded-3xl group hover:bg-white/[0.04] transition-all">
          <div className="text-[9px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</div>
          <div className="text-base sm:text-lg font-black text-white tracking-tight">{stat.value}</div>
        </div>
      ))}
    </div>

    <div className="space-y-4 pt-4 border-t border-white/[0.03]">
      <div className="flex justify-between items-center bg-white/[0.02] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/[0.03]">
        <div>
          <div className="text-sm font-bold text-white tracking-tight">Encryption Keys</div>
          <div className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mt-1">Status: ROTATING</div>
        </div>
        <button className="px-4 py-2 sm:px-5 sm:py-2.5 bg-black border border-white/[0.05] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.03] hover:text-white transition-all active:scale-95 shadow-xl shadow-white/2">Rotate</button>
      </div>
    </div>
  </div>
);

  const SettingsMembers = () => (
  <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Active Personnel</h3>
      <span className="text-[10px] font-black text-white bg-white/5 border border-white/[0.05] px-2 py-1 rounded-md tracking-widest">{membersList.length}</span>
    </div>
    
    <div className="space-y-2">
      {membersList.map(member => {
        const userObj = member.userId && typeof member.userId === 'object' ? member.userId : member;
        const hasKey = !!member.encryptedGroupKey;
        const isSelf = currentUser?._id === (userObj._id || member.userId);
        const isAdminRole = isActiveOwner || isActiveAdmin;
        
        return (
          <div key={userObj._id || Math.random()} className="flex items-center justify-between p-3 sm:p-4 bg-white/[0.02] border border-white/[0.03] rounded-xl sm:rounded-2xl group hover:bg-white/[0.04] transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black border border-white/[0.05] flex items-center justify-center font-black text-zinc-800 text-xs shadow-lg shadow-white/2">
                {userObj.avatar ? <img src={userObj.avatar} className="w-full h-full rounded-xl object-cover" /> : userObj.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  {userObj.name}
                  {isSelf && <span className="text-[8px] font-black uppercase text-zinc-800 tracking-tighter">(You)</span>}
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest mt-0.5">
                  {hasKey ? <span className="text-zinc-500">Auth</span> : <span className="text-zinc-800">Pending</span>}
                </div>
              </div>
            </div>
            
            {isAdminRole && !hasKey && !isSelf && (
              <button
                onClick={() => handleDistributeKeyToMember(userObj._id || member.userId)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-black rounded-lg sm:rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-white/10 active:scale-95 transition-all hover:bg-zinc-100"
              >
                Auth
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
);


      const SettingsModeration = () => (
  <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4">
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-4 sm:mb-8">Channel Infrastructure</h3>
      <div className="space-y-3 sm:space-y-4">
        {activeGroup?.channels?.map(channel => (
          <div key={channel._id} className="p-4 sm:p-6 bg-white/[0.02] rounded-2xl sm:rounded-[1.5rem] border border-white/[0.03] group hover:bg-white/[0.04] transition-all">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black border border-white/[0.05] flex items-center justify-center text-zinc-700 shadow-lg shadow-white/2">
                  {channel.type === "text" ? <Hashtag size={16} sm:size={18} /> : <Microphone size={16} sm:size={18} />}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">{channel.name}</div>
                  <div className="text-[9px] font-black text-zinc-800 uppercase tracking-widest mt-0.5">{channel.type}</div>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <select
                  value={channel.messagePermissions || "everyone"}
                  onChange={(e) => handleUpdateChannelPermissions(channel._id, e.target.value)}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-black border border-white/[0.05] rounded-lg sm:rounded-xl text-white text-[9px] font-black uppercase tracking-widest focus:border-white transition-all appearance-none cursor-pointer outline-none"
                >
                  <option value="everyone">Public</option>
                  <option value="admin">Restricted</option>
                </select>
                {channel.name !== "general" && isActiveOwner && (
                  <button
                    onClick={() => handleDeleteChannel(channel._id, channel.name)}
                    className="p-2 text-zinc-800 hover:text-red-500 transition-all active:scale-90"
                  >
                    <Trash size={16} sm:size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

      const SettingsGeneral = () => (
  <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4">
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-4 sm:mb-8">System Configuration</h3>
      <div className="bg-white/[0.02] border border-white/[0.03] rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-8 space-y-6 sm:space-y-8">
        <div>
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 sm:mb-3 block">Encryption Protocol</label>
          <div className="text-xs sm:text-sm font-bold text-white tracking-widest">AES-256-GCM</div>
        </div>
        <div>
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 sm:mb-3 block">Quantum Resistance</label>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse blur-[1px]" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">Verified Level 4</span>
          </div>
        </div>
      </div>
    </div>

    {isActiveOwner && (
      <div className="pt-6 sm:pt-8 border-t border-white/[0.03]">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-900 mb-4 sm:mb-8">Thermal Destruct</h3>
        <div className="bg-red-950/5 border border-red-900/20 rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-8">
          <p className="text-red-900/50 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] leading-relaxed mb-4 sm:mb-6">
            Permanent termination of all orbit data.
          </p>
          <button className="px-6 sm:px-8 py-3 sm:py-4 bg-red-950/10 border border-red-900/30 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-red-900/10">
            Execute Purge
          </button>
        </div>
      </div>
    )}
  </div>
);

  if (!currentUser) {
    return (
      <div className={`flex h-[calc(100vh-64px)] overflow-hidden bg-black text-white font-sans transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Login Required</h2>
            <p className="text-zinc-400 max-w-md mx-auto">
              Please login to access groups and connect with your community
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-[calc(100vh-64px)] overflow-hidden bg-black text-white font-sans transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : ""}`}
    >
      {/* Mobile Backdrop */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 top-16 bg-black/90 backdrop-blur-2xl z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* 1 & 2. Unified Navigation (Mobile Drawer + Desktop Sidebars) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 md:relative md:translate-x-0 md:z-10 ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <OrbitRail
          groups={groups}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          setShowCreateGroupModal={setShowCreateGroupModal}
        />
        <ChannelSidebar
          activeGroup={activeGroup}
          isActiveMember={isActiveMember}
          isActiveOwner={isActiveOwner}
          isActiveAdmin={isActiveAdmin}
          handleJoinGroup={handleJoinGroup}
          setShowCreateChannelModal={setShowCreateChannelModal}
          setShowInviteModal={setShowInviteModal}
          setInviteCode={setInviteCode}
          handleLeaveGroup={handleLeaveGroup}
          showChannelCategories={showChannelCategories}
          setShowChannelCategories={setShowChannelCategories}
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          currentUser={currentUser}
          setShowSettingsModal={setShowSettingsModal}
          isConnected={isConnected}
          setShowMobileSidebar={setShowMobileSidebar}
        />
      </div>

      {/* 3. Chat Area */}
      <ChatArea
        activeChannel={activeChannel}
        loadingMessages={loadingMessages}
        activeChatTab={activeChatTab}
        setActiveChatTab={setActiveChatTab}
        messages={messages}
        currentUser={currentUser}
        handleMessageContextMenu={handleMessageContextMenu}
        formatTime={formatTime}
        formatDate={formatDate}
        filesAndNotes={filesAndNotes}
        typingUsers={typingUsers}
        e2eeStatus={e2eeStatus}
        isSending={isSending}
        handleTyping={handleTyping}
        handleSendMessage={handleSendMessage}
        newMessage={newMessage}
        setShowPollModal={setShowPollModal}
        setShowMobileSidebar={setShowMobileSidebar}
        showMembersModal={showMembersModal}
        setShowMembersModal={setShowMembersModal}
        handleLeaveChannel={handleLeaveChannel}
        isActiveMember={isActiveMember}
        messagesEndRef={messagesEndRef}
        E2EEBadge={E2EEBadge}
        handleVotePoll={handleVotePoll}
        handleFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        clearSelectedFile={clearSelectedFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* 4. Member Sidebar */}
      <MemberSidebar
        showMembersModal={showMembersModal}
        setShowMembersModal={setShowMembersModal}
        membersList={membersList}
        currentUserId={currentUserId}
        isActiveOwner={isActiveOwner}
        isActiveAdmin={isActiveAdmin}
        handleDistributeKeyToMember={handleDistributeKeyToMember}
        activeGroup={activeGroup}
      />

      {/* 5. Modals & Overlays */}
      <GroupsModals
        showCreateGroupModal={showCreateGroupModal}
        resetCreateGroupModal={resetCreateGroupModal}
        createStep={createStep}
        setCreateStep={setCreateStep}
        groupName={groupName}
        setGroupName={setGroupName}
        groupDescription={groupDescription}
        setGroupDescription={setGroupDescription}
        memberSearch={memberSearch}
        setMemberSearch={setMemberSearch}
        isSearching={isSearching}
        searchUsers={searchUsers}
        memberResults={memberResults}
        addInviteMember={addInviteMember}
        invitedMembers={invitedMembers}
        removeInviteMember={removeInviteMember}
        handleCreateGroup={handleCreateGroup}
        isCreatingGroup={isCreatingGroup}
        showCreateChannelModal={showCreateChannelModal}
        setShowCreateChannelModal={setShowCreateChannelModal}
        channelName={channelName}
        setChannelName={setChannelName}
        channelType={channelType}
        setChannelType={setChannelType}
        handleCreateChannel={handleCreateChannel}
        showPollModal={showPollModal}
        resetPollModal={resetPollModal}
        pollQuestion={pollQuestion}
        setPollQuestion={setPollQuestion}
        pollOptions={pollOptions}
        handlePollOptionChange={handlePollOptionChange}
        removePollOption={removePollOption}
        addPollOption={addPollOption}
        pollMultiple={pollMultiple}
        setPollMultiple={setPollMultiple}
        isCreatingPoll={isCreatingPoll}
        handleCreatePoll={handleCreatePoll}
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        inviteCode={inviteCode}
        handleGenerateInvite={handleGenerateInvite}
        isGeneratingInvite={isGeneratingInvite}
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        activeSettingsTab={activeSettingsTab}
        setActiveSettingsTab={setActiveSettingsTab}
        activeGroup={activeGroup}
        SettingsOverview={SettingsOverview}
        SettingsMembers={SettingsMembers}
        SettingsModeration={SettingsModeration}
        SettingsGeneral={SettingsGeneral}
        isActiveOwner={isActiveOwner}
        isActiveAdmin={isActiveAdmin}
      />

      {/* Message Context Menu */}
      {messageContextMenu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setMessageContextMenu(null)}
          />
          <div
            className="fixed z-[70] bg-[#050505] border border-white/[0.05] rounded-[1.5rem] shadow-2xl py-2 min-w-[200px] text-zinc-400 backdrop-blur-3xl overflow-hidden"
            style={{ top: messageContextMenu.y, left: messageContextMenu.x }}
          >
            <button
              onClick={() => handleReportMessage(messageContextMenu.messageId)}
              className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.03] hover:text-white flex items-center gap-3 transition-all"
            >
              <TriangleFlag size={14} className="text-zinc-600" />
              Report Message
            </button>
            {(() => {
              const msg = messages.find((m) => m._id === messageContextMenu.messageId);
              const isAuthor = (msg?.user?._id || msg?.user) === (currentUser?._id || currentUser?.id);
              const isMod = isActiveOwner || isActiveAdmin;
              
              if (isAuthor || isMod) {
                return (
                  <button
                    onClick={() => handleDeleteMessage(messageContextMenu.messageId)}
                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-950/20 hover:text-red-500 flex items-center gap-3 transition-all"
                  >
                    <Trash size={14} className="text-red-900/50" />
                     Delete message
                  </button>
                );
              }
              return null;
            })()}
          </div>
        </>
      )}

      {/* Custom Modal */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};

export default GroupsPage;

