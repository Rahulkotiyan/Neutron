import React from "react";
import ModalShell, { ModalHeader, ModalBody, ModalFooter } from "./ModalShell";
import FormField from "./FormField";

const AttendanceCalculatorModal = ({
  isOpen,
  onClose,
  totalClasses,
  attendedClasses,
  requiredPercentage,
  onTotalChange,
  onAttendedChange,
  onPercentageChange,
  calculateAttendance,
}) => {
  const result = totalClasses > 0 ? calculateAttendance() : null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title="Attendance Calculator"
        subtitle="Quick calculation for attendance and bunk capacity"
        onClose={onClose}
        gradient
      />

      <ModalBody>
        <FormField label="Total Classes">
          <input
            type="number"
            min="0"
            value={totalClasses}
            onChange={(e) => onTotalChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all"
            placeholder="Enter total number of classes"
          />
        </FormField>

        <FormField label="Classes Attended">
          <input
            type="number"
            min="0"
            max={totalClasses || 999}
            value={attendedClasses}
            onChange={(e) => onAttendedChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all"
            placeholder="Enter number of classes attended"
          />
        </FormField>

        <FormField label="Required Percentage (%)">
          <select
            value={requiredPercentage}
            onChange={(e) => onPercentageChange(parseInt(e.target.value))}
            className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all"
          >
            <option value={60}>60% (Some Colleges)</option>
            <option value={65}>65% (Liberal)</option>
            <option value={70}>70% (Moderate)</option>
            <option value={75}>75% (Standard)</option>
            <option value={80}>80% (Strict)</option>
            <option value={85}>85% (Very Strict)</option>
          </select>
        </FormField>

        {totalClasses > 0 && result && (
          <div className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 sm:p-6 space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-400 mb-2">Current Attendance</p>
              <p className={`text-3xl sm:text-4xl font-bold ${
                result.status === "SAFE" ? "text-white" : "text-red-400"
              }`}>
                {result.currentPercentage}%
              </p>
            </div>

            <div className="text-center p-3 sm:p-4 bg-zinc-900/50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-white mb-1">
                {result.canBunk}
              </p>
              <p className="text-xs text-zinc-400">Can Bunk</p>
            </div>

            <div className="text-center">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                result.status === "SAFE"
                  ? "bg-zinc-800 text-white border border-zinc-600"
                  : "bg-red-900/30 text-red-300 border border-red-500/20"
              }`}>
                {result.status === "SAFE" ? "✓ Safe" : "⚠ Critical"}
              </span>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-white text-black rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 min-h-[44px] shadow-lg"
        >
          Close Calculator
        </button>
      </ModalFooter>
    </ModalShell>
  );
};

export default AttendanceCalculatorModal;
