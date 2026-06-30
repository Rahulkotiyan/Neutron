import React, { useState } from "react";
import { ChatBubbleEmpty } from "iconoir-react";
import FeedbackModal from "./FeedbackModal";

const FeedbackFAB = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`}</style>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60] w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-zinc-700 to-black hover:from-zinc-600 hover:to-zinc-900 text-white rounded-full shadow-2xl shadow-zinc-900/60 border-[3px] border-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-[float_3s_ease-in-out_infinite]"
        aria-label="Send Feedback"
      >
        <ChatBubbleEmpty size={14} className="md:w-[22px] md:h-[22px]" />
      </button>
      <FeedbackModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
      />
    </>
  );
};

export default FeedbackFAB;
