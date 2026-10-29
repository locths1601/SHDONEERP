import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollapsibleCardProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  summaryBadge?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  compact?: boolean;
}

export function CollapsibleCard({
  title,
  icon,
  summaryBadge,
  badge,
  actions,
  children,
  className,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle,
  compact = true,
}: CollapsibleCardProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const nextState = !open;
    if (!isControlled) {
      setInternalIsOpen(nextState);
    }
    onToggle?.(nextState);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs transition-all duration-200 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div
        onClick={handleToggle}
        className={cn(
          'flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3',
          open && 'border-b border-slate-100 dark:border-slate-800/80'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {icon && (
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              {icon}
            </div>
          )}
          <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
            {title}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Summary Badge when collapsed */}
          {!open && summaryBadge && (
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 px-2 py-0.5 rounded-full truncate max-w-[200px]">
              {summaryBadge}
            </div>
          )}

          {actions && (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}

          <div
            className={cn(
              'w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0'
            )}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={compact ? 'p-3.5' : 'p-4'}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
