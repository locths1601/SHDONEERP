import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  GitPullRequestArrow,
  Circle,
  Loader2,
} from 'lucide-react';
import { FitGapBadge, type FitGapCategory } from './FitGapBadge';
import { toast } from 'sonner';

interface FitGapPickerProps {
  itemId: number;
  currentCategory: FitGapCategory;
  onChange: (category: string) => Promise<unknown>;
  size?: 'sm' | 'md';
}

const OPTIONS = [
  { value: 'Fit', label: 'Fit', desc: 'Sẵn sàng đáp ứng', icon: CheckCircle2, tone: 'emerald' },
  { value: 'Gap', label: 'Gap', desc: 'Cần phát triển', icon: AlertTriangle, tone: 'rose' },
  { value: 'ChangeRequest', label: 'CR', desc: 'Có tính phí CR', icon: GitPullRequestArrow, tone: 'blue' },
  { value: 'NotApplicable', label: 'N/A', desc: 'Không áp dụng', icon: Circle, tone: 'slate' },
] as const;

const TONE_CLASSES: Record<string, string> = {
  emerald:
    'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  rose: 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  blue: 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  slate:
    'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
};

export function FitGapPicker({
  itemId,
  currentCategory,
  onChange,
  size = 'md',
}: FitGapPickerProps) {
  const [saving, setSaving] = useState(false);

  async function handleSelect(value: string) {
    if (value === currentCategory) return;
    setSaving(true);
    try {
      await onChange(value);
      toast.success(`Đã phân loại Fit/Gap: ${value}`);
    } catch {
      toast.error('Không thể cập nhật phân loại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Phân loại hiện tại:
        </span>
        <FitGapBadge category={currentCategory} size="sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = currentCategory === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={saving}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${
                active
                  ? `${TONE_CLASSES[opt.tone]} ring-2 ring-offset-1 ring-current`
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
              } ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              {saving && active ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Icon className="h-4 w-4 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}