import React from 'react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  iconBg,
  color = 'blue',
  onClick,
  compact = true,
  className,
  isZeroMuted,
  isWarning,
  badgeText,
}: {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  iconBg?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  onClick?: () => void;
  compact?: boolean;
  className?: string;
  isZeroMuted?: boolean;
  isWarning?: boolean;
  badgeText?: string;
}) {
  const colorMap = {
    blue: 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400',
    green: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    orange: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    red: 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    gray: 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500',
  };

  const isMuted = color === 'gray' || isZeroMuted;
  const isAlert = color === 'red' || isWarning;
  const badgeColor = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border transition-all duration-200',
        isMuted
          ? 'border-slate-200/70 dark:border-slate-800/70 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
          : isAlert
          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-2xs hover:border-rose-500/60 ring-1 ring-rose-500/15'
          : color === 'orange'
          ? 'border-amber-200/90 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs hover:border-amber-500/50'
          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs hover:border-blue-500/40 hover:shadow-xs',
        compact ? 'py-1.5 px-2.5 sm:py-2 sm:px-3' : 'p-3.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              title={label}
              className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground truncate"
            >
              {label}
            </p>
            {badgeText && (
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                {badgeText}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p
              className={cn(
                'tracking-tight tabular-nums',
                compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl',
                isMuted
                  ? 'text-slate-400 dark:text-slate-500 font-bold'
                  : isAlert
                  ? 'text-rose-600 dark:text-rose-400 font-black'
                  : color === 'orange'
                  ? 'text-amber-600 dark:text-amber-400 font-black'
                  : 'text-foreground font-black'
              )}
            >
              {value}
            </p>
            {change !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-semibold inline-flex items-center px-1.5 py-0.2 rounded-full',
                  change >= 0
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                )}
              >
                {change >= 0 ? '↑' : '↓'}{Math.abs(change)}%
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div
            className={cn(
              compact
                ? 'p-1 rounded-md shrink-0 transition-all duration-200 group-hover:scale-105'
                : 'p-1.5 rounded-md shrink-0 transition-all duration-200 group-hover:scale-105',
              badgeColor
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
