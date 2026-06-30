import React, { useState } from "react";
import { Check, Send } from "iconoir-react";
import ModalShell, { ModalHeader, ModalFooter, ModalBody } from "./ModalShell";
import FormField from "./FormField";
import LoadingButton from "./LoadingButton";
import api from "../utils/api";

const CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement Suggestion" },
  { value: "general", label: "General Feedback" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600";

const FeedbackModal = ({ isOpen, onClose, user }) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setCategory("general");
    setMessage("");
    setRating(0);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setLoading(true);
    try {
      await api.post("/feedback", { name, email, category, message, rating });
      setSuccess(true);
      setTimeout(reset, 2000);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={() => { onClose(); setTimeout(reset, 300); }} size="md">
      <ModalHeader
        title="Send Feedback"
        subtitle="Help us improve Neutron"
        onClose={() => { onClose(); setTimeout(reset, 300); }}
      />

      {success ? (
        <ModalBody>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
              <Check size={32} className="text-green-400" />
            </div>
            <p className="text-xl font-bold text-white">Thank you!</p>
            <p className="text-sm text-zinc-400 text-center">Your feedback has been submitted. We appreciate your input!</p>
          </div>
        </ModalBody>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ModalBody scrollable>
            <div className="space-y-5">
                <FormField label="Name *">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label="Email (Optional)">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Category *">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Message *">
                  <textarea
                    placeholder="Tell us what's on your mind..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputClass} h-32 resize-none`}
                    required
                  />
                </FormField>

                <FormField label="Rating">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star === rating ? 0 : star)}
                        className={`p-2 rounded-lg transition-all active:scale-95 min-h-[44px] min-w-[44px] text-2xl ${
                          star <= rating ? "text-yellow-400" : "text-zinc-600 hover:text-zinc-400"
                        }`}
                      >
                        {star <= rating ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            </ModalBody>

            <ModalFooter className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { onClose(); setTimeout(reset, 300); }}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95 min-h-[44px]"
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                disabled={!name.trim() || !message.trim() || loading}
                loading={loading}
                loadingText="Sending..."
                icon={Send}
                className="bg-zinc-700 hover:bg-zinc-600"
              >
                Send Feedback
              </LoadingButton>
            </ModalFooter>
          </form>
        )}
    </ModalShell>
  );
};

export default FeedbackModal;
