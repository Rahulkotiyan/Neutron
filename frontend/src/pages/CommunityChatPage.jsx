import React from "react";
import { MessageSquare } from "lucide-react";

export default function CommunityChatPage() {
  // This is a static mockup. Real-time chat (Phase 4)
  // would require WebSockets (e.g., Socket.io)
  // to send and receive messages instantly.

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
        <MessageSquare size={32} />
        <span>Community Chat</span>
      </h1>

      <div className="flex h-[75vh] bg-white rounded-lg shadow-md overflow-hidden">
        {/* Channel List */}
        <div className="w-1/3 md:w-1/4 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3">Channels</h2>
          <ul className="space-y-2">
            <li className="p-2 rounded-lg bg-blue-100 text-blue-700 font-medium cursor-pointer">
              # general
            </li>
            <li className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer">
              # announcements
            </li>
            <li className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer">
              # 3rd-sem-cse
            </li>
            <li className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer">
              # 5th-sem-ise
            </li>
            <li className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer">
              # placements-2025
            </li>
            <li className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer">
              # random
            </li>
            <li className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer">
              # sports
            </li>
          </ul>
        </div>

        {/* Chat Window (Static Mockup) */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold"># general</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
                A
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Admin{" "}
                  <span className="text-xs text-gray-500 ml-1">10:30 AM</span>
                </p>
                <p className="p-2 bg-gray-100 rounded-lg text-gray-800">
                  Welcome to the #general channel!
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
                P
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Priya{" "}
                  <span className="text-xs text-gray-500 ml-1">10:31 AM</span>
                </p>
                <p className="p-2 bg-gray-100 rounded-lg text-gray-800">
                  Hi! Does anyone have the notes for yesterday's M3 class?
                </p>
              </div>
            </div>

            <div className="flex items-start justify-end space-x-3">
              <div>
                <p className="font-medium text-gray-900 text-right">
                  <span className="text-xs text-gray-500 mr-1">10:32 AM</span>{" "}
                  You
                </p>
                <p className="p-2 bg-blue-500 rounded-lg text-white">
                  Hey Priya, check the Learning Resources page. I think Rohan
                  uploaded them.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center font-bold text-white text-sm">
                Y
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <input
              type="text"
              placeholder="Type your message in #general..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
            <p className="text-xs text-center text-gray-400 mt-2">
              Real-time chat will be enabled in Phase 4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
