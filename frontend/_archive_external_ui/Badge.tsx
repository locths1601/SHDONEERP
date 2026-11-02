import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variants = {
    default: 'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700',
    info: 'bg-transparent text-sky-700 border-sky-300 dark:text-sky-300 dark:border-sky-800',
    success: 'bg-transparent text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-transparent text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-transparent text-red-700 border-red-300 dark:text-red-300 dark:border-red-800',
    neutral: 'bg-transparent text-gray-600 border-gray-300 dark:text-slate-400 dark:border-slate-700',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${sizeStyles[size]}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, size = 'md' }: { status?: string; size?: 'sm' | 'md' }) {
  if (!status) return null;

  const normalized = status.trim().toLowerCase();

  if (normalized === 'active') {
    return (
      <Badge variant="success" size={size}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-0.5" />
        {status}
      </Badge>
    );
  }

  if (normalized === 'in progress' || normalized === 'inprogress') {
    return (
      <Badge variant="warning" size={size}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />
        {status}
      </Badge>
    );
  }

  if (normalized === 'completed') {
    return (
      <Badge variant="info" size={size}>
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-0.5" />
        {status}
      </Badge>
    );
  }

  if (normalized === 'draft') {
    return (
      <Badge variant="neutral" size={size}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-0.5" />
        {status}
      </Badge>
    );
  }

  if (normalized === 'deprecated' || normalized === 'suspended') {
    return (
      <Badge variant="danger" size={size}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-0.5" />
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant="default" size={size}>
      {status}
    </Badge>
  );
}

export function ImpactBadge({ level, size = 'md' }: { level?: string; size?: 'sm' | 'md' }) {
  if (!level) return null;

  const normalized = level.trim().toLowerCase();

  let colorClass = 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

  if (normalized === 'critical') {
    colorClass = 'bg-transparent text-red-700 border-red-300 dark:text-red-300 dark:border-red-800';
  } else if (normalized === 'high') {
    colorClass = 'bg-transparent text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-800';
  } else if (normalized === 'medium') {
    colorClass = 'bg-transparent text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-800';
  } else if (normalized === 'low') {
    colorClass = 'bg-transparent text-slate-600 border-slate-300 dark:text-slate-400 dark:border-slate-700';
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded border ${sizeStyles[size]} ${colorClass}`}>
      {level}
    </span>
  );
}
