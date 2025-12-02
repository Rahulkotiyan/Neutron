import { ArrowBigUp, ImageIcon, LinkIcon, Menu, MessageSquare, MoreHorizontal, Share2, UserIcon } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";

const FeedPage = ({ user, onLogin, pageType, isSidebarOpen }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  let apiTag = "";
  let placeholder = "What's on your mind?";
  if (pageType === "LOST_FOUND") {
    apiTag = "LOST_FOUND";
    placeholder = "Report lost or found item...";
  }
  if (pageType === "NOTICES") {
    apiTag = "OFFICIAL";
    placeholder = "Post official notice...";
  }
  if (pageType === "CONFESSIONS") {
    apiTag = "CONFESSION";
    placeholder = "Confess anonymously...";
  }

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/posts?tag=${apiTag}`)
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Feed Fetch Error:", err));
  }, [pageType]);

  const handlePost = async () => {
    if (!user) {
      onLogin();
      return;
    }
    const postData = {
      title: newPost,
      desc: newPost,
      tag: apiTag || "ANNOUNCEMENT",
      author: { name: user.name, handle: user.handle, avatar: user.avatar },
      isAnonymous: pageType === "CONFESSIONS",
    };
    try {
      await axios.post("http://localhost:5000/api/posts", postData);
      setNewPost("");
      const res = await axios.get(
        `http://localhost:5000/api/posts?tag=${apiTag}`
      );
      setPosts(res.data);
    } catch (err) {
      alert("Failed to post");
    }
  };

  const getTagStyle = (tag) => {
    if (tag === "LOST_FOUND")
      return "bg-red-500/10 text-red-400 border-red-500/20";
    if (tag === "OFFICIAL")
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (tag === "CONFESSION")
      return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    return "bg-zinc-800 text-zinc-400";
  };

  return (
    // Added pt-20 to account for fixed header
    <main
      className={`flex-1 w-full transition-all duration-300 p-4 md:p-6 pt-20 overflow-y-auto no-scrollbar relative z-0 ${
        isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
      } lg:mr-80`}
    >
      <div className="max-w-2xl mx-auto pb-20">
        <h2 className="text-xl font-bold text-white tracking-wide mb-6">
          {pageType?.replace("_", " & ") || "Campus Feed"}
        </h2>

        <div className="bg-black p-5 rounded-2xl shadow-xl border border-white/10 mb-8 backdrop-blur-sm relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-50"></div>
          <div className="flex gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-white font-bold">
              {user ? user.name?.charAt(0) : <UserIcon size={18} />}
            </div>
            <input
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              type="text"
              placeholder={placeholder}
              className="flex-1 bg-zinc-900/50 text-zinc-200 rounded-xl px-5 outline-none focus:ring-1 focus:ring-white/20 border border-white/5"
              onClick={() => !user && onLogin()}
            />
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <div className="flex gap-2 text-zinc-500">
              <ImageIcon size={18} />
              <LinkIcon size={18} />
            </div>
            <button
              onClick={handlePost}
              className="bg-white text-black px-6 py-1.5 rounded-lg font-bold text-sm hover:scale-105 transition-all"
            >
              Post
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-black rounded-2xl border border-white/10 p-5 shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                    {post.isAnonymous ? "?" : post.author?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200 font-bold">
                      {post.isAnonymous
                        ? "Anonymous Student"
                        : post.author?.name}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${getTagStyle(
                        post.tag
                      )}`}
                    >
                      {post.tag}
                    </span>
                  </div>
                </div>
                <MoreHorizontal size={18} className="text-zinc-500" />
              </div>
              <h3 className="text-zinc-100 font-bold mb-2">{post.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {post.desc}
              </p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10 text-zinc-400">
                <button className="flex items-center gap-1 hover:text-white">
                  <ArrowBigUp /> {post.stats}
                </button>
                <div className="flex gap-4">
                  <MessageSquare size={18} />
                  <Share2 size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
export default FeedPage;