import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Flag, Loader } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import CustomDropdown from "./CustomDropdown";

const ReportModal = ({ isOpen, onClose, targetId, targetType, user }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:5000/api";

  const reportCategories = [
    {
      value: "hate",
      label: "Hate",
      description:
        "Slurs, Racist or sexist stereotypes, Dehumanization, Incitement of fear or discrimination, Hateful references, Hateful symbols & logos",
      reasons: [
        "Slurs",
        "Racist stereotypes",
        "Sexist stereotypes",
        "Dehumanization",
        "Incitement of fear or discrimination",
        "Hateful references",
        "Hateful symbols & logos",
      ],
    },
    {
      value: "abuse_harassment",
      label: "Abuse & Harassment",
      description:
        "Insults, Unwanted Sexual Content & Graphic Objectification, Unwanted NSFW & Graphic Content, Violent Event Denial, Targeted Harassment and Inciting Harassment",
      reasons: [
        "Insults",
        "Unwanted sexual content",
        "Graphic objectification",
        "Unwanted NSFW content",
        "Graphic content",
        "Violent event denial",
        "Targeted harassment",
        "Incitement of harassment",
      ],
    },
    {
      value: "violent_speech",
      label: "Violent Speech",
      description:
        "Violent Threats, Wish of Harm, Glorification of Violence, Incitement of Violence, Coded Incitement of Violence",
      reasons: [
        "Violent threats",
        "Wish of harm",
        "Glorification of violence",
        "Incitement of violence",
        "Coded incitement of violence",
      ],
    },
    {
      value: "child_safety",
      label: "Child Safety",
      description:
        "Child sexual exploitation, grooming, physical child abuse, underage user",
      reasons: [
        "Child sexual exploitation",
        "Grooming",
        "Physical child abuse",
        "Underage user",
      ],
    },
    {
      value: "privacy",
      label: "Privacy",
      description:
        "Sharing private information, threatening to share/expose private information, sharing non-consensual intimate images, sharing images of me that I don't want on the platform",
      reasons: [
        "Sharing private information",
        "Threatening to share private information",
        "Non-consensual intimate images",
        "Unwanted images on platform",
      ],
    },
    {
      value: "illegal_behaviors",
      label: "Illegal & Regulated Behaviors",
      description:
        "Human exploitation, sexual services, drugs, weapons, endangered species, facilitating illegal activity",
      reasons: [
        "Human exploitation",
        "Sexual services",
        "Drugs",
        "Weapons",
        "Endangered species",
        "Facilitating illegal activity",
      ],
    },
    {
      value: "spam",
      label: "Spam",
      description: "Fake engagement, scams, fake accounts, malicious links",
      reasons: ["Fake engagement", "Scams", "Fake accounts", "Malicious links"],
    },
    {
      value: "self_harm",
      label: "Suicide or self-harm",
      description:
        "Encouraging, promoting, providing instructions or sharing strategies for self-harm",
      reasons: [
        "Encouraging self-harm",
        "Promoting self-harm",
        "Providing instructions for self-harm",
        "Sharing strategies for self-harm",
      ],
    },
    {
      value: "sensitive_media",
      label: "Sensitive or disturbing media",
      description:
        "Graphic Content, Gratuitous Gore, Adult Nudity & Sexual Behavior, Violent Sexual Conduct, Bestiality & Necrophilia, Media depicting a deceased individual",
      reasons: [
        "Graphic content",
        "Gratuitous gore",
        "Adult nudity",
        "Sexual behavior",
        "Violent sexual conduct",
        "Bestiality",
        "Necrophilia",
        "Media of deceased individual",
      ],
    },
    {
      value: "impersonation",
      label: "Impersonation",
      description:
        "Pretending to be someone else, including non-compliant parody/fan accounts",
      reasons: [
        "Pretending to be someone else",
        "Non-compliant parody account",
        "Non-compliant fan account",
      ],
    },
    {
      value: "violent_entities",
      label: "Violent & hateful entities",
      description: "Violent extremism and terrorism, hate groups & networks",
      reasons: [
        "Violent extremism",
        "Terrorism",
        "Hate groups",
        "Hate networks",
      ],
    },
    {
      value: "civic_integrity",
      label: "Civic Integrity",
      description:
        "Misleading content related to voter participation, suppression, or intimidation in elections and other civic processes",
      reasons: [
        "Voter suppression",
        "Election misinformation",
        "Voter intimidation",
        "Civic process interference",
      ],
    },
  ];

  const communityViolations = [
    "Harassment",
    "Threatening violence",
    "Hate",
    "Minor abuse or sexualization",
    "Sharing personal information",
    "Non-consensual intimate media",
    "Prohibited transaction",
    "Impersonation",
    "Manipulated Content",
    "Copyright violation",
    "Trademark violation",
    "Self-harm or suicide",
    "Spam",
    "Contributor Program violation",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      toast.error("Please select a category for reporting");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/reports`,
        {
          target_id: targetId,
          target_type: targetType,
          reason: selectedCategory, // Just use category since specific reason was removed
          additional_info: additionalInfo,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success(response.data.message);
      onClose();
      // Reset form
      setSelectedCategory("");
      setSelectedReason("");
      setAdditionalInfo("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999999] p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        className="bg-gradient-to-br from-black via-slate-900 via-gray-900 via-gray-800 to-black border border-gray-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Report</h2>
                <p className="text-sm text-slate-300">
                  Help us understand what's happening
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  What type of issue are you reporting?
                </label>
                <CustomDropdown
                  colorScheme="pink"
                  options={[
                    { value: "", label: "Select a category" },
                    ...reportCategories.map((category) => ({
                      value: category.value,
                      label: category.label,
                    })),
                  ]}
                  value={selectedCategory}
                  onChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedReason(""); // Reset reason when category changes
                  }}
                />
                {selectedCategory && (
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {
                      reportCategories.find(
                        (cat) => cat.value === selectedCategory,
                      )?.description
                    }
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Additional information (optional)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Provide more details about why you're reporting this content..."
                  className="w-full p-3 border border-slate-500 rounded-md focus:ring-2 focus:ring-slate-400 focus:border-slate-300 resize-none text-sm bg-slate-800 text-white placeholder-slate-400"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 mt-2">
                  {additionalInfo.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-600">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors font-medium border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedCategory}
                  className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  Report
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Thanks for looking out for yourself and your fellow Trons by
              reporting things that break the rules. Let us know what's
              happening, and we'll look into it.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ReportModal;
