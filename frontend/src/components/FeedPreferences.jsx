import React from "react";
import { Eye, Volume2, Zap, Minimize2 } from "lucide-react";

const FeedPreferences = ({ preferences, onPreferencesChange }) => {
  const handlePreferenceChange = (key) => {
    onPreferencesChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const preferenceOptions = [
    {
      key: "autoplay",
      icon: Zap,
      label: "Autoplay Videos",
      description: "Videos will start playing automatically",
      color: "from-blue-500 to-cyan-500",
    },
    {
      key: "hideNSFW",
      icon: Eye,
      label: "Hide NSFW Content",
      description: "Hide mature content from your feed",
      color: "from-orange-500 to-red-500",
    },
    {
      key: "compactMode",
      icon: Minimize2,
      label: "Compact Mode",
      description: "Show more posts with less whitespace",
      color: "from-purple-500 to-pink-500",
    },
    {
      key: "showAds",
      icon: Volume2,
      label: "Show Sponsored",
      description: "See sponsored posts and recommendations",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-2">Feed Preferences</h3>
        <p className="text-sm text-zinc-400">Customize your feed experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {preferenceOptions.map((option) => {
          const Icon = option.icon;
          const isEnabled = preferences[option.key];

          return (
            <div
              key={option.key}
              className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                isEnabled
                  ? "bg-white/10 border-white/20 shadow-lg"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
              onClick={() => handlePreferenceChange(option.key)}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${option.color}`}
                >
                  <Icon size={18} className="text-white" />
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-all relative ${
                    isEnabled ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      isEnabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </div>
              <p className="text-sm font-bold text-white mb-1">
                {option.label}
              </p>
              <p className="text-xs text-zinc-400">{option.description}</p>
            </div>
          );
        })}
      </div>

      {/* Advanced Settings */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="text-sm font-bold text-white mb-4">Advanced Settings</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
            <div>
              <p className="text-sm font-medium text-white">Content Language</p>
              <p className="text-xs text-zinc-500">Currently: English</p>
            </div>
            <select className="bg-zinc-800 text-white text-xs px-3 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50">
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
            <div>
              <p className="text-sm font-medium text-white">Posts per Load</p>
              <p className="text-xs text-zinc-500">Currently: 10 posts</p>
            </div>
            <select className="bg-zinc-800 text-white text-xs px-3 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50">
              <option>5 posts</option>
              <option selected>10 posts</option>
              <option>20 posts</option>
              <option>30 posts</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
            <div>
              <p className="text-sm font-medium text-white">Theme</p>
              <p className="text-xs text-zinc-500">Currently: Dark Mode</p>
            </div>
            <select className="bg-zinc-800 text-white text-xs px-3 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500/50">
              <option selected>Dark Mode</option>
              <option>Light Mode</option>
              <option>Auto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 text-center">
        <p className="text-xs text-blue-300">
          💡 These preferences sync across all your devices
        </p>
      </div>
    </div>
  );
};

export default FeedPreferences;
