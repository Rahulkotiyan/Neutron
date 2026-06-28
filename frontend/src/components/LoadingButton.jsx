import React from "react";
import { Clock } from "iconoir-react";

const LoadingButton = ({ onClick, disabled, loading, loadingText, icon: Icon, children, className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-lg transition-all active:scale-95 min-h-[44px] disabled:opacity-50 ${className}`}
  >
    {loading ? (
      <><Clock size={16} className="animate-spin" />{loadingText}</>
    ) : (
      <>{Icon && <Icon size={16} />}{children}</>
    )}
  </button>
);

export default LoadingButton;
