import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Xmark,
  User,
  AtSign,
  Building,
  Book,
  Calendar,
  Refresh,
  Check,
  WarningCircle,
  Camera,
} from "iconoir-react";
import { API_URL } from "../utils/api";

// Custom Dropdown Component
const CustomDropdown = ({
  label,
  icon,
  value,
  options,
  onChange,
  placeholder,
  isOpen,
  onToggle,
  onClose,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
        {icon}
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all flex items-center justify-between"
      >
        <span className={value ? "text-white" : "text-zinc-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[80] w-full mt-1 bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                option.value === value
                  ? "bg-white/20 text-white"
                  : "text-zinc-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose, onProfileCreated, user }) => {
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
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  
  // File handling states
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchColleges();
      fetchBranches();
      // Pre-fill name from Google auth if available
      if (user?.displayName) {
        setFormData((prev) => ({ ...prev, name: user.displayName }));
      }
      // Close all dropdowns when modal opens
      setCollegeDropdownOpen(false);
      setBranchDropdownOpen(false);
      setYearDropdownOpen(false);
    }
  }, [isOpen, user]);

  const fetchColleges = async () => {
    try {
      const response = await axios.get(`${API_URL}/colleges`);
      setColleges(response.data.data || response.data);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_URL}/branches`);
      setBranches(response.data.data || response.data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  // File handling functions
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        setError('Please select an image file for your profile picture.');
      }
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }

    try {
      setUsernameChecking(true);
      const response = await axios.get(
        `${API_URL}/auth/check-username/${username}`,
      );
      setUsernameAvailable(response.data.available);
      setUsernameError(
        response.data.available ? "" : "Username is already taken",
      );
    } catch (err) {
      setUsernameError("Error checking username");
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "username") {
      const cleanUsername = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
      setFormData((prev) => ({ ...prev, username: cleanUsername }));

      if (cleanUsername !== formData.username) {
        checkUsernameAvailability(cleanUsername);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!usernameAvailable) {
      setError("Username is not available");
      return false;
    }
    if (!formData.college) {
      setError("College is required");
      return false;
    }
    if (!formData.branch) {
      setError("Branch is required");
      return false;
    }
    if (!formData.year) {
      setError("Year is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add avatar file if selected
      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      const response = await axios.post(`${API_URL}/profile/create`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        onProfileCreated(response.data);
        onClose();
      }
    } catch (err) {
      console.error("Profile creation error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in">
        <div
          className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 m-4 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_50px_rgba(255,255,255,0.05)] max-h-[90vh] overflow-y-auto before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none z-[70]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <Xmark size={20} />
          </button>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              Create Your Profile
            </h2>
            <p className="text-zinc-400 text-center text-sm">
              Tell us about yourself to get started with Neutron
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <WarningCircle size={16} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="flex justify-center">
              <div className="relative group">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <div
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-all group-hover:from-zinc-700 group-hover:to-zinc-800 overflow-hidden"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-zinc-600" />
                  )}
                </div>
                <div
                  onClick={handleAvatarClick}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Camera size={20} className="text-white" />
                </div>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                  >
                    <Xmark size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-4">
                Click to upload profile picture (optional)
              </p>
            </div>
            {/* Name Field */}
            <div>
              <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
                <User size={16} />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
                <AtSign size={16} />
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                  placeholder="Choose a unique username"
                  required
                />
                {formData.username && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameChecking ? (
                      <Refresh
                        size={16}
                        className="text-zinc-400 animate-spin"
                      />
                    ) : usernameAvailable ? (
                      <Check size={16} className="text-green-400" />
                    ) : usernameAvailable === false ? (
                      <WarningCircle size={16} className="text-red-400" />
                    ) : null}
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="text-red-400 text-xs mt-1">{usernameError}</p>
              )}
              <p className="text-zinc-500 text-xs mt-1">
                Username must be at least 3 characters and unique
              </p>
            </div>

            {/* College Field */}
            <CustomDropdown
              label="College"
              icon={<Building size={16} />}
              value={formData.college}
              options={colleges.map((college) => ({
                value: college.name,
                label: college.name,
              }))}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, college: value }))
              }
              placeholder="Select your college"
              isOpen={collegeDropdownOpen}
              onToggle={() => {
                setCollegeDropdownOpen(!collegeDropdownOpen);
                setBranchDropdownOpen(false);
                setYearDropdownOpen(false);
              }}
              onClose={() => setCollegeDropdownOpen(false)}
            />

            {/* Branch Field */}
            <CustomDropdown
              label="Branch"
              icon={<Book size={16} />}
              value={formData.branch}
              options={branches.map((branch) => ({
                value: branch.name,
                label: branch.name,
              }))}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, branch: value }))
              }
              placeholder="Select your branch"
              isOpen={branchDropdownOpen}
              onToggle={() => {
                setBranchDropdownOpen(!branchDropdownOpen);
                setCollegeDropdownOpen(false);
                setYearDropdownOpen(false);
              }}
              onClose={() => setBranchDropdownOpen(false)}
            />

            {/* Year Field */}
            <CustomDropdown
              label="Year of Study"
              icon={<Calendar size={16} />}
              value={formData.year}
              options={[
                { value: "1st Year", label: "1st Year" },
                { value: "2nd Year", label: "2nd Year" },
                { value: "3rd Year", label: "3rd Year" },
                { value: "4th Year", label: "4th Year" },
                { value: "5th Year", label: "5th Year" },
              ]}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, year: value }))
              }
              placeholder="Select your year"
              isOpen={yearDropdownOpen}
              onToggle={() => {
                setYearDropdownOpen(!yearDropdownOpen);
                setCollegeDropdownOpen(false);
                setBranchDropdownOpen(false);
              }}
              onClose={() => setYearDropdownOpen(false)}
            />

            {/* About Field */}
            <div>
              <label className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-2">
                <Book size={16} />
                About
              </label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all resize-none"
                placeholder="Tell us about yourself, your interests, goals..."
              />
              <p className="text-zinc-500 text-xs mt-1">
                Optional: Help others know more about you
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !usernameAvailable}
              className="w-full bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 text-white font-medium py-3 rounded-lg hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-zinc-600/30 shadow-lg"
            >
              {loading ? (
                <>
                  <Refresh size={16} className="animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Create Profile"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
