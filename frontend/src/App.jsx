import React,{useState,useEffect} from "react";
import axios from 'axios';
import {
  Home,
  Users,
  Layout,
  BookOpen,
  ShoppingBag,
  Calendar,
  FileText,
  Bell,
  MessageSquare,
  Search,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  MoreHorizontal,
  ArrowBigUp,
  Share2,
  Bookmark,
  SidebarIcon,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import Rightbar from "./components/Rightbar";
import PostCard from "./components/PostCard";

function App(){
    const [posts,setPosts]= useState([]);
    const [loading,setLoading]=useState(true);

    //fetching backend data
    useEffect(()=>{
        axios.get('http://localhost:5000/api/posts').then(response=>{
            setPosts(response.data);
            setLoading(false);
        }).catch(error=>{
            console.error("Error fetching data:",error);
            setLoading(false);
        });
    },[]);

    return (
      <div className="flex h-screen overflow-hidden bg-gray-500 font-sans text-slate-800">
        {/*Left sidebar*/}
        <Sidebar/>
        {/*Center feed*/}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/*Input box */}
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="What's on your mind?"
                  className="flex-1 bg-slate-100 rounded-full px-6 py-3 outline-none focus:ring-2 ring-blue-100 transition"
                />
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  Post
                </button>
              </div>
              <div>
                <ActionButton
                  icon={<ImageIcon size={18} />}
                  label="Image/Video"
                  color="text-blue-500 bg-blue-50"
                />
                <ActionButton
                  icon={<LinkIcon size={18} />}
                  label="Link"
                  color="text-orange-500 bg-orange-50"
                />
              </div>
            </div>

            {/*Posts grid*/}
            {loading ? (
              <div className="text-center py-10 text-gray-500">
                Loading your feed...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post}/>
                ))}
              </div>
            )}
          </div>
        </main>

        {/*Right sidebar */}
        <Rightbar/>
      </div>
    );
}



const ActionButton = ({icon,label,color})=>(
    <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition hover:bg-opacity-80 ${color}`}>
        {icon} {label}
    </button>
);

export default App;