import type { ReactNode } from 'react';

interface InfoRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight label/value row used in detail panels and overview cards.
 * Renders label in uppercase tracking style on the left, value on the right.
 */
export function InfoRow({ label, children, className = '' }: InfoRowProps) {
  return (
    <div
      className={`flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-2.5 last:border-0 last:pb-0 ${className}`}
    >
      <div className="w-36 text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
        {label}
      </div>
      <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200 min-w-0">
        {children}
      </div>
    </div>
  );
}
