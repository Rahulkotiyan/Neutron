import React from "react";
import {
  MoreHorizontal,
  MessageSquare,
  Share2,
  Bookmark,
  ArrowBigUp,
} from "lucide-react";

const PostCard=({post})=>{
    return(
        <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition duration-200 border border-slate-100 flex flex-col justify-between h-full">
      {/* Post Header */}
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${post.tagColor}`}>
            {post.tag}
          </span>
          <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
        </div>

        {post.image && (
          <div className="mb-3 rounded-xl overflow-hidden h-48 w-full bg-slate-100">
             <img src={post.image} alt="post" className="w-full h-full object-cover" />
          </div>
        )}

        <h3 className="font-bold text-slate-800 leading-snug mb-2 text-lg">{post.title}</h3>
        <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">{post.desc}</p>
      </div>

      {/* Post Footer */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <img src={post.author.avatar} alt="user" className="w-6 h-6 rounded-full" />
          <span className="text-xs text-slate-500 font-medium">{post.author.name}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1 text-orange-500 font-bold text-sm bg-orange-50 px-2 py-1 rounded-lg cursor-pointer hover:bg-orange-100">
            <ArrowBigUp size={20} fill="currentColor" />
            <span>{post.stats}</span>
          </div>
          <div className="flex gap-4 text-slate-400">
            <MessageSquare size={18} className="hover:text-neutron-primary cursor-pointer"/>
            <Share2 size={18} className="hover:text-neutron-primary cursor-pointer"/>
            <Bookmark size={18} className="hover:text-neutron-primary cursor-pointer"/>
          </div>
        </div>
      </div>
    </div>
    );
};

export default PostCard;