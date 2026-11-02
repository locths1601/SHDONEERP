import { motion } from 'framer-motion';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { cn } from '@/lib/utils';

export interface OnboardingFabProps {
  /** ID của tour muốn mở khi FAB click. */
  tourId: string;
  /** Tooltip text khi hover. */
  tooltip?: string;
  /** Position. Mặc định 'bottom-right'. */
  position?: 'bottom-right' | 'bottom-left';
}

/**
 * Floating Action Button (FAB) kích hoạt Onboarding Tour.
 *
 * - Vị trí cố định (fixed) ở góc màn hình, z-50.
 * - Pulse halo liên tục (animate-ping) khi user chưa xem tour.
 * - Tooltip giải thích khi hover.
 * - Ẩn khi tour đang active.
 * - Có thể reset (bỏ cờ đã xem) bằng cách giữ Shift khi click.
 */
export function OnboardingFab({
  tourId,
  tooltip = 'Xem hướng dẫn sử dụng',
  position = 'bottom-right',
}: OnboardingFabProps) {
  const { activeTourId, startTour, resetTour, shouldShowFab, hasCompletedTour } =
    useOnboardingStore();

  const isActive = activeTourId === tourId;
  if (isActive) return null;

  const showHalo = shouldShowFab(tourId);

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+Click: reset tour (debug/dev)
      resetTour(tourId);
      return;
    }
    startTour(tourId);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'fixed z-50',
            position === 'bottom-right' && 'bottom-6 right-6',
            position === 'bottom-left' && 'bottom-6 left-6'
          )}
        >
          {/* Pulse halo (chỉ khi user chưa xem tour) */}
          {showHalo && (
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-30"
            />
          )}

          <Button
            type="button"
            onClick={handleClick}
            aria-label={tooltip}
            data-testid={`onboarding-fab-${tourId}`}
            className={cn(
              'relative h-14 w-14 rounded-full shadow-lg transition-transform',
              'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
              'hover:scale-110 hover:from-blue-600 hover:to-indigo-700',
              'active:scale-95',
              'focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300'
            )}
          >
            {hasCompletedTour(tourId) ? (
              <RotateCcw className="h-6 w-6" aria-hidden="true" />
            ) : (
              <HelpCircle className="h-6 w-6" aria-hidden="true" />
            )}

            {/* Badge "TIP" nếu chưa xem */}
            {showHalo && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-amber-950 shadow"
                aria-hidden="true"
              >
                TIP
              </span>
            )}
          </Button>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p className="font-medium">{tooltip}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Shift + Click để reset tour
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
