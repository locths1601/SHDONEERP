import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  compact?: boolean;
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  hover = false,
  compact = false,
  ...props
}: CardProps) {
  const hasHeader = Boolean(title || description || actions);
  const hasChildren = Boolean(children);

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm transition-all duration-200',
        compact ? 'p-4' : 'p-5',
        hover && 'hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-sky-500/50 hover:shadow-md dark:hover:shadow-sky-500/5',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex items-start justify-between',
            hasChildren && 'pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/60'
          )}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
