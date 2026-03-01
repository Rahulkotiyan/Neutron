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
  Smile,
  Paperclip,
  Image as ImageIcon
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import CustomModal from "./CustomModal";

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
  const [showMembersModal, setShowMembersModal] = useState(window.innerWidth >= 1024);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showChannelCategories, setShowChannelCategories] = useState({ text: true, voice: true });
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState("text");
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { socket } = useSocket();

  const college = currentUser?.college || "AIT Bangalore";

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth >= 1024) {
            // Optional: Auto-open on desktop if we want that behavior
        } else {
            setShowMembersModal(false);
            setShowMobileSidebar(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (activeChannel && message.channel === activeChannel._id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    const handleGroupUpdated = ({ groupId }) => {
      fetchGroups();
    };

    const handleChannelCreated = (channel) => {
      if (activeGroup && channel.groupId === activeGroup._id) {
        setActiveGroup((prev) => ({
          ...prev,
          channels: [...(prev.channels || []), channel],
        }));
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("group_updated", handleGroupUpdated);
    socket.on("channel_created", handleChannelCreated);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("group_updated", handleGroupUpdated);
      socket.off("channel_created", handleChannelCreated);
    };
  }, [socket, activeChannel, activeGroup]);

  // Join/Leave rooms
  useEffect(() => {
    if (!socket) return;

    if (activeGroup) socket.emit("join_group", activeGroup._id);
    if (activeChannel) socket.emit("join_channel", activeChannel._id);

    return () => {
      if (activeGroup) socket.emit("leave_group", activeGroup._id);
      if (activeChannel) socket.emit("leave_channel", activeChannel._id);
    };
  }, [socket, activeGroup, activeChannel]);

  useEffect(() => {
    fetchGroups();
  }, []);

  // Set default channel
  useEffect(() => {
    if (activeGroup && activeGroup.channels?.length > 0) {
      if (!activeChannel || !activeGroup.channels.find(c => c._id === activeChannel._id)) {
        const defaultChannel = activeGroup.channels.find(c => c.name === "general") || activeGroup.channels[0];
        setActiveChannel(defaultChannel);
      }
    }
  }, [activeGroup]);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel._id);
      // On mobile, if we select a channel (implied by this effect running after selection), we might want to ensure sidebar is closed.
      // But this effect runs on initial load too.
    }
  }, [activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get(`/groups/college/${college}`);
      setGroups(res.data);
      if (res.data.length > 0 && !activeGroup) {
        setActiveGroup(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/groups/channel/${channelId}/messages?limit=50`);
      setMessages(res.data || []);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    try {
      await api.post(`/groups/channel/${activeChannel._id}/messages`, {
        content: newMessage,
        channelId: activeChannel._id
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      await api.post("/groups", {
        name: groupName,
        description: groupDescription,
        college,
        channels: [
          { name: "general", type: "text" },
          { name: "voice-chat", type: "voice" }
        ]
      });
      setShowCreateGroupModal(false);
      setGroupName("");
      setGroupDescription("");
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err);
      setModalConfig({
        isOpen: true,
        title: "Creation Failed",
        message: "Failed to create orbit",
        type: "error",
      });
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelName.trim() || !activeGroup) return;

    try {
      const res = await api.post(`/groups/${activeGroup._id}/channels`, {
        name: channelName,
        type: channelType
      });
      
      setActiveGroup(prev => ({
        ...prev,
        channels: [...(prev.channels || []), res.data]
      }));
      
      setShowCreateChannelModal(false);
      setChannelName("");
    } catch (err) {
      console.error("Error creating channel:", err);
      setModalConfig({
        isOpen: true,
        title: "Creation Failed",
        message: "Failed to create channel",
        type: "error",
      });
    }
  };

  // Helper to format time
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex h-[calc(100vh-64px)] overflow-hidden bg-zinc-900 text-gray-100 font-sans ${isSidebarOpen ? '' : ''}`}>
      
      {/* Mobile Backdrop */}
      {showMobileSidebar && (
        <div 
            className="fixed inset-0 top-16 bg-black/80 z-40 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* 1. Orbit Rail (Leftmost) */}
      <div className={`w-[72px] bg-zinc-950 flex-col items-center py-3 space-y-2 overflow-y-auto scrollbar-hide flex-shrink-0 z-50 transition-transform duration-300 md:translate-x-0 md:relative md:flex md:h-full ${showMobileSidebar ? 'fixed top-16 bottom-0 left-0 flex h-[calc(100vh-64px)]' : 'hidden md:flex'}`}>
        <div 
            onClick={() => setShowMobileSidebar(false)}
            className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-2 hover:rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
        >
            <MessageCircle size={28} className="text-white" />
        </div>
        
        <div className="w-8 h-[2px] bg-zinc-800 rounded-full mx-auto mb-2" />
        
        {groups.map((group) => (
          <div key={group._id} className="relative group w-full flex justify-center">
             {activeGroup?._id === group._id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
             )}
            <div 
              onClick={() => setActiveGroup(group)}
              className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:rounded-xl overflow-hidden ${activeGroup?._id === group._id ? 'bg-indigo-600 rounded-xl' : 'bg-zinc-800 hover:bg-indigo-600'}`}
            >
              {group.icon ? (
                <img src={group.icon} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold text-sm">{group.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity hidden md:block">
                {group.name}
            </div>
          </div>
        ))}

        <div 
          onClick={() => setShowCreateGroupModal(true)}
          className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-green-600 hover:rounded-xl transition-all cursor-pointer text-green-500 hover:text-white"
        >
          <Plus size={24} />
        </div>
      </div>

      {/* 2. Channel Sidebar */}
      <div className={`w-60 bg-zinc-900 flex-col flex-shrink-0 border-r border-zinc-950/50 z-40 transition-transform duration-300 md:translate-x-0 md:relative md:flex md:h-full ${showMobileSidebar ? 'fixed top-16 bottom-0 left-[72px] flex h-[calc(100vh-64px)]' : 'hidden md:flex'}`}>
        {/* Orbit Header */}
        <div className="h-12 px-4 shadow-sm flex items-center justify-between hover:bg-zinc-800/50 transition-colors cursor-pointer border-b border-zinc-950/50">
           <h1 className="font-bold text-sm truncate">{activeGroup?.name || "Select an Orbit"}</h1>
           <div className="flex items-center gap-2">
               {activeGroup && <ChevronDown size={16} />}
               {/* Mobile Close Button */}
               <div className="md:hidden p-1 hover:bg-zinc-700/50 rounded" onClick={(e) => { e.stopPropagation(); setShowMobileSidebar(false); }}>
                   <X size={20} className="text-zinc-400" />
               </div>
           </div>
        </div>

        {activeGroup ? (
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-950 scrollbar-track-transparent">
                {/* Text Channels */}
                <div className="mb-4">
                    <div 
                       className="flex items-center justify-between px-1 mb-1 text-xs font-bold text-zinc-400 hover:text-zinc-300 uppercase cursor-pointer"
                       onClick={() => setShowChannelCategories(p => ({...p, text: !p.text}))}
                    >
                        <div className="flex items-center gap-0.5">
                            {showChannelCategories.text ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                            <span>Text Channels</span>
                        </div>
                        <Plus 
                            size={14} 
                            className="cursor-pointer hover:text-white" 
                            onClick={(e) => { e.stopPropagation(); setChannelType("text"); setShowCreateChannelModal(true); }}
                        />
                    </div>
                    {showChannelCategories.text && activeGroup.channels?.filter(c => c.type === 'text').map(channel => (
                        <div 
                            key={channel._id}
                            onClick={() => {
                                setActiveChannel(channel);
                                setShowMobileSidebar(false);
                            }}
                            className={`group flex items-center justify-between px-2 py-1.5 rounded mb-0.5 cursor-pointer transition-colors ${activeChannel?._id === channel._id ? 'bg-zinc-700/50 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <Hash size={18} className="text-zinc-500 flex-shrink-0" />
                                <span className="truncate font-medium">{channel.name}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Voice Channels */}
                <div className="mb-4">
                     <div 
                       className="flex items-center justify-between px-1 mb-1 text-xs font-bold text-zinc-400 hover:text-zinc-300 uppercase cursor-pointer"
                       onClick={() => setShowChannelCategories(p => ({...p, voice: !p.voice}))}
                    >
                        <div className="flex items-center gap-0.5">
                            {showChannelCategories.voice ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                            <span>Voice Channels</span>
                        </div>
                          <Plus 
                            size={14} 
                            className="cursor-pointer hover:text-white" 
                            onClick={(e) => { e.stopPropagation(); setChannelType("voice"); setShowCreateChannelModal(true); }}
                        />
                    </div>
                    {showChannelCategories.voice && activeGroup.channels?.filter(c => c.type === 'voice').map(channel => (
                        <div 
                            key={channel._id}
                            onClick={() => {
                                setActiveChannel(channel);
                                setShowMobileSidebar(false);
                            }}
                            className={`group flex items-center justify-between px-2 py-1.5 rounded mb-0.5 cursor-pointer transition-colors ${activeChannel?._id === channel._id ? 'bg-zinc-700/50 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                        >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <Volume2 size={18} className="text-zinc-500 flex-shrink-0" />
                                <span className="truncate font-medium">{channel.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="p-4 text-center text-zinc-500 text-sm mt-10">
                Wumpus is waiting... select an orbit!
            </div>
        )}
        
        {/* User Status Footer */}
        <div className="h-[52px] bg-zinc-950/80 px-2 flex items-center gap-2 flex-shrink-0">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center relative">
                 {currentUser?.avatar ? <img src={currentUser.avatar} className="rounded-full w-full h-full object-cover" /> : <UserIcon size={16} />}
                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"></div>
             </div>
             <div className="flex-1 min-w-0">
                 <div className="text-xs font-bold truncate">{currentUser?.name || "Guest"}</div>
                 <div className="text-[10px] text-zinc-400 truncate">Online</div>
             </div>
             <div className="flex items-center">
                 <div className="p-1 hover:bg-zinc-800 rounded cursor-pointer"><Mic size={16} /></div>
                 <div className="p-1 hover:bg-zinc-800 rounded cursor-pointer"><Settings size={16} /></div>
             </div>
        </div>
      </div>

      {/* 3. Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-700 w-full">
        {activeChannel ? (
            <>
                {/* Header */}
                <div className="h-12 px-4 border-b border-zinc-900/10 shadow-sm bg-zinc-900 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="md:hidden mr-1 text-zinc-400" onClick={() => setShowMobileSidebar(true)}>
                            <Menu size={24} />
                        </div>
                         {activeChannel.type === 'voice' ? <Volume2 size={20} className="text-zinc-400" /> : <Hash size={20} className="text-zinc-400" />}
                         <h3 className="font-bold text-white truncate">{activeChannel.name}</h3>
                         {activeChannel.description && (
                             <div className="hidden md:flex items-center">
                                <div className="h-4 w-[1px] bg-zinc-700 mx-2" />
                                <span className="text-xs text-zinc-400 truncate max-w-sm">{activeChannel.description}</span>
                             </div>
                         )}
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                         <Phone size={20} className="hover:text-zinc-200 cursor-pointer hidden sm:block" />
                         <Video size={20} className="hover:text-zinc-200 cursor-pointer hidden sm:block" />
                         <Users 
                             size={20} 
                             className={`hover:text-zinc-200 cursor-pointer ${showMembersModal ? 'text-white' : ''}`} 
                             onClick={() => setShowMembersModal(!showMembersModal)}
                        />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
                     {messages.length === 0 ? (
                         <div className="mt-10 px-4">
                             <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                {activeChannel.type === 'voice' ? <Volume2 size={40} /> : <Hash size={40} />}
                             </div>
                             <h2 className="text-3xl font-bold text-white mb-2">Welcome to #{activeChannel.name}!</h2>
                             <p className="text-zinc-400">This is the start of the #{activeChannel.name} channel.</p>
                         </div>
                     ) : (
                         messages.map((msg, i) => {
                             const prevMsg = messages[i-1];
                             const isSequence = prevMsg && prevMsg.user?._id === msg.user?._id && (new Date(msg.timestamp) - new Date(prevMsg.timestamp) < 300000); // 5 mins
                             
                             return (
                                 <div 
                                    key={msg._id || i} 
                                    className={`group flex pl-4 pr-4 py-0.5 hover:bg-zinc-900/30 -mx-4 ${!isSequence ? 'mt-4' : ''}`}
                                 >
                                     {!isSequence ? (
                                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mr-3 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity">
                                             {msg.user?.avatar ? <img src={msg.user.avatar} className="w-full h-full object-cover" /> : (
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
                                             <div className="flex items-center gap-2 mb-0.5">
                                                 <span className="font-medium text-white hover:underline cursor-pointer">
                                                     {msg.user?.name}
                                                 </span>
                                                 <span className="text-[10px] text-zinc-500 ml-1">
                                                     {formatDate(msg.timestamp)} at {formatTime(msg.timestamp)}
                                                 </span>
                                             </div>
                                         )}
                                         <p className={`text-zinc-300 whitespace-pre-wrap break-words ${msg.type === 'SYSTEM' ? 'italic text-zinc-500' : ''}`}>
                                             {msg.content}
                                         </p>
                                         {msg.attachments?.length > 0 && (
                                            <div className="mt-2 text-blue-400 text-sm">
                                                Attachment: {msg.attachments[0].filename}
                                            </div>
                                         )}
                                     </div>
                                 </div>
                             );
                         })
                     )}
                     <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="px-4 pb-4 bg-zinc-900 flex-shrink-0 pt-2">
                     <div className="bg-zinc-800 rounded-lg p-2.5 flex items-center gap-3">
                         <div className="p-1 rounded-full bg-zinc-700 hover:bg-zinc-600 cursor-pointer text-zinc-400 transition-colors hidden sm:block">
                             <Plus size={16} />
                         </div>
                         <form onSubmit={handleSendMessage} className="flex-1">
                             <input
                                 type="text"
                                 value={newMessage}
                                 onChange={(e) => setNewMessage(e.target.value)}
                                 placeholder={`Message #${activeChannel.name}`}
                                 className="w-full bg-transparent outline-none text-zinc-200 placeholder-zinc-500"
                             />
                         </form>
                         <div className="flex items-center gap-3 text-zinc-400 px-2">
                             <Gift size={20} className="hover:text-yellow-400 cursor-pointer transition-colors hidden sm:block" />
                             <ImageIcon size={20} className="hover:text-zinc-200 cursor-pointer transition-colors" />
                             <Smile size={20} className="hover:text-yellow-400 cursor-pointer transition-colors hidden sm:block" />
                         </div>
                     </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                {/* Mobile Empty State Menu Trigger */}
                <div className="md:hidden absolute top-4 left-4" onClick={() => setShowMobileSidebar(true)}>
                    <Menu size={24} className="text-zinc-400" />
                </div>
                
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                     <Hash size={40} />
                </div>
                <h3 className="text-lg font-bold text-zinc-400">No Channel Selected</h3>
                <p className="text-sm">Pick a channel from the sidebar to start chatting!</p>
            </div>
        )}
      </div>

      {/* 4. Members Sidebar (Right) */}
      {showMembersModal && activeChannel && (
          <div className="fixed inset-y-0 right-0 z-50 w-60 bg-zinc-900 border-l border-zinc-950/50 flex flex-col lg:relative lg:flex shadow-xl lg:shadow-none">
               {/* Mobile close button for members */}
               <div className="lg:hidden absolute top-3 right-3 text-zinc-400" onClick={() => setShowMembersModal(false)}>
                   <X size={20} />
               </div>

              <div className="h-12 border-b border-zinc-950/50 flex items-center px-4 font-bold text-xs text-zinc-400 uppercase tracking-wide">
                  Members
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-zinc-950 scrollbar-track-transparent">
                  {['Owner', 'Admin', 'Moderator', 'Member'].map(role => {
                      const roleMembers = activeGroup?.members?.filter(m => {
                          const userRole = activeGroup.roles?.find(r => r.name === role);
                          return true; 
                      }) || [];

                      if (roleMembers.length === 0) return null;
                      const displayMembers = role === 'Member' ? activeGroup.members : [];
                      if (displayMembers?.length === 0) return null;

                      return (
                          <div key={role}>
                              <div className="text-xs font-bold text-zinc-500 uppercase mb-2 px-2">
                                  {role} — {displayMembers.length}
                              </div>
                              <div className="space-y-1">
                                  {displayMembers.map(member => (
                                      <div key={member._id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-zinc-800 rounded cursor-pointer opacity-90 hover:opacity-100 group">
                                           <div className={`w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center relative`}>
                                                {member.avatar ? <img src={member.avatar} className="w-full h-full rounded-full object-cover" /> : <UserIcon size={14} />}
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                                           </div>
                                           <div>
                                               <div className="font-medium text-sm text-zinc-300 group-hover:text-white" style={{ color: role === 'Owner' ? '#f472b6' : role === 'Admin' ? '#8b5cf6' : '' }}>
                                                   {member.name}
                                               </div>
                                               <div className="text-[10px] text-zinc-500">
                                                   Playing VS Code
                                               </div>
                                           </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}
      
      {/* Mobile Members Backdrop */}
      {showMembersModal && activeChannel && (
        <div 
             className="fixed inset-0 bg-black/80 z-40 lg:hidden"
             onClick={() => setShowMembersModal(false)}
        />
      )}

      {/* Modals (Simplified for brevity, but functional) */}
      {showCreateGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateGroupModal(false)}>
              <div className="bg-white text-black w-full max-w-md rounded-lg overflow-hidden shadow-2xl scale-100 transform transition-all mx-4" onClick={e => e.stopPropagation()}>
                    <div className="p-6 text-center">
                        <h2 className="text-2xl font-bold mb-2">Customize Your Orbit</h2>
                        <p className="text-zinc-500 text-sm mb-6">Give your new orbit a personality with a name and an icon. You can always change it later.</p>
                        
                        <div className="w-24 h-24 bg-indigo-500 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                            {groupName ? groupName[0].toUpperCase() : <Plus size={32} />}
                        </div>

                        <div className="text-left mb-4">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Orbit Name</label>
                            <input 
                                type="text" 
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                className="w-full p-2 bg-zinc-200 rounded border-0 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="My Awesome Orbit" 
                            />
                        </div>
                    </div>
                    <div className="bg-zinc-100 p-4 flex justify-between items-center">
                         <button onClick={() => setShowCreateGroupModal(false)} className="text-zinc-500 hover:underline font-medium px-4">Back</button>
                         <button onClick={handleCreateGroup} className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-2.5 rounded shadow-lg transition-transform active:scale-95 font-medium">Create</button>
                    </div>
              </div>
          </div>
      )}

      {showCreateChannelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateChannelModal(false)}>
              <div className="bg-zinc-800 text-white w-full max-w-md rounded p-6 shadow-2xl border border-zinc-700 mx-4" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Create Channel</h2>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Channel Type</label>
                        <div className="space-y-2">
                             <div 
                                onClick={() => setChannelType("text")}
                                className={`flex items-center gap-3 p-3 rounded cursor-pointer ${channelType === 'text' ? 'bg-zinc-700' : 'bg-transparent hover:bg-zinc-700/50'} border border-transparent ${channelType === 'text' ? 'border-zinc-600' : ''}`}
                            >
                                 <Hash size={24} className="text-zinc-400" />
                                 <div>
                                     <div className="font-medium">Text</div>
                                     <div className="text-xs text-zinc-500">Send messages, images, GIFS, emoji...</div>
                                 </div>
                                 {channelType === 'text' && <div className="ml-auto w-4 h-4 rounded-full border-4 border-white bg-indigo-500" />}
                             </div>
                             <div 
                                onClick={() => setChannelType("voice")}
                                className={`flex items-center gap-3 p-3 rounded cursor-pointer ${channelType === 'voice' ? 'bg-zinc-700' : 'bg-transparent hover:bg-zinc-700/50'} border border-transparent ${channelType === 'voice' ? 'border-zinc-600' : ''}`}
                            >
                                 <Volume2 size={24} className="text-zinc-400" />
                                 <div>
                                     <div className="font-medium">Voice</div>
                                     <div className="text-xs text-zinc-500">Hang out together with voice, video, and screen share</div>
                                 </div>
                                 {channelType === 'voice' && <div className="ml-auto w-4 h-4 rounded-full border-4 border-white bg-indigo-500" />}
                             </div>
                        </div>
                    </div>

                    <div className="mb-6">
                         <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Channel Name</label>
                         <div className="relative">
                             <input 
                                type="text" 
                                value={channelName}
                                onChange={e => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="w-full bg-zinc-900 border-none p-2 pl-7 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="new-channel" 
                            />
                            <Hash size={14} className="absolute left-2 top-3 text-zinc-500" />
                         </div>
                    </div>

                    <div className="flex justify-end gap-3">
                         <button onClick={() => setShowCreateChannelModal(false)} className="px-4 py-2 hover:underline text-sm font-medium">Cancel</button>
                         <button onClick={handleCreateChannel} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-sm font-medium transition-colors">Create Channel</button>
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
    </div>
  );
};

export default GroupsPage;
