import React from 'react';
import { getStatusMeta } from '../utils/statusUtils';

export const StatusBadge = ({ status, size = "md", showIcon = true, className = "" }) => {
  const meta = getStatusMeta(status);
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm font-extrabold"
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border transition-all duration-200 ${meta.colorClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {showIcon && meta.icon(iconSizes[size] || 14)}
      <span className="capitalize">{meta.label}</span>
    </span>
  );
};
