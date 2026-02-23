import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Send,
  Search,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Clock,
  MessageCircle,
} from "lucide-react";
import { toast } from "react-toastify";

const ChatsPage = ({ currentUser, token, isSidebarOpen }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = "http://localhost:5000/api";

  // Fetch conversations
  useEffect(() => {
    if (currentUser && token) {
      fetchConversations();
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        if (selectedConversation) {
          fetchMessages(selectedConversation);
        } else {
          fetchConversations();
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, token]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load conversations");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_URL}/messages/conversation/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation._id);
    fetchMessages(conversation._id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const response = await axios.post(
        `${API_URL}/messages/send`,
        {
          conversationId: selectedConversation,
          text: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setMessages([...messages, response.data.message]);
      setNewMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await axios.delete(`${API_URL}/messages/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(conversations.filter((c) => c._id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-black text-zinc-300">
      {/* Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-white/10 flex flex-col transition-all duration-300 ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
              <Clock size={40} className="text-zinc-600" />
              <p className="text-zinc-500 text-center">
                {searchQuery
                  ? "No conversations found"
                  : "No conversations yet. Start a new chat!"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${
                  selectedConversation === conversation._id
                    ? "bg-white/10 border-l-2 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {conversation.participantName}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-zinc-600">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  setMessages([]);
                }}
                className="md:hidden text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {
                    conversations.find((c) => c._id === selectedConversation)
                      ?.participantName
                  }
                </h2>
              </div>
            </div>
            <button
              onClick={() => {
                handleDeleteConversation(selectedConversation);
              }}
              className="text-zinc-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => {
              const isCurrentUser = msg.senderId === currentUser?._id;
              return (
                <div
                  key={idx}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg break-words ${
                      isCurrentUser
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser ? "text-blue-100" : "text-zinc-500"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10 bg-zinc-900/50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-zinc-900/50">
          <div className="text-center">
            <MessageCircle size={64} className="text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">
              Select a conversation to start chatting
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
