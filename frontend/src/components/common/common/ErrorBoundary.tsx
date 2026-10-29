import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Friendly title for the error UI. */
  title?: string;
  /** Optional fallback component override. */
  fallback?: (err: Error, reset: () => void) => React.ReactNode;
  /** Optional error callback for Sentry / logging. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** Optional resetKeys — when changed, the boundary resets. */
  resetKeys?: ReadonlyArray<unknown>;
  /** Hide the home button in the fallback. */
  hideHomeButton?: boolean;
  /** Scope label for the error message (e.g. "Survey", "Customer Portal"). */
  scope?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic React error boundary.
 *
 * Catches render-phase exceptions in the wrapped subtree and renders a
 * recovery UI instead of crashing the whole app. Use this around
 * top-level routes and around risky sections (rich-text editors,
 * 3rd-party grids, etc.).
 *
 * Usage:
 *   <ErrorBoundary scope="Survey"><ProjectSurveyDetailPage /></ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.scope ?? 'app', error, info);
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys !== this.props.resetKeys &&
      !this.areKeysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  private areKeysEqual(a: ReadonlyArray<unknown>, b: ReadonlyArray<unknown>) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }
    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return (
      <DefaultErrorFallback
        error={this.state.error}
        title={this.props.title}
        scope={this.props.scope}
        hideHomeButton={this.props.hideHomeButton}
        onReset={this.reset}
      />
    );
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  title?: string;
  scope?: string;
  hideHomeButton?: boolean;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  title,
  scope,
  hideHomeButton,
  onReset,
}: DefaultErrorFallbackProps) {
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 p-8 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {title ?? 'Đã xảy ra lỗi khi hiển thị'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {scope ? (
              <>Phần <strong>{scope}</strong> gặp sự cố. Bạn có thể thử lại hoặc quay về trang chính.</>
            ) : (
              <>Đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ admin nếu lỗi tiếp diễn.</>
            )}
          </p>
        </div>

        {isDev && (
          <details className="text-left rounded-lg bg-white/70 dark:bg-slate-900/70 border border-rose-200 dark:border-rose-900/60 p-3">
            <summary className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300 cursor-pointer flex items-center gap-1.5">
              <Bug className="h-3 w-3" /> Chi tiết lỗi (chỉ Dev)
            </summary>
            <pre className="mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
              {error.name}: {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button onClick={onReset} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Thử lại
          </Button>
          {!hideHomeButton && (
            <Button
              variant="secondary"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
            >
              <Home className="h-4 w-4 mr-1.5" />
              Về trang chính
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
