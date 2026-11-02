import { useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/common/Button';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { cn } from '@/lib/utils';
import {
  TourDefinition,
  TourStepDots,
  OnboardingStep,
  validateTour,
} from './types';

export interface OnboardingTourModalProps {
  tour: TourDefinition;
  /**
   * Nếu true → modal auto-open lần đầu vào trang (khi user chưa complete tour).
   * Mặc định false (chỉ mở qua FAB hoặc programmatic trigger).
   */
  autoStartFirstTime?: boolean;
  /**
   * Callback khi user hoàn tất tour cuối cùng (bấm nút "Hoàn tất").
   */
  onCompleted?: () => void;
  /**
   * Callback khi user đóng tour giữa chừng (bấm "Bỏ qua" hoặc X).
   */
  onSkipped?: () => void;
}

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const TRANSITION = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

/**
 * Onboarding tour modal với slide animation, step indicator dots, focus trap,
 * keyboard navigation (← → Esc) và tùy chọn highlight target element.
 *
 * Tour KHÔNG lưu "đã xem" auto-quiet: user luôn có thể mở lại qua FAB.
 * Force-reset có thể qua DevTools bằng cách xóa key 'ezhr-onboarding-state'
 * trong localStorage.
 */
export function OnboardingTourModal({
  tour,
  autoStartFirstTime = false,
  onCompleted,
  onSkipped,
}: OnboardingTourModalProps) {
  // Validate ngay khi mount (dev warning nếu có lỗi)
  useEffect(() => {
    try {
      validateTour(tour);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[OnboardingTour]', err);
    }
  }, [tour]);

  const {
    activeTourId,
    currentStep,
    completedTours,
    startTour,
    closeTour,
    nextStep,
    prevStep,
    goToStep,
    completeTour,
  } = useOnboardingStore();

  const directionRef = useRef<number>(1);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const open = activeTourId === tour.id;

  const step: OnboardingStep | undefined = useMemo(
    () => tour.steps[currentStep - 1],
    [tour.steps, currentStep]
  );

  // Auto-start logic
  useEffect(() => {
    if (!autoStartFirstTime) return;
    if (open) return;
    const hasCompleted = completedTours[tour.id];
    if (!hasCompleted && activeTourId === null) {
      startTour(tour.id);
    }
  }, [autoStartFirstTime, completedTours, tour.id, open, activeTourId, startTour]);

  // Keyboard navigation: ArrowRight/ArrowLeft/Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStep]);

  // Focus trap — khi mở, focus vào nút primary trong modal
  useEffect(() => {
    if (open && modalRef.current) {
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [open, currentStep]);

  // Khi mở tour lần đầu sau khi localStorage reset, set step = 1
  useEffect(() => {
    if (open && currentStep > tour.steps.length) {
      goToStep(1);
    }
  }, [open, currentStep, tour.steps.length, goToStep]);

  const handleNext = useCallback(() => {
    directionRef.current = 1;
    if (!step) return;
    if (currentStep >= tour.steps.length) {
      // Bấm "Hoàn tất" ở step cuối
      completeTour(tour.id);
      onCompleted?.();
    } else {
      nextStep();
    }
  }, [step, currentStep, tour.steps.length, tour.id, completeTour, nextStep, onCompleted]);

  const handlePrev = useCallback(() => {
    directionRef.current = -1;
    prevStep();
  }, [prevStep]);

  const handleSkip = useCallback(() => {
    closeTour();
    onSkipped?.();
  }, [closeTour, onSkipped]);

  if (!open || !step) return null;

  const isFirst = currentStep === 1;
  const isLast = currentStep === tour.steps.length;
  const skippable = tour.skippable !== false; // mặc định cho phép skip

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`onboarding-${tour.id}-title`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop với blur nhẹ */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"
        onClick={handleSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      />

      {/* Modal card */}
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={TRANSITION}
        className={cn(
          'relative z-10 w-full max-w-xl rounded-2xl shadow-2xl',
          'bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-800',
          'flex flex-col overflow-hidden'
        )}
      >
        {/* Header — gradient + icon + close */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm"
              aria-hidden="true"
            >
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/80">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {tour.title} · Step {currentStep}/{tour.steps.length}
              </div>
              <h2
                id={`onboarding-${tour.id}-title`}
                className="text-lg font-bold leading-tight"
              >
                {step.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Đóng hướng dẫn"
              className="-mr-2 -mt-2 flex h-9 w-9 flex-none items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body — slide content */}
        <div className="relative min-h-[180px] overflow-hidden px-6 py-5">
          <AnimatePresence custom={directionRef.current} mode="wait">
            <motion.div
              key={step.index}
              custom={directionRef.current}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className="space-y-3"
            >
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {step.description}
              </p>
              {step.actionHint && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                  <span className="font-semibold">💡 Thử ngay: </span>
                  {step.actionHint}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          {/* Step dots */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <TourStepDots
              total={tour.steps.length}
              current={currentStep}
              onDotClick={goToStep}
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentStep}/{tour.steps.length}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {skippable && !isLast && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  aria-label="Bỏ qua hướng dẫn"
                >
                  Bỏ qua
                </Button>
              )}
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                  aria-label="Quay lại step trước"
                >
                  Quay lại
                </Button>
              )}
            </div>
            <Button
              variant={isLast ? 'default' : 'default'}
              size="sm"
              onClick={handleNext}
              rightIcon={
                isLast ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              }
              aria-label={
                isLast
                  ? 'Hoàn tất hướng dẫn'
                  : 'Tiếp theo'
              }
              className={cn(
                isLast &&
                  'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
              )}
            >
              {isLast ? 'Hoàn tất' : 'Tiếp theo'}
            </Button>
          </div>

          {/* Hint cuối */}
          {isLast && (
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              <RotateCcw className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Bạn luôn có thể mở lại hướng dẫn qua biểu tượng{' '}
              <span className="font-semibold">?</span> ở góc phải-dưới.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
