import React from "react";
import { Plus } from "iconoir-react";
import ModalShell, { ModalHeader, ModalFooter, ModalBody } from "./ModalShell";
import FormField from "./FormField";
import LoadingButton from "./LoadingButton";

const inputClass =
  "w-full bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-lg px-4 py-3 outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all placeholder:text-zinc-600";

const AddSubjectModal = ({
  isOpen,
  onClose,
  onAdd,
  loading,
  subjectCode,
  subjectName,
  onSubjectCodeChange,
  onSubjectNameChange,
}) => (
  <ModalShell isOpen={isOpen} onClose={onClose} size="sm">
    <ModalHeader title="Add Subject" subtitle="Add a subject to track attendance" onClose={onClose} />
    <ModalBody>
      <FormField label="Subject Code">
        <input
          type="text"
          placeholder="e.g., CS201"
          value={subjectCode}
          onChange={(e) => onSubjectCodeChange(e.target.value)}
          className={inputClass}
        />
      </FormField>
      <FormField label="Subject Name">
        <input
          type="text"
          placeholder="e.g., Data Structures"
          value={subjectName}
          onChange={(e) => onSubjectNameChange(e.target.value)}
          className={inputClass}
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
        onClick={onAdd}
        disabled={loading}
        loading={loading}
        loadingText="Adding..."
        icon={Plus}
        className="bg-zinc-700 hover:bg-zinc-600 shadow-lg"
      >
        Add Subject
      </LoadingButton>
    </ModalFooter>
  </ModalShell>
);

export default AddSubjectModal;
