import { useState, useEffect, useRef } from "react";
import {
  Search, Plus, Settings, Send, Emoji, MoreHoriz,
  Lock, User as UserIcon, LogOut, UserPlus, Bell,
  MediaImage as ImageIcon, ArrowLeft, Hashtag,
} from "iconoir-react";

import { useNavigate } from "react-router-dom";
import GroupsModals from "./groups/GroupsModals";
import axios from "axios";

/* ─────────────────────────── Mock Data ─────────────────────────────────── */

const MOCK_GROUPS = [
  {
    id: 1, name: "Group 1", type: "group", icon: "G1",
    description: "A community for learning and sharing knowledge together.",
    members: 245, isMember: true,
    from: "#6366f1", to: "#8b5cf6",
    lastMsg: "Just launched the new project! 🚀", lastTime: "10:42 AM", unread: 3,
  },
  {
    id: 2, name: "Group 2", type: "group", icon: "G2",
    description: "Innovation and tech discussions for developers.",
    members: 189, isMember: true,
    from: "#ec4899", to: "#f43f5e",
    lastMsg: "Anyone free for a workshop this weekend?", lastTime: "9:15 AM", unread: 0,
  },
  {
    id: 3, name: "CLUB 1", type: "club", icon: "C1",
    description: "Sports and fitness enthusiasts community.",
    members: 342, isMember: false,
    from: "#f97316", to: "#eab308",
    lastMsg: "Great match yesterday! 🏆", lastTime: "Yesterday", unread: 0,
  },
  {
    id: 4, name: "Group 3", type: "group", icon: "G3",
    description: "Creative minds sharing art, design and photography.",
    members: 156, isMember: true,
    from: "#14b8a6", to: "#06b6d4",
    lastMsg: "Check out my latest design draft", lastTime: "Yesterday", unread: 1,
  },
  {
    id: 5, name: "Tech Hub", type: "club", icon: "TH",
    description: "Programming and development discussions.",
    members: 523, isMember: true,
    from: "#22c55e", to: "#10b981",
    lastMsg: "New React 19 features are insane 🔥", lastTime: "Mon", unread: 0,
  },
  {
    id: 6, name: "Photography", type: "club", icon: "PH",
    description: "Photography and visual content creators.",
    members: 267, isMember: false,
    from: "#3b82f6", to: "#6366f1",
    lastMsg: "Golden hour shoot was amazing ✨", lastTime: "Sun", unread: 0,
  },
];

const MOCK_MESSAGES = [
  { id: 1, author: "Arjun Mehta", initials: "AM", time: "10:30 AM", text: "Hey everyone! Just pushed the new feature to staging 🚀", mine: false },
  { id: 2, author: "Priya Sharma", initials: "PS", time: "10:33 AM", text: "Looks great! I'll test it right now.", mine: false },
  { id: 3, author: "You", initials: "ME", time: "10:35 AM", text: "Thanks! Let me know if you find any bugs.", mine: true },
  { id: 4, author: "Arjun Mehta", initials: "AM", time: "10:36 AM", text: "The UI looks really polished. Nice work 👌", mine: false },
  { id: 5, author: "You", initials: "ME", time: "10:40 AM", text: "Appreciate it! We can demo it in today's standup.", mine: true },
  { id: 6, author: "Priya Sharma", initials: "PS", time: "10:42 AM", text: "Just launched the new project! 🚀 Everyone check it out.", mine: false },
];

const MOCK_MEMBERS = [
  { id: 1, name: "Arjun Mehta",  initials: "AM", role: "admin",  online: true  },
  { id: 2, name: "Priya Sharma", initials: "PS", role: "member", online: true  },
  { id: 3, name: "Karan Singh",  initials: "KS", role: "member", online: false },
  { id: 4, name: "Sneha Patel",  initials: "SN", role: "member", online: true  },
  { id: 5, name: "Rahul Verma",  initials: "RV", role: "member", online: false },
];

