import { CheckCircle2, AlertTriangle, GitPullRequestArrow, Circle } from 'lucide-react';

export type FitGapCategory =
  | 'Fit'
  | 'Gap'
  | 'ChangeRequest'
  | 'NotApplicable'
  | string
  | null
  | undefined;

interface FitGapBadgeProps {
  category: FitGapCategory;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const META: Record<
  string,
  { label: string; icon: typeof CheckCircle2; classes: string }
> = {
  Fit: {
    label: 'Fit',
    icon: CheckCircle2,
    classes:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
  },
  Gap: {
    label: 'Gap',
    icon: AlertTriangle,
    classes:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60',
  },
  ChangeRequest: {
    label: 'CR',
    icon: GitPullRequestArrow,
    classes:
      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60',
  },
  NotApplicable: {
    label: 'N/A',
    icon: Circle,
    classes:
      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
};

const SIZE_CLASSES = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function FitGapBadge({
  category,
  size = 'sm',
  showIcon = true,
  showLabel = true,
  className = '',
}: FitGapBadgeProps) {
  if (!category) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 font-semibold ${SIZE_CLASSES[size]} ${className}`}
      >
        {showIcon && <Circle className="h-2.5 w-2.5" />}
        {showLabel && <span>Chưa phân loại</span>}
      </span>
    );
  }

  const meta = META[category] || {
    label: category,
    icon: Circle,
    classes:
      'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-bold ${meta.classes} ${SIZE_CLASSES[size]} ${className}`}
      title={`Phân loại Fit/Gap: ${meta.label}`}
    >
      {showIcon && <Icon className="h-2.5 w-2.5" />}
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}