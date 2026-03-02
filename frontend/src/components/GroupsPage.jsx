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
    if (!aesKey)
      return rawMessages.map((m) => ({
        ...m,
        _plaintext: m.content || "[No key]",
      }));

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

  // ── Create channel ─────────────────────────────────────────────────────────
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

  // ── E2EE badge ────────────────────────────────────────────────────────────
  const E2EEBadge = () => (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        e2eeStatus === "ready"
          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
          : e2eeStatus === "loading"
            ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
            : e2eeStatus === "error"
              ? "bg-red-900/40 text-red-400 border border-red-800/50"
              : "bg-zinc-800/50 text-zinc-500"
      }`}
    >
      <Lock size={9} />
      {e2eeStatus === "ready"
        ? "E2E Encrypted"
        : e2eeStatus === "loading"
          ? "Decrypting…"
          : e2eeStatus === "error"
            ? "Key Error"
            : "Encrypted"}
    </div>
  );

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
        <h3 className="text-lg font-semibold text-white mb-4">Group Overview</h3>
        <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center">
              {activeGroup?.icon ? (
                <img src={activeGroup.icon} className="w-full h-full rounded-full object-cover" alt="icon" />
              ) : (
                <span className="text-lg font-bold text-white">
                  {activeGroup?.name?.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">{activeGroup?.name}</h4>
              <p className="text-zinc-400 text-sm">{activeGroup?.description || "No description"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-700">
            <div>
              <div className="text-zinc-400 text-sm">Members</div>
              <div className="text-white font-semibold">{membersList.length}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Channels</div>
              <div className="text-white font-semibold">{activeGroup?.channels?.length || 0}</div>
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
        // Refresh group data
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
            <h3 className="text-lg font-semibold text-white mb-4">Pending Join Requests</h3>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div key={request._id} className="bg-neutral-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">User ID: {request.userId}</div>
                    {request.message && (
                      <div className="text-zinc-400 text-sm mt-1">{request.message}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(request._id, request.userId)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
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
          <h3 className="text-lg font-semibold text-white mb-4">Members</h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-zinc-400"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredMembers.map(member => {
              const userObj = member.userId && typeof member.userId === "object" ? member.userId : member;
              const memberUserId = userObj._id || member.userId;
              const isSelf = currentUserId && memberUserId?.toString() === currentUserId.toString();
              const isAdmin = (activeGroup?.admins || []).some(a => (a._id || a).toString() === memberUserId?.toString());
              const isOwner = (activeGroup?.owner?._id || activeGroup?.owner).toString() === memberUserId?.toString();

              return (
                <div key={memberUserId} className="bg-neutral-800 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                      {userObj.avatar ? (
                        <img src={userObj.avatar} className="w-full h-full rounded-full object-cover" alt="avatar" />
                      ) : (
                        <UserIcon size={16} />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {userObj.name || "Member"}
                        {isOwner && <Crown size={14} className="text-yellow-500" />}
                        {isAdmin && !isOwner && <Shield size={14} className="text-blue-500" />}
                        {isSelf && <span className="text-xs text-zinc-400">(You)</span>}
                      </div>
                    </div>
                  </div>
                  {(isActiveOwner || isActiveAdmin) && !isSelf && (
                    <div className="flex gap-2">
                      {!isAdmin && !isOwner && (
                        <button
                          onClick={() => handleMakeAdmin(memberUserId)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                        >
                          Make Admin
                        </button>
                      )}
                      {isAdmin && !isOwner && (
                        <button
                          onClick={() => handleRemoveAdmin(memberUserId)}
                          className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs"
                        >
                          Remove Admin
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveMember(memberUserId)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
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
        // Refresh messages
        fetchMessages(activeChannel._id);
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    };

    const handleResolveReport = async (reportId) => {
      try {
        // This would need backend support for reports
        console.log("Resolving report:", reportId);
      } catch (err) {
        console.error("Failed to resolve report:", err);
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Message Moderation</h3>
          <div className="bg-neutral-800 rounded-lg p-4">
            <p className="text-zinc-400 text-sm mb-4">
              Right-click on any message in the chat to access moderation options.
            </p>
            <div className="space-y-2">
              <div className="text-white text-sm">
                <strong>Available Actions:</strong>
              </div>
              <ul className="text-zinc-400 text-sm space-y-1 ml-4">
                <li>• Delete messages</li>
                <li>• View message reports</li>
                <li>• Ban users (if implemented)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reported Messages Section */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Reported Messages</h3>
          <div className="bg-neutral-800 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">
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
    // This would need backend support for message restrictions
    console.log("Updating message restrictions:", messageRestriction);
  };

  const handleDeleteChannel = async (channelId, channelName) => {
    if (!confirm(`Are you sure you want to delete the channel "${channelName}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/groups/${activeGroup._id}/channels/${channelId}`);
      const { data } = await api.get(`/groups/${activeGroup._id}`);
      setActiveGroup(data);
      setGroups(prev => prev.map(g => g._id === data._id ? data : g));
      
      // If the deleted channel was active, switch to another channel
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

    // Calculate position to ensure menu stays on screen
    let x = e.clientX;
    let y = e.clientY;

    // If menu would go off the right edge, position it to the left
    if (x + 160 > window.innerWidth) {
      x = window.innerWidth - 170;
    }

    // If menu would go off the bottom edge, position it above
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
          <h3 className="text-lg font-semibold text-white">Group Information</h3>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm"
            >
              Edit
            </button>
          )}
        </div>
        
        {editMode ? (
          <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Group Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedName(activeGroup?.name || "");
                  setEditedDescription(activeGroup?.description || "");
                }}
                className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <div className="text-zinc-400 text-sm">Name</div>
                <div className="text-white">{activeGroup?.name}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-sm">Description</div>
                <div className="text-white">{activeGroup?.description || "No description"}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-sm">Created</div>
                <div className="text-white">
                  {activeGroup?.createdAt ? new Date(activeGroup.createdAt).toLocaleDateString() : "Unknown"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Management */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Channel Management</h3>
        <div className="bg-neutral-800 rounded-lg p-4">
          <div className="space-y-3">
            <div className="text-white text-sm font-medium mb-3">Channels ({activeGroup?.channels?.length || 0})</div>
            {activeGroup?.channels?.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeGroup.channels.map(channel => (
                  <div key={channel._id} className="p-3 bg-neutral-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {channel.type === "text" ? (
                          <Hash size={16} className="text-zinc-400" />
                        ) : (
                          <Volume2 size={16} className="text-zinc-400" />
                        )}
                        <div>
                          <div className="text-white font-medium">{channel.name}</div>
                          <div className="text-zinc-400 text-xs capitalize">{channel.type} Channel</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {channel.name !== "general" && (
                          <button
                            onClick={() => handleDeleteChannel(channel._id, channel.name)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Channel Permissions */}
                    <div className="border-t border-neutral-600 pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-zinc-300 text-sm font-medium">Message Permissions</div>
                          <div className="text-zinc-400 text-xs">
                            Who can send messages in this channel?
                          </div>
                        </div>
                        <select
                          value={channel.messagePermissions || "everyone"}
                          onChange={(e) => handleUpdateChannelPermissions(channel._id, e.target.value)}
                          className="px-3 py-1 bg-neutral-600 border border-neutral-500 rounded text-white text-sm"
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
              <div className="text-zinc-400 text-sm">No channels found</div>
            )}
            <div className="text-zinc-400 text-xs mt-3">
              Note: The "general" channel cannot be deleted.
            </div>
          </div>
        </div>
      </div>

      {/* Message Restrictions */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Message Restrictions</h3>
        <div className="bg-neutral-800 rounded-lg p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Who can send messages?
              </label>
              <select
                value={messageRestriction}
                onChange={(e) => setMessageRestriction(e.target.value)}
                className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
              >
                <option value="everyone">Everyone</option>
                <option value="admin">Admins only</option>
              </select>
            </div>
            <button
              onClick={handleUpdateRestrictions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Update Restrictions
            </button>
            <p className="text-zinc-400 text-xs">
              Note: Message restriction system not yet implemented in backend.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isActiveOwner && (
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-red-300 font-medium">Delete Group</h4>
                <p className="text-red-400 text-sm mt-1">
                  Permanently delete this group and all its data. This action cannot be undone.
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
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
      className={`flex h-[calc(100vh-64px)] overflow-hidden bg-neutral-950 text-gray-100 font-sans`}
    >
      {/* Mobile Backdrop */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 top-16 bg-black/80 z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* ── 1. Orbit Rail ─────────────────────────────────────────────── */}
      <div
        className={`w-[72px] bg-neutral-950 flex-col items-center py-3 space-y-2 overflow-y-auto scrollbar-hide flex-shrink-0 z-50 transition-transform duration-300 md:translate-x-0 md:relative md:flex md:h-full ${showMobileSidebar ? "fixed top-16 bottom-0 left-0 flex h-[calc(100vh-64px)]" : "hidden md:flex"}`}
      >
        <div
          onClick={() => setShowMobileSidebar(false)}
          className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mb-2 hover:bg-neutral-800 hover:rounded-xl transition-all cursor-pointer shadow-lg shadow-black/40"
        >
          <MessageCircle size={28} className="text-zinc-100" />
        </div>

        <div className="w-8 h-[2px] bg-zinc-800 rounded-full mx-auto mb-2" />

        {groups.map((group) => (
          <div
            key={group._id}
            className="relative group w-full flex justify-center"
          >
            {activeGroup?._id === group._id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
            )}
            <div
              onClick={() => setActiveGroup(group)}
              className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:rounded-xl overflow-hidden ${
                activeGroup?._id === group._id
                  ? "bg-neutral-800 border border-zinc-400 rounded-xl"
                  : "bg-neutral-900 hover:bg-neutral-800"
              }`}
            >
              {group.icon ? (
                <img
                  src={group.icon}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-semibold text-sm">
                  {group.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity hidden md:block">
              {group.name}
            </div>
          </div>
        ))}

        <div
          onClick={() => setShowCreateGroupModal(true)}
          className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 hover:rounded-xl transition-all cursor-pointer text-zinc-200"
        >
          <Plus size={24} />
        </div>
      </div>

      {/* ── 2. Channel Sidebar ────────────────────────────────────────── */}
      <div
        className={`w-60 bg-neutral-950 flex-col flex-shrink-0 border-r border-neutral-900 z-40 transition-transform duration-300 md:translate-x-0 md:relative md:flex md:h-full ${showMobileSidebar ? "fixed top-16 bottom-0 left-[72px] flex h-[calc(100vh-64px)]" : "hidden md:flex"}`}
      >
        <div className="h-12 px-4 shadow-sm flex items-center justify-between hover:bg-neutral-900/80 transition-colors border-b border-neutral-900">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-sm truncate">
              {activeGroup?.name || "Select an Orbit"}
            </h1>
            {activeGroup && !isActiveMember && (
              <button
                onClick={handleJoinGroup}
                className="ml-2 px-2 py-0.5 text-[11px] rounded-full bg-neutral-800 text-zinc-100 hover:bg-neutral-700"
              >
                Join
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeGroup && (isActiveOwner || isActiveAdmin) && (
              <>
                <button
                  onClick={() => setShowCreateChannelModal(true)}
                  className="px-2 py-0.5 text-[11px] rounded-full border border-neutral-700 text-zinc-200 hover:bg-neutral-800 hidden md:inline-flex items-center gap-1"
                >
                  Channel
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(true);
                    setInviteCode("");
                  }}
                  className="px-2 py-0.5 text-[11px] rounded-full border border-neutral-700 text-zinc-200 hover:bg-neutral-800 hidden md:inline-flex"
                >
                  Invite
                </button>
              </>
            )}
            <div
              className="md:hidden p-1 hover:bg-neutral-800 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileSidebar(false);
              }}
            >
              <X size={20} className="text-zinc-400" />
            </div>
          </div>
        </div>

        {activeGroup ? (
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {/* Text Channels */}
            <div className="mb-4">
              <div
                className="flex items-center justify-between px-1 mb-1 text-xs font-bold text-zinc-400 hover:text-zinc-300 uppercase cursor-pointer"
                onClick={() =>
                  setShowChannelCategories((p) => ({ ...p, text: !p.text }))
                }
              >
                <div className="flex items-center gap-0.5">
                  {showChannelCategories.text ? (
                    <ChevronDown size={10} />
                  ) : (
                    <ChevronRight size={10} />
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
                      className={`group flex items-center justify-between px-2 py-1.5 rounded mb-0.5 cursor-pointer transition-colors ${activeChannel?._id === channel._id ? "bg-zinc-700/50 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Hash
                          size={18}
                          className="text-zinc-500 flex-shrink-0"
                        />
                        <span className="truncate font-medium">
                          {channel.name}
                        </span>
                      </div>
                      <Lock size={11} className="text-zinc-600 flex-shrink-0" />
                    </div>
                  ))}
            </div>

            {/* Voice Channels - COMMENTED OUT */}
            {/*
            <div className="mb-4">
              <div
                className="flex items-center justify-between px-1 mb-1 text-xs font-bold text-zinc-400 hover:text-zinc-300 uppercase cursor-pointer"
                onClick={() =>
                  setShowChannelCategories((p) => ({ ...p, voice: !p.voice }))
                }
              >
                <div className="flex items-center gap-0.5">
                  {showChannelCategories.voice ? (
                    <ChevronDown size={10} />
                  ) : (
                    <ChevronRight size={10} />
                  )}
                  <span>Voice Channels</span>
                </div>
                </div>
              {showChannelCategories.voice &&
                activeGroup.channels
                  ?.filter((c) => (c.type === "voice" || c.type === "VOICE"))
                  .map((channel) => (
                    <div
                      key={channel._id}
                      onClick={() => {
                        setActiveChannel(channel);
                        setShowMobileSidebar(false);
                      }}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded mb-0.5 cursor-pointer transition-colors ${activeChannel?._id === channel._id ? "bg-zinc-700/50 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Volume2
                          size={18}
                          className="text-zinc-500 flex-shrink-0"
                        />
                        <span className="truncate font-medium">
                          {channel.name}
                        </span>
                      </div>
                    </div>
                  ))}
            </div>
            */}
          </div>
        ) : (
          <div className="p-4 text-center text-zinc-500 text-sm mt-10">
            Select an orbit to see channels
          </div>
        )}

        {/* User Status Footer */}
        <div className="h-[52px] bg-neutral-950 px-2 flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center relative">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                className="rounded-full w-full h-full object-cover"
                alt="avatar"
              />
            ) : (
              <UserIcon size={16} />
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">
              {currentUser?.name || "Guest"}
            </div>
            <div className="text-[10px] text-zinc-400 truncate">Online</div>
          </div>
          <div className="flex items-center">
            
            <div className="p-1 hover:bg-zinc-800 rounded cursor-pointer">
              <Settings size={16} onClick={() => setShowSettingsModal(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Chat Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-900 w-full">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="h-12 px-4 border-b border-neutral-800 shadow-sm bg-neutral-950 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="md:hidden mr-1 text-zinc-400 cursor-pointer"
                  onClick={() => setShowMobileSidebar(true)}
                >
                  <Menu size={24} />
                </div>
                {activeChannel.type === "voice" ||
                activeChannel.type === "VOICE" ? (
                  <Volume2 size={20} className="text-zinc-400" />
                ) : (
                  <Hash size={20} className="text-zinc-400" />
                )}
                <h3 className="font-bold text-white truncate">
                  {activeChannel.name}
                </h3>
                {activeChannel.description && (
                  <div className="hidden md:flex items-center">
                    <div className="h-4 w-[1px] bg-zinc-700 mx-2" />
                    <span className="text-xs text-zinc-400 truncate max-w-sm">
                      {activeChannel.description}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <E2EEBadge />
                {/* COMMENTED OUT - Voice and Video Call Options
                <Phone
                  size={20}
                  className="hover:text-zinc-200 cursor-pointer hidden sm:block"
                />
                <Video
                  size={20}
                  className="hover:text-zinc-200 cursor-pointer hidden sm:block"
                />
                */}
                <Users
                  size={20}
                  className={`hover:text-zinc-200 cursor-pointer ${showMembersModal ? "text-white" : ""}`}
                  onClick={() => setShowMembersModal(!showMembersModal)}
                />
              </div>
            </div>

            {/* Messages / Notes & Files Tabs */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1 border-b border-neutral-800 bg-neutral-950">
              <div className="flex gap-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveChatTab("chat")}
                  className={`px-3 py-1 rounded-full ${
                    activeChatTab === "chat"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveChatTab("files")}
                  className={`px-3 py-1 rounded-full flex items-center gap-1 ${
                    activeChatTab === "files"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Paperclip size={12} />
                  Notes & Files
                  {filesAndNotes.length > 0 && (
                    <span className="ml-1 text-[10px] bg-zinc-700 rounded-full px-1.5">
                      {filesAndNotes.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-28 md:pb-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader size={32} className="animate-spin text-zinc-500" />
                </div>
              ) : activeChatTab === "chat" && messages.length === 0 ? (
                <div className="mt-10 px-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Lock size={32} className="text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Welcome to #{activeChannel.name}!
                  </h2>
                  <p className="text-zinc-400">
                    This channel is end-to-end encrypted. Only members can read
                    messages.
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
                      className={`group flex pl-4 pr-4 py-0.5 hover:bg-zinc-900/30 -mx-4 ${!isSequence ? "mt-4" : ""}`}
                      onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}
                    >
                      {!isSequence ? (
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mr-3 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity">
                          {msg.user?.avatar ? (
                            <img
                              src={msg.user.avatar}
                              className="w-full h-full object-cover"
                              alt="avatar"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-indigo-500">
                              {msg.user?.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 mr-3 flex-shrink-0 text-xs text-zinc-500 opacity-0 group-hover:opacity-100 text-right select-none self-center hidden sm:block">
                          {formatTime(msg.timestamp)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {!isSequence && (
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-2" onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}>
                              <span className="font-medium text-white hover:underline cursor-pointer">
                                {msg.user?.name}
                              </span>
                              <span className="text-[10px] text-zinc-500 ml-1">
                                {formatDate(msg.timestamp)} at{" "}
                                {formatTime(msg.timestamp)}
                              </span>
                              {msg.type === "ENCRYPTED" && (
                                <Lock
                                  size={9}
                                  className="text-emerald-500 ml-1"
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

                                // Ensure menu stays within viewport
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
                              className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Message options"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        )}
                        {msg.type === "POLL" && msg.poll ? (
                          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 space-y-2" onContextMenu={(e) => handleMessageContextMenu(e, msg._id)}>
                            <div className="text-sm font-semibold text-zinc-100">
                              {msg.poll.question}
                            </div>
                            <div className="space-y-1.5">
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
                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs border ${
                                      hasVoted
                                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {opt.label}
                                    </span>
                                    <span className="ml-2 text-[10px] text-zinc-300">
                                      {totalVotes} vote
                                      {totalVotes === 1 ? "" : "s"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            {msg.poll.closesAt && (
                              <div className="text-[10px] text-zinc-500">
                                Closes at{" "}
                                {new Date(msg.poll.closesAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p
                            className={`text-zinc-300 whitespace-pre-wrap break-words leading-relaxed ${
                              msg.type === "SYSTEM"
                                ? "italic text-zinc-500"
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
                  <div className="mt-10 px-4 text-sm text-zinc-400">
                    No notes or files yet. Shared documents, links, and images
                    will show up here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filesAndNotes.map((msg) => (
                      <div
                        key={msg._id}
                        className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span className="font-medium text-zinc-200">
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
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-100 border border-zinc-700"
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
                                  className="text-xs text-sky-400 hover:underline break-all"
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
                <div className="flex items-center gap-2 px-4 text-xs text-zinc-400 italic">
                  <Loader size={12} className="animate-spin" />
                  {typingUsers.map((u) => u.name).join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing…
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-3 bg-zinc-900 pt-2 flex-shrink-0 fixed inset-x-0 bottom-16 md:static md:bottom-auto md:left-auto md:right-auto z-40">
              <form onSubmit={handleSendMessage}>
                <div className="bg-zinc-800 rounded-lg p-2.5 flex items-center gap-3">
                  <div className="p-1 rounded-full bg-zinc-700 hover:bg-zinc-600 cursor-pointer text-zinc-400 transition-colors hidden sm:block">
                    <Plus size={16} />
                  </div>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder={
                      e2eeStatus === "ready"
                        ? `Message #${activeChannel.name} (encrypted)`
                        : e2eeStatus === "loading"
                          ? "Loading keys…"
                          : `Message #${activeChannel.name}`
                    }
                    disabled={e2eeStatus === "loading" || isSending}
                    className="flex-1 bg-transparent outline-none text-zinc-200 placeholder-zinc-500 disabled:opacity-50"
                  />
                  <div className="flex items-center gap-3 text-zinc-400 px-2">
                    <Gift
                      size={20}
                      className="hover:text-yellow-400 cursor-pointer transition-colors hidden sm:block"
                    />
                    <Smile
                      size={20}
                      className="hover:text-yellow-400 cursor-pointer transition-colors hidden sm:block"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPollModal(true)}
                      className="text-xs px-2 py-1 rounded-md border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hidden sm:block"
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
                      className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending ? (
                        <Loader size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <div
              className="md:hidden absolute top-4 left-4 cursor-pointer"
              onClick={() => setShowMobileSidebar(true)}
            >
              <Menu size={24} className="text-zinc-400" />
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
              <Lock size={36} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-zinc-400">
              Select a Channel
            </h3>
            <p className="text-sm mt-1">
              All messages are end-to-end encrypted.
            </p>
          </div>
        )}
      </div>

      {/* ── 4. Members Sidebar ───────────────────────────────────────── */}
      {showMembersModal && activeChannel && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-40 lg:hidden"
            onClick={() => setShowMembersModal(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-60 bg-zinc-900 border-l border-zinc-950/50 flex flex-col lg:relative lg:flex shadow-xl lg:shadow-none">
            <div
              className="lg:hidden absolute top-3 right-3 text-zinc-400 cursor-pointer"
              onClick={() => setShowMembersModal(false)}
            >
              <X size={20} />
            </div>
            <div className="h-12 border-b border-zinc-950/50 flex items-center justify-between px-4 font-bold text-[11px] text-zinc-400 uppercase tracking-wide">
              <span>Members — {membersList.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-950 scrollbar-track-transparent">
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
                    className="flex items-center gap-3 px-2 py-1.5 hover:bg-zinc-800 rounded cursor-pointer opacity-90 hover:opacity-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center relative flex-shrink-0">
                      {userObj.avatar ? (
                        <img
                          src={userObj.avatar}
                          className="w-full h-full rounded-full object-cover"
                          alt="avatar"
                        />
                      ) : (
                        <UserIcon size={14} />
                      )}
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-zinc-900" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-zinc-300 truncate">
                        {userObj.name || "Member"}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                        {hasKey ? (
                          <>
                            <Lock size={8} className="text-emerald-500" /> Key
                            distributed
                          </>
                        ) : (
                          <>
                            <Lock size={8} className="text-zinc-500" /> No key
                            yet
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
                        className="ml-1 px-2 py-0.5 text-[9px] rounded-full border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10"
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
            className="bg-zinc-900 border border-zinc-700 text-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step indicator */}
            <div className="flex items-center gap-0 border-b border-zinc-800">
              {["Details", "Invite Members"].map((label, i) => (
                <button
                  key={label}
                  onClick={() => createStep > i + 1 && setCreateStep(i + 1)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                    createStep === i + 1
                      ? "text-indigo-400 border-b-2 border-indigo-500"
                      : "text-zinc-500"
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
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-3">
                    {groupName ? (
                      groupName[0].toUpperCase()
                    ) : (
                      <Lock size={28} />
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs text-center max-w-xs">
                    Every message is end-to-end encrypted. Your server cannot
                    read any content.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5 block">
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
                    className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. CS Study Group"
                  />
                </div>
                <div className="mb-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-1.5 block">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="What's this orbit about?"
                  />
                </div>
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={resetCreateGroupModal}
                    className="text-zinc-500 hover:text-zinc-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setCreateStep(2)}
                    disabled={!groupName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    Next: Add Members →
                  </button>
                </div>
              </div>
            )}

            {/* ─ Step 2: Invite Members ─ */}
            {createStep === 2 && (
              <div className="p-6">
                <h2 className="text-base font-bold mb-1">{groupName}</h2>
                <p className="text-zinc-400 text-xs mb-4">
                  Add members now — their E2EE key will be distributed
                  automatically.
                </p>

                {/* Search */}
                <div className="relative mb-3">
                  <Search
                    size={14}
                    className="absolute left-3 top-3 text-zinc-500"
                  />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Search by name or @handle…"
                  />
                  {isSearching && (
                    <Loader
                      size={12}
                      className="absolute right-3 top-3.5 animate-spin text-zinc-400"
                    />
                  )}
                </div>

                {/* Search results */}
                {memberResults.length > 0 && (
                  <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden mb-3 max-h-40 overflow-y-auto">
                    {memberResults.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => addInviteMember(user)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            @{user.handle || user.email}
                          </div>
                        </div>
                        <UserPlus
                          size={14}
                          className="ml-auto text-indigo-400 flex-shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Invited list */}
                {invitedMembers.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-zinc-400 uppercase mb-2">
                      Invited ({invitedMembers.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {invitedMembers.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center gap-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-3 py-1 text-sm"
                        >
                          <Lock size={9} className="text-emerald-400" />
                          <span className="text-indigo-300 font-medium">
                            {member.name}
                          </span>
                          <button
                            onClick={() => removeInviteMember(member._id)}
                            className="text-zinc-400 hover:text-red-400 ml-1 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-emerald-500/70 mt-2 flex items-center gap-1">
                      <Lock size={8} /> AES-256 key will be distributed to each
                      member's device
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setCreateStep(1)}
                    className="text-zinc-500 hover:text-zinc-300 text-sm font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    {isCreatingGroup ? (
                      <>
                        <Loader size={14} className="animate-spin" /> Creating &
                        distributing keys…
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
            className="bg-black text-white w-full max-w-md rounded p-6 shadow-2xl border border-white/20 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-white">Create Channel</h2>
            <div className="mb-4">
              <label className="block text-xs font-bold text-white/80 uppercase mb-2">
                Channel Type
              </label>
              <div className="space-y-2">
                {[
                  {
                    type: "text",
                    icon: <Hash size={24} className="text-white/70" />,
                    label: "Text",
                    desc: "Send encrypted messages",
                  },
                  /* COMMENTED OUT - Voice Channel Option
                  {
                    type: "voice",
                    icon: <Volume2 size={24} className="text-white/70" />,
                    label: "Voice",
                    desc: "Hang out with voice & video",
                  },
                  */
                ].map((opt) => (
                  <div
                    key={opt.type}
                    onClick={() => setChannelType(opt.type)}
                    className={`flex items-center gap-3 p-3 rounded border transition-colors ${
                      channelType === opt.type
                        ? "bg-white/10 border-white/30"
                        : "bg-black border-white/10 hover:bg-white/5"
                    }`}
                  >
                    {opt.icon}
                    <div>
                      <div className="font-medium text-white">{opt.label}</div>
                      <div className="text-xs text-white/60">{opt.desc}</div>
                    </div>
                    {channelType === opt.type && (
                      <div className="ml-auto w-4 h-4 rounded-full border-2 border-white bg-black" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-white/80 uppercase mb-2">
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
                  className="w-full bg-black border border-white/20 p-2 pl-7 rounded outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 text-white placeholder-white/40 text-sm"
                  placeholder="new-channel"
                />
                <Hash
                  size={14}
                  className="absolute left-2 top-3 text-white/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateChannelModal(false)}
                className="px-4 py-2 hover:bg-white/10 text-white/80 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                className="bg-white text-black hover:bg-white/90 px-4 py-2 rounded text-sm font-medium transition-colors"
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
            className="bg-zinc-900 border border-zinc-700 text-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold">Create Poll</h2>
              <button
                className="text-zinc-400 hover:text-zinc-200"
                onClick={resetPollModal}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePoll} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="e.g. When should we host the tech symposium?"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  Options
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          handlePollOptionChange(idx, e.target.value)
                        }
                        className="flex-1 p-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="text-zinc-500 hover:text-red-400"
                          onClick={() => removePollOption(idx)}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPollOption}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  + Add option
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={pollMultiple}
                    onChange={(e) => setPollMultiple(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  Allow multiple choices
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="text-zinc-400 hover:text-zinc-200 text-xs"
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
                  className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-neutral-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-white">Group Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-neutral-800 bg-neutral-950 flex-shrink-0 min-h-[44px] sm:min-h-[48px]">
              {[
                { id: "overview", label: "Overview", icon: <Info size={14} /> },
                { id: "members", label: "Members", icon: <Users size={14} /> },
                { id: "moderation", label: "Moderation", icon: <Shield size={14} /> },
                { id: "settings", label: "Settings", icon: <Settings size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeSettingsTab === tab.id
                      ? "text-white border-b-2 border-white bg-neutral-800"
                      : "text-zinc-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
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
            className="fixed z-[70] bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-2 min-w-[160px] text-white"
            style={{
              left: messageContextMenu.x,
              top: messageContextMenu.y,
            }}
          >
            <button
              onClick={() => handleReportMessage(messageContextMenu.messageId)}
              className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-neutral-700 flex items-center gap-2"
            >
              <Flag size={16} />
              Report Message
            </button>
            {(isActiveOwner || isActiveAdmin) && (
              <button
                onClick={() => handleDeleteMessage(messageContextMenu.messageId)}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-black text-white w-full max-w-md rounded-lg p-6 shadow-2xl border border-gray-700 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Invite to Group</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invite Link
              </label>
              {inviteCode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/join/${inviteCode}`}
                    readOnly
                    className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded text-sm text-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
                      // Optionally show a toast or notification
                    }}
                    className="px-3 py-2 bg-white hover:bg-gray-100 text-black rounded text-sm transition-colors"
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  disabled={isGeneratingInvite}
                  className="w-full px-4 py-2 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded text-sm transition-colors"
                >
                  {isGeneratingInvite ? "Generating..." : "Generate Invite Link"}
                </button>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-sm transition-colors"
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
