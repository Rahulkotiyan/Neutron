import React from "react";
import { WarningTriangle, Trash, Check } from "iconoir-react";
import ModalShell, { ModalHeader, ModalFooter } from "./ModalShell";
import LoadingButton from "./LoadingButton";

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  itemName,
  details,
  successMessage,
}) => {
  const icon = (
    <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
      <WarningTriangle size={24} className="text-red-400" />
    </div>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="sm">
      <div>
        <ModalHeader
          title={title}
          subtitle="This action cannot be undone"
          onClose={onClose}
          gradient={true}
        />
      </div>
      <div className="p-6 md:p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            {icon}
            <p className="text-sm text-red-300 pt-1">
              Are you sure you want to delete <strong>{itemName}</strong>? All associated data will be permanently deleted.
            </p>
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="space-y-3 text-sm text-zinc-400">
            <p>This will delete:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              {details.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center">
                <Check size={12} className="text-green-400" />
              </div>
              <p className="text-sm text-green-300 font-medium">{successMessage}</p>
            </div>
          </div>
        )}
      </div>
      <div>
        <ModalFooter className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95 min-h-[44px]"
          >
            Cancel
          </button>
          <LoadingButton
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            loadingText="Deleting..."
            icon={Trash}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-900/30"
          >
            Delete
          </LoadingButton>
        </ModalFooter>
      </div>
    </ModalShell>
  );
};

export default DeleteConfirmModal;
