import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icons';

export default function AdminModerationConfirmDialog({
  open,
  kind = 'reject',
  adTitle,
  busy,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const isReject = kind === 'reject';

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) onCancel?.();
    }
    if (!open) return undefined;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      className="fixed inset-0 z-[130] grid place-items-center bg-slate-900/45 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label={t('adminModeration.confirmCloseAria')}
        className="absolute inset-0"
        disabled={busy}
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={
                'mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ' +
                (isReject ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')
              }
            >
              <Icon name={isReject ? 'close' : 'check'} className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 id="admin-confirm-title" className="text-base font-extrabold text-slate-900">
                {isReject ? t('adminModeration.rejectConfirmTitle') : t('adminModeration.approveConfirmTitle')}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                {isReject ? t('adminModeration.rejectConfirmBody') : t('adminModeration.approveConfirmBody')}
              </p>
            </div>
          </div>
        </div>

        {adTitle ? (
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {t('adminModeration.listingLabel')}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{adTitle}</div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
          <button
            type="button"
            disabled={busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            onClick={onCancel}
          >
            {t('adminModeration.confirmCancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            className={
              'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white transition disabled:opacity-60 ' +
              (isReject ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700')
            }
            onClick={onConfirm}
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {isReject ? t('adminModeration.rejecting') : t('adminModeration.approving')}
              </>
            ) : isReject ? (
              t('adminModeration.rejectConfirmAction')
            ) : (
              t('adminModeration.approveConfirmAction')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
