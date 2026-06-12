import React, { useState, useEffect } from "react";
import { Search, X } from "iconoir-react";

// For demo purposes, we'll use a few "Trending" mock GIFs if API fails or is not provided
const MOCK_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxxyHpxGHTO/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlMGW4m5s9199sU/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHONQ79FdWCUAIU/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjP8r99p109C8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l41lTfG7E6iXzE1K0/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJxcXJwaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif"
];

const GIFPicker = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState(MOCK_GIFS);
  const [loading, setLoading] = useState(false);

  // In a real app, you'd fetch from Tenor/Giphy here
  useEffect(() => {
    if (!search.trim()) {
      setGifs(MOCK_GIFS);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      // Simulate API search
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="absolute bottom-12 left-0 z-[250] w-[320px] sm:w-[380px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 flex flex-col h-[400px]">
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Search GIFs</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-3">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#1d9bf0] transition-colors">
            <Search size={16} />
          </div>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Tenor"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-10 py-2.5 text-sm text-white placeholder-zinc-700 focus:ring-1 focus:ring-[#1d9bf0]/50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((url, index) => (
              <div 
                key={index}
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
                className="aspect-square rounded-xl overflow-hidden bg-white/5 cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 border border-white/5 hover:border-white/20"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GIFPicker;
