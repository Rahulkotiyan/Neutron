import { Hash, Menu } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";

const GroupsPage = ({ toggleSidebar }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/groups")
      .then((res) => {
        setGroups(res.data);
        if (res.data.length > 0) setActiveGroup(res.data[0]);
      })
      .catch(console.error);
  }, []);

  return (
    // FIX: lg:ml-72 and w-full
    <div className="flex h-full bg-[#0f172a] w-full lg:ml-72 relative">
      <button
        onClick={toggleSidebar}
        className="hover:text-white transition-colors absolute top-4 left-4 p-2 bg-zinc-900 rounded-xl text-zinc-400 z-50"
      >
        <Menu size={20} />
      </button>

      {/* 1. Server Rail */}
      <div className="w-[72px] bg-black border-r border-white/5 flex flex-col items-center py-16 space-y-4 lg:py-4">
        {groups.map((g) => (
          <div
            key={g._id}
            onClick={() => setActiveGroup(g)}
            className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              activeGroup?._id === g._id
                ? "bg-blue-600 text-white rounded-xl"
                : "bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white hover:rounded-xl"
            }`}
          >
            <Hash size={20} />
          </div>
        ))}
      </div>
      {/* 2. Channels */}
      <div className="w-60 bg-[#111827] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="h-14 border-b border-white/5 flex items-center px-4 font-bold text-white">
          {activeGroup?.name}
        </div>
        <div className="p-2 space-y-1">
          {activeGroup?.channels.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded cursor-pointer"
            >
              <Hash size={16} /> <span className="text-sm">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      {/* 3. Chat */}
      <div className="flex-1 bg-[#1e293b] flex flex-col">
        <div className="h-14 border-b border-white/5 flex items-center px-12 md:px-6 text-white font-bold">
          # general
        </div>
        <div className="flex-1 p-6 text-zinc-500 flex items-center justify-center">
          Select a channel to start chatting
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Message #general"
            className="w-full bg-[#2a3649] text-white p-3 rounded-xl outline-none"
          />
        </div>
      </div>
    </div>
  );
};
export default GroupsPage;