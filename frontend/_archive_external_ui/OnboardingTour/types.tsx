import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  /** Step 1-based index. */
  index: number;
  /** Icon hiển thị trên header card — emoji hoặc lucide-react component. */
  icon: ReactNode;
  /** Tiêu đề ngắn (≤ 6 từ). */
  title: string;
  /** Mô tả chi tiết (Markdown-friendly nhưng render text thường). */
  description: ReactNode;
  /** Gợi ý hành động cụ thể (vd: "Bấm 'Thêm' để tạo ticket mới"). */
  actionHint?: string;
  /** Optional: selector CSS để highlight phần tử UI khi đang ở step này. */
  targetSelector?: string;
  /** Optional: vị trí popover so với target. */
  popoverPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface TourDefinition {
  /** ID duy nhất của tour, dùng làm key lưu localStorage. */
  id: string;
  /** Tiêu đề tổng của tour (vd: "Hướng dẫn sử Danh sách Ticket"). */
  title: string;
  /** Mô tả ngắn khi tour popover xuất hiện lần đầu. */
  intro: string;
  /** Danh sách các step. */
  steps: OnboardingStep[];
  /** Có cho phép user đóng giữa chừng hay bắt buộc đi hết. */
  skippable?: boolean;
}

/**
 * Step indicator dots — hiển thị current / passed / future.
 */
export function TourStepDots({
  total,
  current,
  onDotClick,
}: {
  total: number;
  current: number;
  onDotClick?: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Tour steps">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const passed = step < current;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onDotClick?.(step)}
            aria-label={`Step ${step}`}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              active && 'w-6 bg-blue-600 dark:bg-blue-500',
              passed && 'w-3 bg-blue-300 dark:bg-blue-700',
              !active && !passed && 'w-3 bg-slate-200 dark:bg-slate-700',
              onDotClick && 'cursor-pointer hover:opacity-80'
            )}
          >
            <span className="sr-only">Step {step}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Sanity-check cơ bản để giúp dev bắt lỗi sớm khi định nghĩa tour.
 * Throw error nếu step index không đúng format 1-based sequence.
 */
export function validateTour(tour: TourDefinition): void {
  if (!tour.id || !tour.id.trim()) {
    throw new Error('TourDefinition.id không được rỗng.');
  }
  if (!tour.steps || tour.steps.length === 0) {
    throw new Error(`Tour "${tour.id}" phải có ít nhất 1 step.`);
  }
  tour.steps.forEach((s, idx) => {
    if (s.index !== idx + 1) {
      throw new Error(
        `Tour "${tour.id}" step[${idx}].index phải bằng ${idx + 1}, nhận ${s.index}.`
      );
    }
  });
}
