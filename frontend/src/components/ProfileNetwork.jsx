import React, { useState } from "react";
import { User, Heart, ArrowRight } from "iconoir-react";

const generateHandle = (user) => {
  if (user.handle) return user.handle;
  if (user.username) return `@${user.username}`;
  if (user.name) {
    return `@${user.name.toLowerCase().replace(/\s+/g, '_')}`;
  }
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    return `@${emailPrefix}`;
  }
  return "@user";
};

const ProfileNetwork = ({ stats, navigate, initialTab = "followers" }) => {
  const [networkTab, setNetworkTab] = useState(initialTab);

  const people = networkTab === "followers" ? stats.followers : stats.following;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
          <User width={24} height={24} className="text-gray-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Network</h2>
          <p className="text-gray-500 text-sm font-medium">Your connections and followers</p>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-gray-900/50 border border-gray-800 rounded-xl p-1">
        <button onClick={() => setNetworkTab("followers")}
          className={`flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 min-h-[44px] ${
            networkTab === "followers"
              ? "bg-white text-black shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}>
          Followers ({stats.followers?.length || 0})
        </button>
        <button onClick={() => setNetworkTab("following")}
          className={`flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 min-h-[44px] ${
            networkTab === "following"
              ? "bg-white text-black shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}>
          Following ({stats.following?.length || 0})
        </button>
      </div>

      {/* List */}
      {people?.length === 0 ? (
        <div className="text-center py-12 px-8">
          <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 inline-block mb-4">
            {networkTab === "followers"
              ? <User width={48} height={48} className="text-gray-400" />
              : <Heart width={48} height={48} className="text-gray-400" />
            }
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {networkTab === "followers" ? "No followers yet" : "Not following anyone"}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {networkTab === "followers"
              ? "When people follow you, they'll appear here."
              : "Follow people to see their updates and build your network."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {people.map((person) => (
            <div key={person._id}
              onClick={() => navigate(`/profile/${person._id}`)}
              className="p-4 bg-black border border-gray-800 rounded-xl hover:bg-gray-900 transition-all cursor-pointer group active:scale-95">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold border border-gray-700">
                    {person.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-white font-semibold group-hover:text-gray-300 transition-colors">
                      {person.name || "Unknown User"}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {generateHandle(person)}
                    </p>
                  </div>
                </div>
                <ArrowRight width={16} height={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileNetwork;
