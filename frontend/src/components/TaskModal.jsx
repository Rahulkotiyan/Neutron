import React from "react";
import ModalShell, { ModalHeader, ModalBody, ModalFooter } from "./ModalShell";
import FormField from "./FormField";
import LoadingButton from "./LoadingButton";
import { Plus, Check } from "iconoir-react";

const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  isEditing,
  details,
  startTime,
  examDate,
  onDetailsChange,
  onTimeChange,
  onDateChange,
}) => (
  <ModalShell isOpen={isOpen} onClose={onClose} size="2xl">
    <div className="max-h-[90vh] flex flex-col overflow-y-auto">
      <ModalHeader
        title={isEditing ? "Edit Task" : "Add Task"}
        subtitle={isEditing ? "Update your task details" : "Create a new task or reminder"}
        onClose={onClose}
      />
      <ModalBody scrollable={false}>
        <FormField label="Task Details">
          <textarea
            placeholder="Enter your task details..."
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all placeholder:text-zinc-600 h-32 resize-none"
          />
        </FormField>
        <FormField label="Time (Optional)">
          <input
            type="time"
            value={startTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all placeholder:text-zinc-600"
          />
        </FormField>
        <FormField label="Date (Optional)">
          <input
            type="date"
            value={examDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-zinc-500/50 focus:ring-1 focus:ring-zinc-500/30 transition-all placeholder:text-zinc-600"
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
        {isEditing ? (
          <LoadingButton
            onClick={onSubmit}
            disabled={loading}
            loading={loading}
            loadingText="Updating..."
            icon={Check}
            className="bg-zinc-700 hover:bg-zinc-600 text-white shadow-lg"
          >
            Update Task
          </LoadingButton>
        ) : (
          <LoadingButton
            onClick={onSubmit}
            disabled={loading}
            loading={loading}
            loadingText="Creating..."
            icon={Plus}
            className="bg-white hover:bg-gray-50 text-black border border-gray-200"
          >
            Add Task
          </LoadingButton>
        )}
      </ModalFooter>
    </div>
  </ModalShell>
);

export default TaskModal;
