import { useEffect } from 'react';
import { Icon } from './Icons';

export default function AdminToast({ message, tone = 'success', onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => onDismiss?.(), 4200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const isSuccess = tone === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[140] w-[min(92vw,28rem)] -translate-x-1/2"
    >
      <div
        className={
          'flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg backdrop-blur-md ' +
          (isSuccess
            ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
            : 'border-red-200 bg-red-50/95 text-red-800')
        }
      >
        <span
          className={
            'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ' +
            (isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')
          }
        >
          <Icon name={isSuccess ? 'check' : 'close'} className="h-4 w-4" />
        </span>
        <p className="flex-1 text-sm font-semibold leading-snug">{message}</p>
        <button
          type="button"
          aria-label="Dismiss"
          className="rounded-lg p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
          onClick={onDismiss}
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
