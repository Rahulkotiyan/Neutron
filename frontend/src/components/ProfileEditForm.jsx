import React, { useState } from "react";
import {
  User,
  Medal,
  Heart,
  Refresh,
} from "iconoir-react";
import CustomDropdown from "./CustomDropdown";

const STEPS = [
  { label: "Identity", description: "Core Identity" },
  { label: "Academics", description: "Academic & Contact Records" },
  { label: "Bio", description: "Biography" },
];

const ProfileEditForm = ({
  formData,
  handleChange,
  handleSave,
  saving,
  colleges,
  loadingColleges,
  branches,
  loadingBranches,
  setFormData,
}) => {
  const [step, setStep] = useState(0);

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 2) setStep((s) => s + 1);
  };

  const handleBack = (e) => {
    e.preventDefault();
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 md:gap-4 py-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  i === step
                    ? "bg-white text-black"
                    : i < step
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/40"
                }`}
              >
                {i < step ? "\u2713" : i + 1}
              </div>
              <span className="text-[10px] md:text-xs md:text-xs font-black uppercase tracking-widest text-white/60">
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`h-[2px] w-8 md:w-16 ${
                  i < step ? "bg-green-500" : "bg-white/10"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Core Identity */}
      {step === 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <User iconSize={20} className="text-zinc-500" />
            <h3 className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em]">
              Core Identity
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Digital Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
                placeholder="Choose a unique username"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Short Bio
              </label>
              <input
                type="text"
                name="shortBio"
                value={formData.shortBio}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
                placeholder="Brief description about yourself (max 150 characters)"
                maxLength="150"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                  External Uplink
                </label>
                <input
                  type="text"
                  name="externalLink"
                  value={formData.externalLink || ""}
                  onChange={handleChange}
                  className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-lg"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Academic & Contact Records */}
      {step === 1 && (
        <div className="space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Medal iconSize={20} className="text-zinc-500" />
            <h3 className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em]">
              Academic & Contact Records
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Institution
              </label>
              <select
                name="college"
                value={formData.college}
                onChange={handleChange}
                disabled={loadingColleges}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm [color-scheme:dark] disabled:opacity-50"
              >
                <option value="" className="bg-black">
                  {loadingColleges
                    ? "Loading institutions..."
                    : "Select Institution"}
                </option>
                {Array.isArray(colleges) &&
                  colleges.map((college) => (
                    <option
                      key={college._id}
                      value={college.name}
                      className="bg-black"
                    >
                      {college.name}
                    </option>
                  ))}
              </select>
              {loadingColleges && (
                <p className="text-xs text-zinc-500 mt-1">
                  Loading available institutions...
                </p>
              )}
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Department
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={loadingBranches}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm [color-scheme:dark] disabled:opacity-50"
              >
                <option value="" className="bg-black">
                  {loadingBranches
                    ? "Loading departments..."
                    : "Select Department"}
                </option>
                {Array.isArray(branches) &&
                  branches.map((branch) => (
                    <option
                      key={branch._id}
                      value={branch.name}
                      className="bg-black"
                    >
                      {branch.name}
                    </option>
                  ))}
              </select>
              {loadingBranches && (
                <p className="text-xs text-zinc-500 mt-1">
                  Loading available departments...
                </p>
              )}
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Semester
              </label>
              <CustomDropdown
                colorScheme="transparent"
                options={Array.from({ length: 8 }, (_, i) => ({
                  value: `Sem ${i + 1}`,
                  label: `Term 0${i + 1}`,
                }))}
                value={formData.semester}
                onChange={(value) =>
                  setFormData({ ...formData, semester: value })
                }
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm [color-scheme:dark]"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.3em] ml-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-0 py-3 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Biography */}
      {step === 2 && (
        <div className="space-y-10">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <Heart size={20} className="text-zinc-500" />
            <h3 className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.4em]">
              Biography
            </h3>
          </div>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="4"
            className="w-full px-0 py-4 bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-white/40 transition-all font-bold text-sm resize-none"
            placeholder="Tell the Nexus about yourself..."
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        {step > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-95 min-h-[44px]"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type={step === 2 ? "submit" : "button"}
          onClick={step === 2 ? undefined : handleNext}
          disabled={saving}
          className="px-6 py-3 bg-white hover:bg-white/90 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 min-h-[44px]"
        >
          {saving && <Refresh iconSize={20} className="animate-spin" />}
          {step === 2 ? "Save Changes" : "Next"}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
