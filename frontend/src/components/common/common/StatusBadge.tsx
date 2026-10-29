import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusStyle {
  text: string;
  dot: string;
}

const catalogStatuses: Record<string, StatusStyle> = {
  Draft: {
    text: 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  Active: {
    text: 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  'In Progress': {
    text: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  InProgress: {
    text: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  Completed: {
    text: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  'On Hold': {
    text: 'text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  Deprecated: {
    text: 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900',
    dot: 'bg-rose-500',
  },
};

const scrumStatuses: Record<string, StatusStyle> = {
  Todo: {
    text: 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  InProgress: {
    text: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  'In Progress': {
    text: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  InReview: {
    text: 'text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  Blocked: {
    text: 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  Done: {
    text: 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  Closed: {
    text: 'text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

const issueTypes: Record<string, StatusStyle> = {
  Story: {
    text: 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  Task: {
    text: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  Bug: {
    text: 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  Epic: {
    text: 'text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  SubTask: {
    text: 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
};

const priorities: Record<string, StatusStyle> = {
  Lowest: {
    text: 'text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  Low: {
    text: 'text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  Medium: {
    text: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  High: {
    text: 'text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  Highest: {
    text: 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  Critical: {
    text: 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

const maps = {
  catalog: catalogStatuses,
  scrum: scrumStatuses,
  type: issueTypes,
  priority: priorities,
};

function getStatusStyle(status: string, kind: keyof typeof maps = 'catalog'): StatusStyle {
  const map = maps[kind] || catalogStatuses;
  if (map[status]) return map[status];

  // Smart heuristic based on text content
  const norm = (status || '').toLowerCase().trim();
  if (
    norm.includes('active') ||
    norm.includes('done') ||
    norm.includes('thống nhất') ||
    norm.includes('xác nhận') ||
    norm.includes('hoàn thành')
  ) {
    return {
      text: 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    };
  }
  if (
    norm.includes('progress') ||
    norm.includes('đang') ||
    norm.includes('medium') ||
    norm.includes('trung bình') ||
    norm.includes('chờ')
  ) {
    return {
      text: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500',
    };
  }
  if (
    norm.includes('completed') ||
    norm.includes('task') ||
    norm.includes('low') ||
    norm.includes('thấp') ||
    norm.includes('gửi')
  ) {
    return {
      text: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500',
    };
  }
  if (
    norm.includes('bug') ||
    norm.includes('critical') ||
    norm.includes('high') ||
    norm.includes('cao') ||
    norm.includes('deprecated') ||
    norm.includes('blocked') ||
    norm.includes('huỷ') ||
    norm.includes('gap')
  ) {
    return {
      text: 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-900',
      dot: 'bg-rose-500',
    };
  }
  if (norm.includes('epic') || norm.includes('review')) {
    return {
      text: 'text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800',
      dot: 'bg-purple-500',
    };
  }

  return {
    text: 'text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-400',
  };
}

export function StatusBadge({
  status,
  label,
  kind = 'catalog',
  size = 'md',
  className,
}: {
  status: string;
  label?: string;
  kind?: keyof typeof maps;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const style = getStatusStyle(status, kind);
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-transparent font-medium whitespace-nowrap inline-flex items-center gap-1.5 rounded-md border',
        sizeClass,
        style.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} />
      <span>{label ?? status}</span>
    </Badge>
  );
}
