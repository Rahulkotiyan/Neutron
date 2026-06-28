import React from "react";
import { Check } from "iconoir-react";
import ModalShell, { ModalHeader, ModalFooter, ModalBody } from "./ModalShell";
import FormField from "./FormField";
import LoadingButton from "./LoadingButton";

const inputClass =
  "w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-zinc-600";

const MarkAttendanceModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  subjects,
  selectedSubject,
  onSubjectChange,
  attendanceForm,
  onFormChange,
}) => {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="sm">
      <div className="max-h-[90vh] flex flex-col">
        <ModalHeader
          title="Mark Attendance"
          subtitle={
            selectedSubject
              ? `For ${selectedSubject.subjectName}`
              : "Select a subject and mark attendance"
          }
          onClose={onClose}
        />

        <ModalBody scrollable>
          <FormField label="Subject">
            <select
              value={selectedSubject?.subjectCode || ""}
              onChange={(e) => {
                const subject = subjects.find((s) => s.subjectCode === e.target.value);
                onSubjectChange(subject);
              }}
              className={inputClass}
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.subjectCode} value={subject.subjectCode}>
                  {subject.subjectName} ({subject.subjectCode})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Date">
            <input
              type="date"
              value={attendanceForm.date}
              onChange={(e) => onFormChange("date", e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Time Slot">
            <input
              type="text"
              placeholder="e.g., 09:00-10:00"
              value={attendanceForm.timeSlot}
              onChange={(e) => onFormChange("timeSlot", e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField label="Status">
            <div className="grid grid-cols-2 gap-3">
              {["PRESENT", "ABSENT"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onFormChange("status", status)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all active:scale-95 min-h-[44px] ${
                    attendanceForm.status === status
                      ? "bg-zinc-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Notes (Optional)">
            <textarea
              placeholder="Add any notes..."
              value={attendanceForm.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
              className={`${inputClass} h-20 resize-none`}
            />
          </FormField>
        </ModalBody>

        <ModalFooter className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95 min-h-[44px]"
          >
            Cancel
          </button>
          <LoadingButton
            onClick={onSubmit}
            disabled={!selectedSubject}
            loading={loading}
            loadingText="Marking..."
            icon={Check}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            Mark Attendance
          </LoadingButton>
        </ModalFooter>
      </div>
    </ModalShell>
  );
};

export default MarkAttendanceModal;
