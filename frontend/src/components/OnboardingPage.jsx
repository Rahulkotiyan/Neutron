import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  AtSign,
  Building,
  Book,
  Calendar,
  Refresh,
  Check,
  WarningCircle,
  Camera,
  Xmark,
  ArrowLeft,
  ArrowRight,
} from "iconoir-react";
import { API_URL } from "../utils/api";

const STEPS = [
  { label: "Identity", desc: "Who you are" },
  { label: "Academics", desc: "Your education" },
  { label: "Profile", desc: "Final touches" },
];

const CustomSelect = ({ label, icon, value, options, onChange, placeholder, isOpen, onToggle, onClose, disabled }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
        {icon} {label}
      </label>
      <button type="button" onClick={disabled ? undefined : onToggle}
        className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed">
        <span className={value ? "text-white" : "text-zinc-400"}>{selected ? selected.label : placeholder}</span>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-[80] w-full mt-1 bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); onClose(); }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${opt.value === value ? "bg-white/20 text-white" : "text-zinc-300"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const OnboardingPage = ({ currentUser, token, onProfileCreated }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [academicSubStep, setAcademicSubStep] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    college: "",
    branch: "",
    year: "",
    about: "",
  });
  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const [collegeOpen, setCollegeOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  useEffect(() => {
    fetchColleges();
    fetchBranches();
    if (currentUser?.displayName && !formData.name) {
      setFormData((prev) => ({ ...prev, name: currentUser.displayName }));
    }
  }, []);

  const fetchColleges = async () => {
    try {
      const res = await axios.get(`${API_URL}/colleges`);
      setColleges(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/branches`);
      setBranches(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }
    try {
      setUsernameChecking(true);
      const res = await axios.get(`${API_URL}/auth/check-username/${username}`);
      setUsernameAvailable(res.data.available);
      setUsernameError(res.data.available ? "" : "Username is already taken");
    } catch {
      setUsernameError("Error checking username");
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "username") {
      const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
      setFormData((prev) => ({ ...prev, username: clean }));
      if (clean !== formData.username) {
        checkUsernameAvailability(clean);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setError("Please select an image file.");
      }
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const canContinueStep1 = formData.name.trim().length > 0 && formData.username.trim().length >= 3 && usernameAvailable === true;

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!formData.name.trim()) { setError("Name is required"); return false; }
      if (!formData.username.trim()) { setError("Username is required"); return false; }
      if (formData.username.length < 3) { setError("Username must be at least 3 characters"); return false; }
      if (!usernameAvailable) { setError("Username is not available"); return false; }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 1) {
      if (academicSubStep < 2) {
        setAcademicSubStep((s) => s + 1);
        return;
      }
    }
    setStep((s) => s + 1);
    setAcademicSubStep(0);
  };

  const handleBack = () => {
    setError("");
    if (step === 1 && academicSubStep > 0) {
      setAcademicSubStep((s) => s - 1);
      return;
    }
    setStep((s) => s - 1);
    setAcademicSubStep(0);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!formData.name.trim()) { setError("Name is required"); return; }
    if (!formData.username.trim() || formData.username.length < 3) { setError("Valid username is required"); return; }
    setLoading(true);

    try {
      const authToken = token || localStorage.getItem("token");
      const fd = new FormData();
      Object.keys(formData).forEach((key) => fd.append(key, formData[key]));
      if (avatarFile) fd.append("avatar", avatarFile);

      await axios.post(`${API_URL}/profile/create`, fd, {
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "multipart/form-data" },
      });

      const updatedUser = { ...currentUser, ...formData, hasProfile: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (onProfileCreated) onProfileCreated(updatedUser);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Profile creation error:", err);
      setError(err.response?.data?.message || err.message || "Failed to create profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setError("");
    if (!formData.name.trim() || !formData.username.trim() || formData.username.length < 3 || !usernameAvailable) {
      setError("Please fill in name and a valid username first");
      return;
    }
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem("token");

      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("username", formData.username);
      fd.append("college", "");
      fd.append("branch", "");
      fd.append("year", "");
      fd.append("about", "");

      await axios.post(`${API_URL}/profile/create`, fd, {
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "multipart/form-data" },
      });

      const updatedUser = { ...currentUser, hasProfile: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (onProfileCreated) onProfileCreated(updatedUser);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Skip onboarding error:", err);
      setError(err.response?.data?.message || err.message || "Failed to skip. Try completing the form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] flex flex-col">
      {/* Top bar */}
      <div className="px-4 md:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step > 0 || academicSubStep > 0 ? (
            <button onClick={handleBack} className="p-2 hover:bg-white/5 rounded-xl transition-all">
              <ArrowLeft iconSize={20} className="text-white" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <span className="text-white font-black text-sm tracking-widest uppercase">Neutron</span>
        </div>
        <button onClick={handleSkip} disabled={loading} className="text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? "Skipping..." : "Skip"}
        </button>
      </div>

      {/* Step indicator */}
      <div className="px-4 md:px-8 pb-8">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 md:gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  i === step ? "bg-white text-black" :
                  i < step ? "bg-green-500 text-white" :
                  "bg-white/10 text-white/40"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${i === step ? "text-white" : "text-white/40"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`h-[2px] w-8 md:w-16 ${i < step ? "bg-green-500" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 md:px-8 max-w-lg mx-auto w-full pb-8 overflow-y-auto min-h-0">
        {/* Step 1 — Identity */}
        {step === 0 && (
          <div className="flex flex-col gap-5 min-h-full py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Welcome to Neutron</h1>
              <p className="text-zinc-500 text-sm font-medium">Let's set up your identity</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <WarningCircle iconSize={16} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
                  <User iconSize={16} /> Full Name
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all"
                  placeholder="Enter your full name" autoFocus />
              </div>

              <div>
                <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
                  <AtSign iconSize={16} /> Username
                </label>
                <div className="relative">
                  <input type="text" name="username" value={formData.username} onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all"
                    placeholder="Choose a unique username" />
                  {formData.username && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameChecking ? (
                        <Refresh iconSize={16} className="text-zinc-400 animate-spin" />
                      ) : usernameAvailable ? (
                        <Check iconSize={16} className="text-green-400" />
                      ) : usernameAvailable === false ? (
                        <WarningCircle iconSize={16} className="text-red-400" />
                      ) : null}
                    </div>
                  )}
                </div>
                {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
                <p className="text-zinc-500 text-xs mt-1">At least 3 characters, lowercase letters, numbers, underscores</p>
              </div>
            </div>

            <div className="mt-auto">
              <button onClick={handleNext} disabled={!canContinueStep1}
                className="w-full py-3.5 bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Continue <ArrowRight iconSize={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Academics (cascading) */}
        {step === 1 && (
          <div className="flex flex-col gap-5 min-h-full py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Academic Details</h1>
              <p className="text-zinc-500 text-sm font-medium">
                {academicSubStep === 0 && "Which college do you attend?"}
                {academicSubStep === 1 && "What's your branch?"}
                {academicSubStep === 2 && "What year are you in?"}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <WarningCircle iconSize={16} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {academicSubStep === 0 && (
                <CustomSelect
                  label="College"
                  icon={<Building iconSize={16} />}
                  value={formData.college}
                  options={colleges.map((c) => ({ value: c.name, label: c.name }))}
                  onChange={(v) => { setFormData((p) => ({ ...p, college: v })); }}
                  placeholder="Select your college"
                  isOpen={collegeOpen}
                  onToggle={() => { setCollegeOpen(!collegeOpen); setBranchOpen(false); setYearOpen(false); }}
                  onClose={() => setCollegeOpen(false)}
                />
              )}

              {academicSubStep === 1 && (
                <CustomSelect
                  label="Branch"
                  icon={<Book iconSize={16} />}
                  value={formData.branch}
                  options={branches.map((b) => ({ value: b.name, label: b.name }))}
                  onChange={(v) => { setFormData((p) => ({ ...p, branch: v })); }}
                  placeholder="Select your branch"
                  isOpen={branchOpen}
                  onToggle={() => { setBranchOpen(!branchOpen); setCollegeOpen(false); setYearOpen(false); }}
                  onClose={() => setBranchOpen(false)}
                />
              )}

              {academicSubStep === 2 && (
                <CustomSelect
                  label="Year of Study"
                  icon={<Calendar iconSize={16} />}
                  value={formData.year}
                  options={[
                    { value: "1st Year", label: "1st Year" },
                    { value: "2nd Year", label: "2nd Year" },
                    { value: "3rd Year", label: "3rd Year" },
                    { value: "4th Year", label: "4th Year" },
                    { value: "5th Year", label: "5th Year" },
                  ]}
                  onChange={(v) => { setFormData((p) => ({ ...p, year: v })); }}
                  placeholder="Select your year"
                  isOpen={yearOpen}
                  onToggle={() => { setYearOpen(!yearOpen); setCollegeOpen(false); setBranchOpen(false); }}
                  onClose={() => setYearOpen(false)}
                />
              )}
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all">
                  Back
                </button>
                <button onClick={handleNext}
                  className="flex-1 py-3.5 bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                  {academicSubStep < 2 ? "Next" : "Continue"} <ArrowRight iconSize={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Profile & About */}
        {step === 2 && (
          <div className="flex flex-col gap-5 min-h-full py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Almost done!</h1>
              <p className="text-zinc-500 text-sm font-medium">Add a photo and a short bio</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <WarningCircle iconSize={16} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-center">
              <div className="relative group">
                <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                <div onClick={() => avatarInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-all group-hover:from-zinc-700 group-hover:to-zinc-800 overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User iconSize={32} className="text-zinc-600" />
                  )}
                </div>
                <div onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  <Camera iconSize={20} className="text-white" />
                </div>
                {avatarPreview && (
                  <button type="button" onClick={removeAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all">
                    <Xmark iconSize={12} />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-500 text-center -mt-2">Profile picture (optional)</p>

            <div>
              <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
                <Book iconSize={16} /> About
              </label>
              <textarea name="about" value={formData.about} onChange={handleInputChange} rows={4}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all resize-none"
                placeholder="Tell us about yourself, your interests, goals..." />
              <p className="text-zinc-500 text-xs mt-1">Optional: Help others know more about you</p>
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-3">
                <button onClick={handleBack} className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all">
                  Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3.5 bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><Refresh iconSize={16} className="animate-spin" /> Creating...</>
                  ) : "Complete Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
