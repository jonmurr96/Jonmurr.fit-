import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'draft';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  
  const statusConfig = {
    active: {
      label: 'Active',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30'
    },
    inactive: {
      label: 'Inactive',
      bgColor: 'bg-zinc-700/50',
      textColor: 'text-zinc-400',
      borderColor: 'border-zinc-600/30'
    },
    draft: {
      label: 'Draft',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30'
    }
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${sizeClasses} ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.label}
    </span>
  );
};
