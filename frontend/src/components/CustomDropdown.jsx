import React, { useState, useRef, useEffect } from "react";
import { ArrowDown } from "iconoir-react";

const CustomDropdown = ({
  options,
  value,
  onChange,
  label,
  className = "",
  colorScheme = "purple",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");

  const colorSchemes = {
    purple: {
      focus: "focus:border-purple-500/50 focus:ring-purple-500/20",
      selected: "bg-purple-600/30 border-purple-500",
      hover: "hover:border-white/20",
    },
    red: {
      focus: "focus:border-red-500/50 focus:ring-red-500/20",
      selected: "bg-red-600/30 border-red-500",
      hover: "hover:border-red-500/30",
    },
    blue: {
      focus: "focus:border-blue-500/50 focus:ring-blue-500/20",
      selected: "bg-blue-600/30 border-blue-500",
      hover: "hover:border-blue-500/30",
    },
    amber: {
      focus: "focus:border-amber-500/50 focus:ring-amber-500/20",
      selected: "bg-amber-600/30 border-amber-500",
      hover: "hover:border-amber-500/30",
    },
    green: {
      focus: "focus:border-green-500/50 focus:ring-green-500/20",
      selected: "bg-green-600/30 border-green-500",
      hover: "hover:border-green-500/30",
    },
    cyan: {
      focus: "focus:border-cyan-500/50 focus:ring-cyan-500/20",
      selected: "bg-cyan-600/30 border-cyan-500",
      hover: "hover:border-cyan-500/30",
    },
    pink: {
      focus: "focus:border-pink-500/50 focus:ring-pink-500/20",
      selected: "bg-pink-600/30 border-pink-500",
      hover: "hover:border-pink-500/30",
    },
  };

  const scheme = colorSchemes[colorScheme] || colorSchemes.purple;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Calculate dropdown position to prevent overflow
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen]);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || value || "Select...";

  return (
    <div className={`relative w-full ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 bg-zinc-800 border border-white/10 rounded-lg outline-none focus:ring-2 text-white text-left flex items-center justify-between transition-all ${scheme.focus} ${scheme.hover}`}
        type="button"
      >
        <span className="truncate">{selectedLabel}</span>
        <ArrowDown
          size={16}
          className={`flex-shrink-0 transition-transform ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 ${
            dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
          } bg-zinc-800 border border-white/10 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto md:max-h-72`}
          role="listbox"
        >
          {options.map((option, idx) => (
            <button
              key={`${option.value}-${idx}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm transition-all ${
                value === option.value
                  ? `${scheme.selected} text-white font-medium border-l-2`
                  : "text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
              }`}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
