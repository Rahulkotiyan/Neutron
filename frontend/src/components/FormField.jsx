import React from "react";

const FormField = ({ label, children, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-bold text-white mb-2 tracking-tight">{label}</label>
    {children}
  </div>
);

export default FormField;