/* ─────────────────────────── Sub-components ─────────────────────────────── */

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

/* ─────────────────────────── Main Page ─────────────────────────────────── */

const GroupsPage = ({ isSidebarOpen, currentUser }) => {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup]     = useState(MOCK_GROUPS[0]);
  const [activeTab, setActiveTab]         = useState("chat");
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterType, setFilterType]       = useState("all");
  const [newMessage, setNewMessage]       = useState("");
  const [messages, setMessages]           = useState(MOCK_MESSAGES);
  const [showRight, setShowRight]         = useState(false);  // mobile toggle
  const messagesEndRef = useRef(null);

  // Group Creation State
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
  
  // Real data state
  const [groups, setGroups] = useState(MOCK_GROUPS); // will update to fetch from API

  const API_URL = "http://localhost:5000/api";

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
    setIsCreatingGroup(true);
    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        name: groupName,
        description: groupDescription,
        type: groupType,
        joinPolicy: joinPolicy,
        channels: [
          { name: "general", type: "TEXT", position: 0, messagePermissions: messagePermission }
        ]
      };

      const res = await axios.post(`${API_URL}/groups`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newGroup = res.data.data;

      // Handle inviting members and optionally making them admins
      if (invitedMembers.length > 0) {
        for (const member of invitedMembers) {
          const memberId = member.id || member._id;
          // add member
          await axios.post(`${API_URL}/groups/${newGroup._id}/members`, { userId: memberId }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (assignAsAdmin) {
            await axios.post(`${API_URL}/groups/${newGroup._id}/admins`, { userId: memberId }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
      }
      
      // Update local UI (mock integration for now until full fetch is implemented)
      setGroups(prev => [
        {
          id: newGroup._id,
          name: newGroup.name,
          type: newGroup.type.toLowerCase(),
          icon: newGroup.name.substring(0, 2).toUpperCase(),
          description: newGroup.description,
          members: newGroup.stats?.memberCount || 1,
          isMember: true,
          from: "#6366f1",
          to: "#8b5cf6",
          lastMsg: "Group created!",
          lastTime: "Just now",
          unread: 0,
        },
        ...prev
      ]);
      
      resetCreateGroupModal();
    } catch (error) {
      console.error("Error creating group:", error);
      alert(error.response?.data?.message || "Failed to create group");
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
          <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
            You must be logged in to view and participate in Groups & Clubs.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const filtered = groups.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType =
      filterType === "all" ||
      (filterType === "groups" && g.type === "group") ||
      (filterType === "clubs"  && g.type === "club");
    return matchSearch && matchType;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab, activeGroup]);

  const selectGroup = (g) => {
    setActiveGroup(g);
    setActiveTab("chat");
    setShowRight(true);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: "You",
        initials: "ME",
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: newMessage.trim(),
        mine: true,
      },
    ]);
    setNewMessage("");
  };

  return (
    <div
      className="flex h-screen overflow-hidden text-white"
      style={{ background: "#0a0a0a", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* ═══════════════════ LEFT PANEL ═══════════════════ */}
      <aside
        className={`flex flex-col shrink-0 border-r border-white/[0.04] transition-all duration-300
          ${showRight ? "hidden md:flex" : "flex"}
          w-full md:w-[320px] lg:w-[360px]`}
        style={{ background: "#111111" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0">
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">Orbit</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">Groups & Clubs</p>
          </div>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.07]
              flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
            title="New group"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5
                text-sm text-white placeholder-zinc-600 outline-none
                focus:bg-white/[0.07] focus:border-white/[0.15] transition-all"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3 shrink-0">
          {[["all","All"], ["groups","Groups"], ["clubs","Clubs"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterType(val)}
              className={`px-3.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
                filterType === val
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-zinc-500 border-white/[0.08] hover:text-white hover:border-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-700">
              <Search size={26} />
              <p className="text-xs font-bold uppercase tracking-widest">No results</p>
            </div>
          ) : (
            filtered.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                active={activeGroup?.id === g.id}
                onClick={() => selectGroup(g)}
              />
            ))
          )}
        </div>

        {/* Profile footer */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.04] shrink-0"
          style={{ background: "#0a0a0a" }}
        >
          <GradientAvatar
            initials={(currentUser?.name?.[0] || "U").toUpperCase()}
            from="#6366f1" to="#8b5cf6"
            size="sm"
            online={true}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.name || "Profile"}</p>
            <p className="text-[10px] text-zinc-500">Active now</p>
          </div>
          <button className="p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-white/[0.05] transition-all">
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* ═══════════════════ RIGHT PANEL ═══════════════════ */}
      <main
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300
          ${showRight ? "flex" : "hidden md:flex"}`}
        style={{ background: "#0a0a0a" }}
      >
        {activeGroup ? (
          <>
            {/* ── Header ── */}
            <header
              className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] shrink-0 z-10"
              style={{ background: "rgba(17,17,17,0.85)", backdropFilter: "blur(16px)" }}
            >
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-1.5 -ml-1.5 text-zinc-500 hover:text-white transition-colors"
                  onClick={() => setShowRight(false)}
                >
                  <ArrowLeft size={20} />
                </button>
                <GradientAvatar initials={activeGroup.icon} from={activeGroup.from} to={activeGroup.to} size="sm" />
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white leading-tight truncate">{activeGroup.name}</h2>
                  <p className="text-[11px] text-zinc-500 truncate max-w-[240px]">{activeGroup.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[Bell, UserPlus, Settings, MoreHoriz].map((Icon, i) => (
                  <button key={i} className="p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-white/[0.05] transition-all">
                    <Icon size={17} />
                  </button>
                ))}
              </div>
            </header>

            {/* ── Tabs ── */}
            <div
              className="flex items-center gap-1 px-5 py-2 border-b border-white/[0.04] shrink-0"
              style={{ background: "rgba(17,17,17,0.6)" }}
            >
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
              {!activeGroup.isMember && (
                <button
                  className="ml-auto px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest
                    bg-white text-black hover:bg-zinc-100 transition-all active:scale-95 shadow-lg"
                >
                  + Join
                </button>
              )}
            </div>

            {/* ── Tab Content ── */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

              {/* CHAT */}
              {activeTab === "chat" && (
                <div className="px-5 py-5 space-y-0.5">
                  {messages.map((msg, i) => {
                    const prev    = messages[i - 1];
                    const grouped = prev && prev.author === msg.author;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${msg.mine ? "flex-row-reverse" : ""} ${grouped ? "mt-0.5" : "mt-4"}`}
                        style={{ animation: "fadeUp 0.2s ease-out" }}
                      >
                        {!msg.mine && (
                          grouped
                            ? <div className="w-9 shrink-0" />
                            : (
                              <div
                                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ background: `linear-gradient(135deg, ${activeGroup.from}, ${activeGroup.to})` }}
                              >
                                {msg.initials}
                              </div>
                            )
                        )}
                        <div className={`max-w-[65%] flex flex-col ${msg.mine ? "items-end" : "items-start"}`}>
                          {!grouped && !msg.mine && (
                            <span className="text-[10px] font-semibold text-zinc-500 mb-1 ml-1">{msg.author}</span>
                          )}
                          <div
                            className={`px-4 py-2.5 text-sm leading-relaxed transition-all ${
                              msg.mine
                                ? "bg-white text-black rounded-2xl rounded-br-sm shadow-lg"
                                : "bg-white/[0.06] text-zinc-200 rounded-2xl rounded-bl-sm border border-white/[0.04]"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-zinc-700 mt-1 mx-1">{msg.time}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* ABOUT */}
              {activeTab === "about" && (
                <div className="px-6 py-6 space-y-5" style={{ animation: "fadeUp 0.25s ease-out" }}>
                  {/* Banner */}
                  <div
                    className="h-28 rounded-2xl relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${activeGroup.from}30, ${activeGroup.to}18)`, border: `1px solid ${activeGroup.from}28` }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-1/2"
                      style={{ background: `linear-gradient(to top, #0a0a0a, transparent)` }} />
                  </div>

                  <div className="flex items-start justify-between gap-4 -mt-2">
                    <div className="flex items-center gap-4">
                      <GradientAvatar initials={activeGroup.icon} from={activeGroup.from} to={activeGroup.to} size="lg" />
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">{activeGroup.name}</h2>
                        <span
                          className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                          style={{ background: `${activeGroup.from}22`, color: activeGroup.from, border: `1px solid ${activeGroup.from}44` }}
                        >
                          {activeGroup.type}
                        </span>
                      </div>
                    </div>
                    {activeGroup.isMember ? (
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-zinc-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all shrink-0">
                        <LogOut size={14} /> Leave
                      </button>
                    ) : (
                      <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-100 transition-all active:scale-95 shadow-lg shrink-0">
                        <Plus size={14} /> Join
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed">{activeGroup.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Members",  value: activeGroup.members.toLocaleString() },
                      { label: "Type",     value: activeGroup.type.charAt(0).toUpperCase() + activeGroup.type.slice(1) },
                      { label: "Status",   value: activeGroup.isMember ? "Joined ✓" : "Open" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-center">
                        <p className="text-base font-bold text-white">{value}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* About card */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">About</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {activeGroup.description} Join to connect with like-minded individuals,
                      participate in discussions, share resources, and collaborate on exciting projects.
                    </p>
                  </div>
                </div>
              )}

              {/* MEMBERS */}
              {activeTab === "members" && (
                <div className="px-5 py-4 space-y-0.5" style={{ animation: "fadeUp 0.25s ease-out" }}>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-3 py-2">
                    {MOCK_MEMBERS.length} Members
                  </p>
                  {MOCK_MEMBERS.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all
                        cursor-pointer border border-transparent hover:border-white/[0.04] group"
                    >
                      <GradientAvatar initials={m.initials} from={activeGroup.from} to={activeGroup.to} size="sm" online={m.online} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                        <p className="text-[10px] text-zinc-600 capitalize">{m.role} · {m.online ? "Online" : "Offline"}</p>
                      </div>
                      {m.role === "admin" && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5
                          rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.06]">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Message Input ── */}
            {activeTab === "chat" && (
              <div
                className="px-4 pb-4 pt-3 border-t border-white/[0.04] shrink-0"
                style={{ background: "rgba(17,17,17,0.85)", backdropFilter: "blur(16px)" }}
              >
                {!activeGroup.isMember ? (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <Lock size={14} className="text-zinc-700" />
                    <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">
                      Join this group to send messages
                    </span>
                  </div>
                ) : (
                  <form onSubmit={sendMessage} className="flex items-center gap-2.5">
                    <div
                      className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2.5 border transition-all
                        bg-white/[0.04] border-white/[0.07] focus-within:bg-white/[0.07] focus-within:border-white/[0.16]"
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${activeGroup.name}…`}
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder-zinc-600"
                      />
                      <button type="button" className="p-1 text-zinc-600 hover:text-white transition-colors">
                        <ImageIcon size={18} />
                      </button>
                      <button type="button" className="p-1 text-zinc-600 hover:text-white transition-colors">
                        <Emoji size={18} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="w-11 h-11 rounded-xl bg-white text-black flex items-center justify-center
                        hover:bg-zinc-100 disabled:opacity-20 disabled:grayscale transition-all
                        active:scale-90 shadow-lg shadow-white/10 shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ── */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
              <Hashtag size={32} className="text-zinc-800" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Select a community</h3>
              <p className="text-xs text-zinc-600 mt-1 uppercase tracking-widest font-bold">
                Choose a group or club to start chatting
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Keyframes via style tag */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
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
      />
    </div>
  );
};

export default GroupsPage;
