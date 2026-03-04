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
  Lock,
  User as UserIcon,
  Gift,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Info,
  Flag,
  Trash2,
  MoreVertical,
} from "lucide-react";
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
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        console.error("Failed to unlock group key:", err);
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
        console.warn("autoDistributeKeysForGroup error:", err?.message || err);
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
    if (!socket) return;

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

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("group_updated", handleGroupUpdated);
    socket.on("poll_updated", handlePollUpdated);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("group_updated", handleGroupUpdated);
      socket.off("poll_updated", handlePollUpdated);
    };
  }, [socket, activeChannel, activeGroup]);

  // ── Join / leave socket rooms ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    if (activeGroup) socket.emit("join_group", activeGroup._id);
    if (activeChannel) socket.emit("join_channel", activeChannel._id);
    return () => {
      if (activeGroup) socket.emit("leave_group", activeGroup._id);
      if (activeChannel) socket.emit("leave_channel", activeChannel._id);
    };
  }, [socket, activeGroup, activeChannel]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchGroups();
  }, []);

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
    try {
      const res = await api.get("/groups");
      const allGroups = res.data || [];
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
      console.log("Generating invite for group:", activeGroup._id);
      const { data } = await api.post(`/groups/${activeGroup._id}/invite`, {
        maxUses: 50,
        expiresIn: 7 * 24 * 60 * 60, // 7 days
      });
      console.log("Invite response:", data);
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
      const raw = res.data || [];
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
      });
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
      console.warn(`Key distribution failed for ${userId}:`, err.message);
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
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : e2eeStatus === "loading"
              ? "bg-neutral-700/50 text-neutral-400 border border-neutral-600"
              : e2eeStatus === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-neutral-800 text-neutral-500 border border-neutral-700"
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

  // ──────────────────────────────────────────────────────────────────────────

  // Settings Modal Components
  const SettingsOverview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Group Overview</h3>
        <div className="bg-neutral-800/50 rounded-xl p-5 space-y-5 border border-neutral-700/50">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-neutral-700 flex items-center justify-center ring-2 ring-neutral-600">
              {activeGroup?.icon ? (
                <img src={activeGroup.icon} className="w-full h-full rounded-xl object-cover" alt="icon" />
              ) : (
                <span className="text-xl font-bold text-neutral-300">
                  {activeGroup?.name?.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">{activeGroup?.name}</h4>
              <p className="text-neutral-500 text-sm mt-1">{activeGroup?.description || "No description"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 pt-5 border-t border-neutral-700">
            <div className="p-3 bg-neutral-800/50 rounded-lg">
              <div className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Members</div>
              <div className="text-white font-bold text-lg">{membersList.length}</div>
            </div>
            <div className="p-3 bg-neutral-800/50 rounded-lg">
              <div className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Channels</div>
              <div className="text-white font-bold text-lg">{activeGroup?.channels?.length || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsMembers = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [pendingRequests, setPendingRequests] = useState(activeGroup?.joinRequests || []);
    const [isSearching, setIsSearching] = useState(false);

    const filteredMembers = membersList.filter(member => {
      const userObj = member.userId && typeof member.userId === "object" ? member.userId : member;
      const name = userObj.name || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleApproveRequest = async (requestId, userId) => {
      try {
        await api.post(`/groups/${activeGroup._id}/join-requests/${requestId}/approve`);
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
        const { data } = await api.get(`/groups/${activeGroup._id}`);
        setActiveGroup(data);
        setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      } catch (err) {
        console.error("Failed to approve request:", err);
      }
    };

    const handleRejectRequest = async (requestId) => {
      try {
        await api.post(`/groups/${activeGroup._id}/join-requests/${requestId}/reject`);
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      } catch (err) {
        console.error("Failed to reject request:", err);
      }
    };

    const handleRemoveMember = async (memberUserId) => {
      if (!confirm("Are you sure you want to remove this member?")) return;
      try {
        await api.delete(`/groups/${activeGroup._id}/members/${memberUserId}`);
        const { data } = await api.get(`/groups/${activeGroup._id}`);
        setActiveGroup(data);
        setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      } catch (err) {
        console.error("Failed to remove member:", err);
      }
    };

    const handleMakeAdmin = async (memberUserId) => {
      try {
        await api.post(`/groups/${activeGroup._id}/admins`, { userId: memberUserId });
        const { data } = await api.get(`/groups/${activeGroup._id}`);
        setActiveGroup(data);
        setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      } catch (err) {
        console.error("Failed to make admin:", err);
      }
    };

    const handleRemoveAdmin = async (adminUserId) => {
      try {
        await api.delete(`/groups/${activeGroup._id}/admins/${adminUserId}`);
        const { data } = await api.get(`/groups/${activeGroup._id}`);
        setActiveGroup(data);
        setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      } catch (err) {
        console.error("Failed to remove admin:", err);
      }
    };

    return (
      <div className="space-y-6">
        {/* Pending Join Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Pending Join Requests</h3>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div key={request._id} className="bg-neutral-800/50 rounded-xl p-4 flex items-center justify-between border border-neutral-700/50">
                  <div>
                    <div className="text-white font-medium">User ID: {request.userId}</div>
                    {request.message && (
                      <div className="text-neutral-500 text-sm mt-1">{request.message}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(request._id, request.userId)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member Management */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Members</h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 outline-none transition-all"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
            {filteredMembers.map(member => {
              const userObj = member.userId && typeof member.userId === "object" ? member.userId : member;
              const memberUserId = userObj._id || member.userId;
              const isSelf = currentUserId && memberUserId?.toString() === currentUserId.toString();
              const isAdmin = (activeGroup?.admins || []).some(a => (a._id || a).toString() === memberUserId?.toString());
              const isOwner = (activeGroup?.owner?._id || activeGroup?.owner).toString() === memberUserId?.toString();

              return (
                <div key={memberUserId} className="bg-neutral-800/30 rounded-xl p-3.5 flex items-center justify-between border border-neutral-700/30 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-700 flex items-center justify-center ring-1 ring-neutral-600">
                      {userObj.avatar ? (
                        <img src={userObj.avatar} className="w-full h-full rounded-xl object-cover" alt="avatar" />
                      ) : (
                        <UserIcon size={16} className="text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {userObj.name || "Member"}
                        {isOwner && <Crown size={14} className="text-yellow-500" />}
                        {isAdmin && !isOwner && <Shield size={14} className="text-blue-400" />}
                        {isSelf && <span className="text-xs text-neutral-500">(You)</span>}
                      </div>
                    </div>
                  </div>
                  {(isActiveOwner || isActiveAdmin) && !isSelf && (
                    <div className="flex gap-2">
                      {!isAdmin && !isOwner && (
                        <button
                          onClick={() => handleMakeAdmin(memberUserId)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                      {isAdmin && !isOwner && (
                        <button
                          onClick={() => handleRemoveAdmin(memberUserId)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Remove Admin
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(memberUserId)}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const SettingsModeration = () => {
    const [reportedMessages, setReportedMessages] = useState([]);

    const handleDeleteMessage = async (messageId) => {
      if (!confirm("Are you sure you want to delete this message?")) return;
      try {
        await api.delete(`/groups/channel/${activeChannel._id}/messages/${messageId}`);
        fetchMessages(activeChannel._id);
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    };

    const handleResolveReport = async (reportId) => {
      try {
        console.log("Resolving report:", reportId);
      } catch (err) {
        console.error("Failed to resolve report:", err);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Message Moderation</h3>
          <div className="bg-neutral-800/50 rounded-xl p-5 border border-neutral-700/50">
            <p className="text-neutral-500 text-sm mb-5">
              Right-click on any message in the chat to access moderation options.
            </p>
            <div className="space-y-2">
              <div className="text-white text-sm font-medium">
                <strong>Available Actions:</strong>
              </div>
              <ul className="text-neutral-500 text-sm space-y-2 ml-3">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-neutral-600" /> Delete messages</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-neutral-600" /> View message reports</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-neutral-600" /> Ban users (if implemented)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reported Messages Section */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Reported Messages</h3>
          <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/30">
            <p className="text-neutral-500 text-sm">
              Message reporting system not yet implemented in backend.
            </p>
          </div>
        </div>
      </div>
    );
  };

const SettingsGeneral = () => {
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(activeGroup?.name || "");
  const [editedDescription, setEditedDescription] = useState(activeGroup?.description || "");
  const [messageRestriction, setMessageRestriction] = useState("everyone"); // "everyone" or "admin"

  const handleSaveChanges = async () => {
    try {
      await api.put(`/groups/${activeGroup._id}`, {
        name: editedName,
        description: editedDescription,
      });
      const { data } = await api.get(`/groups/${activeGroup._id}`);
      setActiveGroup(data);
      setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      setEditMode(false);
    } catch (err) {
      console.error("Failed to update group:", err);
    }
  };

  const handleUpdateRestrictions = async () => {
    console.log("Updating message restrictions:", messageRestriction);
  };

  const handleDeleteChannel = async (channelId, channelName) => {
    if (!confirm(`Are you sure you want to delete the channel "${channelName}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/groups/${activeGroup._id}/channels/${channelId}`);
      const { data } = await api.get(`/groups/${activeGroup._id}`);
      setActiveGroup(data);
      setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      
      if (activeChannel?._id === channelId) {
        const remainingChannels = data.channels.filter(c => c._id !== channelId);
        setActiveChannel(remainingChannels.length > 0 ? remainingChannels[0] : null);
      }
    } catch (err) {
      console.error("Failed to delete channel:", err);
      alert("Failed to delete channel. Please try again.");
    }
  };

  const handleMessageContextMenu = (e, messageId) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Right-click detected on message:', messageId);

    let x = e.clientX;
    let y = e.clientY;

    if (x + 160 > window.innerWidth) {
      x = window.innerWidth - 170;
    }

    if (y + 100 > window.innerHeight) {
      y = y - 100;
    }

    console.log('Setting context menu at:', x, y);
    setMessageContextMenu({ messageId, x, y });
  };

  const handleReportMessage = async (messageId) => {
    try {
      await api.post(`/groups/channel/${activeChannel._id}/messages/${messageId}/report`, {
        reason: "Reported by user",
      });
      setModalConfig({
        isOpen: true,
        title: "Message Reported",
        message: "Thank you for reporting this message. Our moderators will review it.",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to report message:", err);
      setModalConfig({
        isOpen: true,
        title: "Report Failed",
        message: "Failed to report message. Please try again.",
        type: "error",
      });
    }
    setMessageContextMenu(null);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/groups/channel/${activeChannel._id}/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      setModalConfig({
        isOpen: true,
        title: "Message Deleted",
        message: "Message has been deleted successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("Failed to delete message:", err);
      setModalConfig({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete message. Please try again.",
        type: "error",
      });
    }
    setMessageContextMenu(null);
  };

  return (
    <div className="space-y-6">
      {/* Group Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Group Information</h3>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors border border-neutral-700"
            >
              Edit
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="bg-neutral-800/50 rounded-xl p-5 space-y-4 border border-neutral-700/50">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Group Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 outline-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveChanges}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedName(activeGroup?.name || "");
                  setEditedDescription(activeGroup?.description || "");
                }}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors border border-neutral-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/30">
            <div className="space-y-4">
              <div>
                <div className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Name</div>
                <div className="text-white font-medium">{activeGroup?.name}</div>
              </div>
              <div>
                <div className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Description</div>
                <div className="text-neutral-300">{activeGroup?.description || "No description"}</div>
              </div>
              <div>
                <div className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Created</div>
                <div className="text-neutral-300">
                  {activeGroup?.createdAt ? new Date(activeGroup.createdAt).toLocaleDateString() : "Unknown"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Management */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Channel Management</h3>
        <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/30">
          <div className="space-y-4">
            <div className="text-white text-sm font-medium mb-3">Channels ({activeGroup?.channels?.length || 0})</div>
            {activeGroup?.channels?.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700">
                {activeGroup.channels.map(channel => (
                  <div key={channel._id} className="p-4 bg-neutral-800/50 rounded-xl space-y-3 border border-neutral-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {channel.type === "text" ? (
                          <Hash size={16} className="text-neutral-500" />
                        ) : (
                          <Volume2 size={16} className="text-neutral-500" />
                        )}
                        <div>
                          <div className="text-white font-medium">{channel.name}</div>
                          <div className="text-neutral-600 text-xs capitalize">{channel.type} Channel</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {channel.name !== "general" && (
                          <button
                            onClick={() => handleDeleteChannel(channel._id, channel.name)}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/30"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Channel Permissions */}
                    <div className="border-t border-neutral-700/50 pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-neutral-400 text-xs font-medium">Message Permissions</div>
                          <div className="text-neutral-600 text-xs">
                            Who can send messages in this channel?
                          </div>
                        </div>
                        <select
                          value={channel.messagePermissions || "everyone"}
                          onChange={(e) => handleUpdateChannelPermissions(channel._id, e.target.value)}
                          className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs"
                        >
                          <option value="everyone">Everyone</option>
                          <option value="admin">Admins only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-neutral-500 text-sm">No channels found</div>
            )}
            <div className="text-neutral-600 text-xs pt-2">
              Note: The "general" channel cannot be deleted.
            </div>
          </div>
        </div>
      </div>

      {/* Message Restrictions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Message Restrictions</h3>
        <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/30">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Who can send messages?
              </label>
              <select
                value={messageRestriction}
                onChange={(e) => setMessageRestriction(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 outline-none transition-all"
              >
                <option value="everyone">Everyone</option>
                <option value="admin">Admins only</option>
              </select>
            </div>
            <button
              onClick={handleUpdateRestrictions}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Update Restrictions
            </button>
            <p className="text-neutral-600 text-xs">
              Note: Message restriction system not yet implemented in backend.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isActiveOwner && (
        <div>
          <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
          <div className="bg-red-900/10 border border-red-800/40 rounded-xl p-5">
            <div className="space-y-4">
              <div>
                <h4 className="text-red-300 font-medium">Delete Group</h4>
                <p className="text-red-500/70 text-sm mt-1">
                  Permanently delete this group and all its data. This action cannot be undone.
                </p>
              </div>
              <button className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <div
      className={`flex h-[calc(100vh-64px)] overflow-hidden bg-neutral-950 text-white font-sans`}
    >
      {/* Mobile Backdrop */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* ── 1. Orbit Rail ─────────────────────────────────────────────── */}
      <div
        className={`w-20 bg-neutral-900 border-r border-neutral-800 flex-col items-center py-5 space-y-4 overflow-y-auto scrollbar-hide flex-shrink-0 z-50 transition-all duration-300 md:translate-x-0 md:relative md:flex md:h-full ${showMobileSidebar ? "fixed top-16 bottom-0 left-0 flex h-[calc(100vh-64px)]" : "hidden md:flex"}`}
      >
        <div
          onClick={() => setShowMobileSidebar(false)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-300 text-neutral-900 flex items-center justify-center mb-2 hover:scale-105 transition-all cursor-pointer shadow-lg shadow-neutral-500/20"
        >
          <MessageCircle size={26} />
        </div>

        <div className="w-8 h-[1px] bg-neutral-700 rounded-full mx-auto" />

        <div className="flex-1 space-y-3 w-full flex flex-col items-center overflow-y-auto scrollbar-hide px-2">
          {groups.map((group) => (
            <div
              key={group._id}
              className="relative group w-full flex justify-center"
            >
              {activeGroup?._id === group._id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
              )}
              <div
                onClick={() => setActiveGroup(group)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 overflow-hidden ${
                  activeGroup?._id === group._id
                    ? "bg-white text-neutral-900 shadow-xl shadow-neutral-500/30 scale-105"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {group.icon ? (
                  <img
                    src={group.icon}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xs tracking-wide">
                    {group.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-neutral-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all shadow-xl border border-neutral-700">
                {group.name}
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={() => setShowCreateGroupModal(true)}
          className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 hover:scale-105 transition-all cursor-pointer text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-600"
        >
          <Plus size={22} />
        </div>
      </div>

      {/* ── 2. Channel Sidebar ────────────────────────────────────────── */}
      <div
        className={`w-72 bg-neutral-900 border-r border-neutral-800 flex-col flex-shrink-0 z-40 transition-all duration-300 md:translate-x-0 md:relative md:flex md:h-full ${showMobileSidebar ? "fixed top-16 bottom-0 left-20 flex h-[calc(100vh-64px)]" : "hidden md:flex"}`}
      >
        <div className="h-16 px-5 flex items-center justify-between hover:bg-neutral-800/50 transition-colors border-b border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-bold text-lg truncate text-white tracking-tight">
              {activeGroup?.name || "Select an Orbit"}
            </h1>
            {activeGroup && !isActiveMember && (
              <button
                onClick={handleJoinGroup}
                className="ml-1 px-3 py-1.5 text-xs font-medium rounded-full bg-white text-neutral-900 hover:bg-neutral-200 transition-colors"
              >
                Join
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeGroup && (isActiveOwner || isActiveAdmin) && (
              <>
                <button
                  onClick={() => setShowCreateChannelModal(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-500 transition-all hidden md:inline-flex items-center gap-1"
                >
                  <Plus size={12} />
                  Channel
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(true);
                    setInviteCode("");
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-500 transition-all hidden md:inline-flex"
                >
                  <UserPlus size={12} />
                  Invite
                </button>
              </>
            )}
            {activeGroup && isActiveMember && !(isActiveOwner || isActiveAdmin) && (
              <button
                onClick={handleLeaveGroup}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-all hidden md:inline-flex items-center gap-1"
              >
                <LogOut size={12} />
                Leave
              </button>
            )}
            <div
              className="md:hidden p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileSidebar(false);
              }}
            >
              <X size={20} className="text-neutral-400" />
            </div>
          </div>
        </div>

        {activeGroup ? (
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
            {/* Group Info Card */}
            <div className="mb-6 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-neutral-700 flex items-center justify-center text-neutral-300 font-bold text-sm">
                  {activeGroup?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{activeGroup?.channels?.length || 0} channels</div>
                  <div className="text-xs text-neutral-400">{membersList.length} members</div>
                </div>
              </div>
              {activeGroup?.description && (
                <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{activeGroup.description}</p>
              )}
            </div>

            {/* Text Channels */}
            <div className="mb-4">
              <div
                className="flex items-center justify-between px-2 mb-3 text-xs font-semibold text-neutral-500 hover:text-neutral-300 uppercase tracking-wider cursor-pointer transition-colors"
                onClick={() =>
                  setShowChannelCategories((p) => ({ ...p, text: !p.text }))
                }
              >
                <div className="flex items-center gap-1.5">
                  {showChannelCategories.text ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <span>Text Channels</span>
                </div>
              </div>
              {showChannelCategories.text &&
                activeGroup.channels
                  ?.filter((c) => (c.type === "text" || c.type === "TEXT"))
                  .map((channel) => (
                    <div
                      key={channel._id}
                      onClick={() => {
                        setActiveChannel(channel);
                        setShowMobileSidebar(false);
                      }}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg mb-1.5 cursor-pointer transition-all ${
                        activeChannel?._id === channel._id 
                          ? "bg-white text-neutral-900 shadow-lg shadow-black/20" 
                          : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Hash
                          size={16}
                          className={`${activeChannel?._id === channel._id ? "text-neutral-700" : "text-neutral-500"} flex-shrink-0`}
                        />
                        <span className="truncate font-medium text-sm">
                          {channel.name}
                        </span>
                      </div>
                      {channel.name !== "general" && (
                        <Lock size={10} className="text-neutral-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-800 flex items-center justify-center">
              <MessageCircle size={28} className="text-neutral-500" />
            </div>
            <p className="text-neutral-500 text-sm">Select an orbit to see channels</p>
          </div>
        )}

        {/* User Status Footer */}
        <div className="h-[64px] bg-neutral-900 border-t border-neutral-800 px-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center relative ring-2 ring-neutral-800">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                className="rounded-full w-full h-full object-cover"
                alt="avatar"
              />
            ) : (
              <UserIcon size={18} className="text-neutral-400" />
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-neutral-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-white">
              {currentUser?.name || "Guest"}
            </div>
            <div className="text-xs text-neutral-500 truncate">Online</div>
          </div>
          <div className="flex items-center">
            <div className="p-2 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
              <Settings size={18} className="text-neutral-500 hover:text-white" onClick={() => setShowSettingsModal(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Chat Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 w-full">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-5 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="md:hidden mr-1 text-neutral-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => setShowMobileSidebar(true)}
                >
                  <Menu size={22} />
                </div>
                {activeChannel.type === "voice" ||
                activeChannel.type === "VOICE" ? (
                  <Volume2 size={20} className="text-neutral-500" />
                ) : (
                  <Hash size={20} className="text-neutral-500" />
                )}
                <h3 className="font-semibold text-base truncate text-white">
                  {activeChannel.name}
                </h3>
                {activeChannel.description && (
                  <div className="hidden md:flex items-center">
                    <div className="h-4 w-[1px] bg-neutral-700 mx-3" />
                    <span className="text-xs text-neutral-500 truncate max-w-sm">
                      {activeChannel.description}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-neutral-500">
                <E2EEBadge />
                {isActiveMember && (
                  <button
                    onClick={handleLeaveChannel}
                    className="text-neutral-500 hover:text-red-400 transition-colors"
                    title="Leave channel"
                  >
                    <LogOut size={20} />
                  </button>
                )}
                <Users
                  size={20}
                  className={`hover:text-white cursor-pointer transition-colors ${showMembersModal ? "text-white" : ""}`}
                  onClick={() => setShowMembersModal(!showMembersModal)}
                />
              </div>
            </div>

            {/* Messages / Notes & Files Tabs */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-neutral-800/50 bg-neutral-900/30">
              <div className="flex gap-1 text-sm font-medium">
                <button
                  onClick={() => setActiveChatTab("chat")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeChatTab === "chat"
                      ? "bg-white text-neutral-900 shadow-lg shadow-black/10"
                      : "text-neutral-500 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveChatTab("files")}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    activeChatTab === "files"
                      ? "bg-white text-neutral-900 shadow-lg shadow-black/10"
                      : "text-neutral-500 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <Paperclip size={14} />
                  Files
                  {filesAndNotes.length > 0 && (
                    <span className="ml-1 text-xs bg-neutral-700 text-white rounded-full px-2 py-0.5">
                      {filesAndNotes.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-28 md:pb-4 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent bg-neutral-950">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader size={32} className="animate-spin text-neutral-600" />
                </div>
              ) : activeChatTab === "chat" && messages.length === 0 ? (
                <div className="mt-16 px-4 text-center">
                  <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                    <Lock size={36} className="text-neutral-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                    Welcome to #{activeChannel.name}!
                  </h2>
                  <p className="text-neutral-500 max-w-md mx-auto leading-relaxed">
                    This channel is end-to-end encrypted. Only members can read messages.
                  </p>
                </div>
              ) : activeChatTab === "chat" ? (
                messages.map((msg, i) => {
                  const prevMsg = messages[i - 1];
                  const isSequence =
                    prevMsg &&
                    (prevMsg.user?._id || prevMsg.user) ===
                      (msg.user?._id || msg.user) &&
                    new Date(msg.timestamp) - new Date(prevMsg.timestamp) <
                      300000;

                  return (
                    <div
                      key={msg._id || i}
                      className={`group flex pl-4 pr-5 py-2 hover:bg-neutral-900/50 -mx-4 transition-colors ${!isSequence ? "mt-5" : ""}`}
                      onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}
                    >
                      {!isSequence ? (
                        <div className="w-11 h-11 rounded-xl bg-neutral-800 flex-shrink-0 overflow-hidden mr-3 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-neutral-700">
                          {msg.user?.avatar ? (
                            <img
                              src={msg.user.avatar}
                              className="w-full h-full object-cover"
                              alt="avatar"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold bg-gradient-to-br from-neutral-600 to-neutral-700 text-white">
                              {msg.user?.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-11 mr-3 flex-shrink-0 text-xs text-neutral-600 opacity-0 group-hover:opacity-100 text-right select-none self-center hidden sm:block">
                          {formatTime(msg.timestamp)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {!isSequence && (
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5" onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}>
                              <span className="font-semibold text-white hover:underline cursor-pointer">
                                {msg.user?.name}
                              </span>
                              <span className="text-xs text-neutral-600 ml-1">
                                {formatDate(msg.timestamp)} at{" "}
                                {formatTime(msg.timestamp)}
                              </span>
                              {msg.type === "ENCRYPTED" && (
                                <Lock
                                  size={9}
                                  className="text-neutral-500 ml-1"
                                  title="End-to-end encrypted"
                                />
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                let x = rect.left;
                                let y = rect.bottom + 5;

                                if (x + 160 > window.innerWidth) {
                                  x = window.innerWidth - 170;
                                }
                                if (y + 100 > window.innerHeight) {
                                  y = rect.top - 105;
                                }

                                setMessageContextMenu({
                                  messageId: msg._id,
                                  x,
                                  y
                                });
                              }}
                              className="text-neutral-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Message options"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        )}
                        {msg.type === "POLL" && msg.poll ? (
                          <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4 space-y-3 max-w-lg" onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}>
                            <div className="text-sm font-semibold text-white">
                              {msg.poll.question}
                            </div>
                            <div className="space-y-2">
                              {msg.poll.options.map((opt) => {
                                const totalVotes = opt.votes?.length || 0;
                                const myId =
                                  currentUser?._id || currentUser?.id;
                                const hasVoted = (opt.votes || []).some(
                                  (v) => v === myId || v?._id === myId,
                                );
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                      handleVotePoll(msg._id, opt.id)
                                    }
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm border transition-all ${
                                      hasVoted
                                        ? "bg-neutral-700 border-neutral-600 text-white"
                                        : "bg-neutral-900/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {opt.label}
                                    </span>
                                    <span className="ml-3 text-xs text-neutral-500">
                                      {totalVotes} vote{totalVotes === 1 ? "" : "s"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {msg.poll.closesAt && (
                              <div className="text-xs text-neutral-600">
                                Closes at{" "}
                                {new Date(msg.poll.closesAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p
                            className={`text-neutral-300 whitespace-pre-wrap break-words leading-relaxed ${
                              msg.type === "SYSTEM"
                                ? "italic text-neutral-600"
                                : ""
                            }`}
                          >
                            {msg._plaintext ?? msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : activeChatTab === "files" ? (
                filesAndNotes.length === 0 ? (
                  <div className="mt-16 px-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-neutral-800 flex items-center justify-center">
                      <Paperclip size={24} className="text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 text-sm">
                      No notes or files yet. Shared documents, links, and images will show up here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filesAndNotes.map((msg) => (
                      <div
                        key={msg._id}
                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span className="font-medium text-neutral-300">
                            {msg.user?.name || "Member"}
                          </span>
                          <span>
                            {formatDate(msg.timestamp)} •{" "}
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition-colors"
                              >
                                <Paperclip size={12} />
                                <span className="truncate max-w-[180px]">
                                  {att.filename}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                        {(() => {
                          const text = msg._plaintext || msg.content || "";
                          const urls = text.match(/https?:\/\/\S+/gi) || [];
                          if (urls.length === 0) return null;
                          return (
                            <div className="flex flex-col gap-1">
                              {urls.map((url) => (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-400 hover:underline break-all"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-5 text-xs text-neutral-500 italic">
                  <Loader size={12} className="animate-spin" />
                  {typingUsers.map((u) => u.name).join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing…
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 pb-4 bg-neutral-900 border-t border-neutral-800 pt-3 flex-shrink-0 fixed inset-x-0 bottom-16 md:static md:bottom-auto md:left-auto md:right-auto z-40">
              <form onSubmit={handleSendMessage}>
                <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-2.5 flex items-center gap-2 transition-all focus-within:bg-neutral-800 focus-within:border-neutral-600 focus-within:ring-2 focus-within:ring-neutral-700/50">
                  <div className="p-2 rounded-lg hover:bg-neutral-700 cursor-pointer text-neutral-500 transition-colors hidden sm:block">
                    <Plus size={18} />
                  </div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder={
                      e2eeStatus === "ready"
                        ? `Message #${activeChannel.name}`
                        : e2eeStatus === "loading"
                          ? "Loading keys…"
                          : `Message #${activeChannel.name}`
                    }
                    disabled={e2eeStatus === "loading" || isSending}
                    className="flex-1 bg-transparent outline-none text-white placeholder-neutral-500 disabled:opacity-50 px-2"
                  />
                  <div className="flex items-center gap-1 text-neutral-500 px-1">
                    <Gift
                      size={20}
                      className="hover:text-white cursor-pointer transition-colors hidden sm:block"
                    />
                    <Smile
                      size={20}
                      className="hover:text-white cursor-pointer transition-colors hidden sm:block"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPollModal(true)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-neutral-600 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors hidden sm:block"
                    >
                      Poll
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !newMessage.trim() ||
                        isSending ||
                        e2eeStatus !== "ready"
                      }
                      className="p-2 rounded-lg bg-white text-neutral-900 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {isSending ? (
                        <Loader size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
            <div
              className="md:hidden absolute top-4 left-4 cursor-pointer hover:text-white transition-colors"
              onClick={() => setShowMobileSidebar(true)}
            >
              <Menu size={24} />
            </div>
            <div className="w-24 h-24 bg-neutral-800 rounded-2xl flex items-center justify-center mb-5">
              <Lock size={40} className="text-neutral-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-300 mb-2">
              Select a Channel
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              All messages are end-to-end encrypted.
            </p>
            {activeGroup && isActiveMember && !(isActiveOwner || isActiveAdmin) && (
              <button
                onClick={handleLeaveGroup}
                className="mt-2 px-5 py-2.5 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <LogOut size={16} />
                Leave Group
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Members Sidebar ───────────────────────────────────────── */}
      {showMembersModal && activeChannel && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowMembersModal(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-neutral-900 border-l border-neutral-800 flex flex-col lg:relative lg:flex shadow-2xl">
            <div
              className="lg:hidden absolute top-3 right-3 text-neutral-500 cursor-pointer hover:text-white transition-colors"
              onClick={() => setShowMembersModal(false)}
            >
              <X size={20} />
            </div>
            <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-5 font-semibold text-sm text-white">
              <span className="text-neutral-300">Members</span>
              <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">{membersList.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              {membersList.map((member) => {
                const userObj =
                  member.userId && typeof member.userId === "object"
                    ? member.userId
                    : member.userId
                      ? { _id: member.userId }
                      : member;

                const memberUserId = userObj._id || member.userId;
                const hasKey = !!member.encryptedGroupKey;
                const isSelf =
                  currentUserId &&
                  memberUserId?.toString() === currentUserId.toString();

                return (
                  <div
                    key={userObj._id || JSON.stringify(member)}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800/50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center relative flex-shrink-0 ring-1 ring-neutral-700">
                      {userObj.avatar ? (
                        <img
                          src={userObj.avatar}
                          className="w-full h-full rounded-xl object-cover"
                          alt="avatar"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-neutral-400">
                          {userObj.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-900" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-neutral-200 truncate flex items-center gap-2">
                        {userObj.name || "Member"}
                        {isSelf && <span className="text-[10px] text-neutral-500">(you)</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-600">
                        {hasKey ? (
                          <>
                            <Lock size={8} className="text-emerald-500" /> 
                            <span className="text-emerald-600">Encrypted</span>
                          </>
                        ) : (
                          <>
                            <Lock size={8} className="text-neutral-600" /> 
                            <span>No key</span>
                          </>
                        )}
                      </div>
                    </div>
                    {(isActiveOwner || isActiveAdmin) && !hasKey && !isSelf && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDistributeKeyToMember(memberUserId)
                        }
                        className="ml-1 px-2.5 py-1 text-[10px] rounded-lg border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Share key
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Create Group Modal (Phase 2: multi-step) ─────────────────── */}
      {showCreateGroupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={resetCreateGroupModal}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step indicator */}
            <div className="flex items-center gap-0 border-b border-neutral-800 bg-neutral-900/50">
              {["Details", "Invite Members"].map((label, i) => (
                <button
                  key={label}
                  onClick={() => createStep > i + 1 && setCreateStep(i + 1)}
                  className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    createStep === i + 1
                      ? "text-white border-b-2 border-white bg-neutral-800/50"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {i + 1}. {label}
                </button>
              ))}
            </div>

            {/* ─ Step 1: Name & Description ─ */}
            {createStep === 1 && (
              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-300 rounded-2xl flex items-center justify-center text-neutral-900 text-2xl font-bold mb-4 shadow-xl shadow-neutral-500/20">
                    {groupName ? (
                      groupName[0].toUpperCase()
                    ) : (
                      <Lock size={28} />
                    )}
                  </div>
                  <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
                    Every message is end-to-end encrypted. Your server cannot read any content.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-neutral-400 uppercase mb-2 block tracking-wide">
                    Orbit Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && groupName.trim() && setCreateStep(2)
                    }
                    autoFocus
                    className="w-full p-3.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 focus:bg-neutral-800/80 outline-none text-sm transition-all text-white placeholder-neutral-600"
                    placeholder="e.g. CS Study Group"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold text-neutral-400 uppercase mb-2 block tracking-wide">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full p-3.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 focus:bg-neutral-800/80 outline-none text-sm transition-all text-white placeholder-neutral-600"
                    placeholder="What's this orbit about?"
                  />
                </div>
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={resetCreateGroupModal}
                    className="text-neutral-500 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setCreateStep(2)}
                    disabled={!groupName.trim()}
                    className="bg-white hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-900 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  >
                    Next: Add Members →
                  </button>
                </div>
              </div>
            )}

            {/* ─ Step 2: Invite Members ─ */}
            {createStep === 2 && (
              <div className="p-6">
                <h2 className="text-lg font-bold mb-2 text-white">{groupName}</h2>
                <p className="text-neutral-500 text-sm mb-5">
                  Add members now — their E2EE key will be distributed automatically.
                </p>

                {/* Search */}
                <div className="relative mb-4">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-3.5 text-neutral-600"
                  />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 focus:bg-neutral-800/80 outline-none text-sm transition-all text-white placeholder-neutral-600"
                    placeholder="Search by name or @handle…"
                  />
                  {isSearching && (
                    <Loader
                      size={14}
                      className="absolute right-3.5 top-3.5 animate-spin text-neutral-600"
                    />
                  )}
                </div>

                {/* Search results */}
                {memberResults.length > 0 && (
                  <div className="bg-neutral-800/50 rounded-xl border border-neutral-700 overflow-hidden mb-4 max-h-48 overflow-y-auto">
                    {memberResults.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => addInviteMember(user)}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-700/50 cursor-pointer transition-colors border-b border-neutral-800/50 last:border-b-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-neutral-700 flex items-center justify-center text-sm font-semibold text-neutral-300 flex-shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate text-white">
                            {user.name}
                          </div>
                          <div className="text-xs text-neutral-500 truncate">
                            @{user.handle || user.email}
                          </div>
                        </div>
                        <UserPlus
                          size={16}
                          className="ml-auto text-neutral-500 flex-shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Invited list */}
                {invitedMembers.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-neutral-500 uppercase mb-3 tracking-wide">
                      Invited ({invitedMembers.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {invitedMembers.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-full px-3 py-2 text-sm"
                        >
                          <Lock size={10} className="text-emerald-500" />
                          <span className="text-white font-medium">
                            {member.name}
                          </span>
                          <button
                            onClick={() => removeInviteMember(member._id)}
                            className="text-neutral-500 hover:text-red-400 ml-1 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-emerald-600/80 mt-3 flex items-center gap-1">
                      <Lock size={10} /> AES-256 key will be distributed to each member's device
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6 pt-5 border-t border-neutral-800">
                  <button
                    onClick={() => setCreateStep(1)}
                    className="text-neutral-500 hover:text-white text-sm font-medium transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                  >
                    {isCreatingGroup ? (
                      <>
                        <Loader size={14} className="animate-spin" /> Creating & distributing keys…
                      </>
                    ) : (
                      <>
                        <Lock size={14} /> Create Encrypted Orbit
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Channel Modal ─────────────────────────────────────── */}
      {showCreateChannelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCreateChannelModal(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 text-white w-full max-w-md rounded-2xl p-6 shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-5 text-white">Create Channel</h2>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-neutral-500 uppercase mb-3 tracking-wide">
                Channel Type
              </label>
              <div className="space-y-2">
                {[
                  {
                    type: "text",
                    icon: <Hash size={20} className="text-neutral-400" />,
                    label: "Text",
                    desc: "Send encrypted messages",
                  },
                ].map((opt) => (
                  <div
                    key={opt.type}
                    onClick={() => setChannelType(opt.type)}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      channelType === opt.type
                        ? "bg-neutral-800 border-neutral-500 shadow-lg"
                        : "bg-neutral-900 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    {opt.icon}
                    <div>
                      <div className="font-medium text-white">{opt.label}</div>
                      <div className="text-xs text-neutral-500">{opt.desc}</div>
                    </div>
                    {channelType === opt.type && (
                      <div className="ml-auto w-5 h-5 rounded-full border-2 border-white bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-neutral-900" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-neutral-500 uppercase mb-3 tracking-wide">
                Channel Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) =>
                    setChannelName(
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    )
                  }
                  className="w-full bg-neutral-800 border border-neutral-700 p-3.5 pl-10 rounded-xl outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 text-white placeholder-neutral-600 text-sm transition-all"
                  placeholder="new-channel"
                />
                <Hash
                  size={16}
                  className="absolute left-3.5 top-3.5 text-neutral-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateChannelModal(false)}
                className="px-5 py-2.5 hover:bg-neutral-800 text-neutral-400 text-sm font-medium transition-colors rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                className="bg-white hover:bg-neutral-200 text-neutral-900 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              >
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      {/* Poll Modal */}
      {showPollModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={resetPollModal}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 text-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <h2 className="text-base font-bold text-white">Create Poll</h2>
              <button
                className="text-neutral-500 hover:text-white transition-colors p-1"
                onClick={resetPollModal}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePoll} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2.5 tracking-wide">
                  Question
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full p-3.5 bg-neutral-800 border border-neutral-700 rounded-xl focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 outline-none text-sm transition-all text-white placeholder-neutral-600"
                  placeholder="e.g. When should we host the tech symposium?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2.5 tracking-wide">
                  Options
                </label>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          handlePollOptionChange(idx, e.target.value)
                        }
                        className="flex-1 p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg focus:border-neutral-500 focus:ring-2 focus:ring-neutral-700/50 outline-none text-sm transition-all text-white placeholder-neutral-600"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="text-neutral-600 hover:text-red-400 transition-colors p-2"
                          onClick={() => removePollOption(idx)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPollOption}
                  className="mt-3 text-xs text-neutral-500 hover:text-white transition-colors"
                >
                  + Add option
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2.5 text-neutral-400">
                  <input
                    type="checkbox"
                    checked={pollMultiple}
                    onChange={(e) => setPollMultiple(e.target.checked)}
                    className="accent-white rounded"
                  />
                  Allow multiple choices
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  className="text-neutral-500 hover:text-white text-sm transition-colors px-4 py-2"
                  onClick={resetPollModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreatingPoll ||
                    !pollQuestion.trim() ||
                    pollOptions.filter((o) => o.trim()).length < 2
                  }
                  className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 transition-all hover:scale-105"
                >
                  {isCreatingPoll ? "Creating…" : "Create Poll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Settings Modal ─────────────────────────────────────────────── */}
      {showSettingsModal && (isActiveOwner || isActiveAdmin) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-neutral-800">
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-800 bg-neutral-900/50 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Group Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-neutral-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-neutral-800 bg-neutral-900/30 flex-shrink-0 min-h-[48px]">
              {[
                { id: "overview", label: "Overview", icon: <Info size={14} /> },
                { id: "members", label: "Members", icon: <Users size={14} /> },
                { id: "moderation", label: "Moderation", icon: <Shield size={14} /> },
                { id: "settings", label: "Settings", icon: <Settings size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    activeSettingsTab === tab.id
                      ? "text-white border-b-2 border-white bg-neutral-800/50"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950">
              {activeSettingsTab === "overview" && <SettingsOverview />}
              {activeSettingsTab === "members" && <SettingsMembers />}
              {activeSettingsTab === "moderation" && <SettingsModeration />}
              {activeSettingsTab === "settings" && <SettingsGeneral />}
            </div>
          </div>
        </div>
      )}

      {/* Message Context Menu */}
      {messageContextMenu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setMessageContextMenu(null)}
          />
          <div
            className="fixed z-[70] bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl py-2 min-w-[180px] text-white overflow-hidden"
            style={{
              left: messageContextMenu.x,
              top: messageContextMenu.y,
            }}
          >
            <button
              onClick={() => handleReportMessage(messageContextMenu.messageId)}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-700 flex items-center gap-2.5 transition-colors"
            >
              <Flag size={16} />
              Report Message
            </button>
            {(isActiveOwner || isActiveAdmin) && (
              <button
                onClick={() => handleDeleteMessage(messageContextMenu.messageId)}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
              >
                <Trash2 size={16} />
                Delete Message
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Invite Modal ────────────────────────────────────────────────── */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 text-white w-full max-w-md rounded-2xl p-6 shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Invite to Group</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-neutral-400 mb-3">
                Invite Link
              </label>
              {inviteCode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/join/${inviteCode}`}
                    readOnly
                    className="flex-1 p-3.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
                    }}
                    className="px-4 py-3 bg-white hover:bg-neutral-200 text-neutral-900 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  disabled={isGeneratingInvite}
                  className="w-full px-5 py-3.5 bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                >
                  {isGeneratingInvite ? "Generating..." : "Generate Invite Link"}
                </button>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
