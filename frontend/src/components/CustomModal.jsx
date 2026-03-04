import React from 'react';
import { X, CheckCircle, InfoCircle, WarningTriangle, QuestionMark } from 'iconoir-react';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
  onConfirm, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel' 
}) => {
  if (!isOpen) return null;

  const icons = {
    info: <InfoCircle className="w-8 h-8 text-blue-400" />,
    success: <CheckCircle className="w-8 h-8 text-green-400" />,
    warning: <WarningTriangle className="w-8 h-8 text-amber-400" />,
    error: <WarningTriangle className="w-8 h-8 text-red-400" />,
    confirm: <QuestionMark className="w-8 h-8 text-purple-400" />,
  };

  const colors = {
    info: 'border-blue-500/20 bg-blue-500/5',
    success: 'border-green-500/20 bg-green-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    error: 'border-red-500/20 bg-red-500/5',
    confirm: 'border-purple-500/20 bg-purple-500/5',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md bg-zinc-950 border ${colors[type]} rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`mb-6 p-4 rounded-2xl ${colors[type]} border border-white/5`}>
            {icons[type]}
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
            {title}
          </h3>
          
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex w-full gap-3">
            {type === 'confirm' || type === 'warning' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold transition-all border border-white/5"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  {confirmText}
                </button>
              </>
            ) : type === 'error' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white hover:bg-zinc-100 text-black rounded-xl font-semibold transition-all border border-zinc-200"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold transition-all border border-white/5"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
