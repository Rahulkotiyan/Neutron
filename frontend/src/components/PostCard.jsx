import React from "react";
import {
  MoreHorizontal,
  MessageSquare,
  Share2,
  Bookmark,
  ArrowBigUp,
  Heart,
} from "lucide-react";

const PostCard = ({ post }) => {
  const getTagStyle = (tag) => {
    const t = tag ? tag.toUpperCase() : "GENERAL";
    if (t === "ANNOUNCEMENT")
      return "bg-zinc-800 text-white border border-zinc-700 shadow-[0_0_10px_rgba(255,255,255,0.05)]";
    if (t === "MEME") return "bg-zinc-900 text-zinc-400 border border-zinc-800";
    if (t === "QUESTION")
      return "bg-white/10 text-white border border-white/10";
    return "bg-zinc-900 text-zinc-500";
  };
  return (
    <div className="group bg-black rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 border border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-5 pb-0">
        <div className="flex justify-between items-start mb-4">
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md ${getTagStyle(
              post.tag
            )}`}
          >
            {post.tag}
          </span>
          <button className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
            <MoreHorizontal size={20} />
          </button>
        </div>
        <h3 className="font-bold text-zinc-100 leading-snug mb-2 text-lg group-hover:text-white transition-colors cursor-pointer">
          {post.title}
        </h3>
        <p className="text-sm text-zinc-400 mb-4 line-clamp-3 leading-relaxed">
          {post.desc}
        </p>
      </div>
      {post.image && (
        <div className="px-5">
          <div className="relative rounded-xl overflow-hidden h-56 w-full border border-white/10 group-hover:border-white/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-40 z-10"></div>
            <img
              src={post.image}
              alt="post"
              className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
            />
          </div>
        </div>
      )}
      <div className="p-5 mt-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <img
              src={post.author.avatar || "https://i.pravatar.cc/150?u=def"}
              alt="user"
              className="w-9 h-9 rounded-full ring-2 ring-black"
            />
            <div className="absolute inset-0 rounded-full shadow-inner shadow-black/50"></div>
          </div>
          <div>
            <span className="block text-sm text-zinc-200 font-semibold hover:underline cursor-pointer group-hover:text-white">
              {post.author.name}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
              {post.author.handle || "Student"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button className="flex items-center gap-2 text-zinc-300 font-bold text-sm bg-white/5 px-3 py-1.5 rounded-lg transition-all hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 border border-transparent hover:border-white/5">
            <ArrowBigUp size={22} className="drop-shadow-sm" />
            <span>{post.stats}</span>
          </button>
          <div className="flex gap-1 text-zinc-500">
            <PostActionButton
              icon={<MessageSquare size={18} />}
              label="24"
              hoverColor="hover:text-white hover:bg-white/10"
            />
            <PostActionButton
              icon={<Share2 size={18} />}
              hoverColor="hover:text-white hover:bg-white/10"
            />
            <PostActionButton
              icon={<Bookmark size={18} />}
              hoverColor="hover:text-white hover:bg-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
const PostActionButton = ({ icon, label, hoverColor }) => (
  <button
    className={`flex items-center gap-1.5 p-2 rounded-lg transition-all duration-200 ${hoverColor}`}
  >
    {icon}
    {label && <span className="text-xs font-medium">{label}</span>}
  </button>
);
export default PostCard;
