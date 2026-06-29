import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icons';

function toTelHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('212')) return `tel:+${digits}`;
  if (digits.startsWith('0')) return `tel:+212${digits.slice(1)}`;
  return `tel:+212${digits}`;
}

/**
 * Safety confirmation before calling a seller.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.phoneNumber
 * @param {() => void} props.onClose
 */
export default function CallSellerModal({ open, phoneNumber, onClose }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const telHref = toTelHref(phoneNumber);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (!open) return undefined;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-seller-modal-title"
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label={t('common.close')}
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-amber-100 bg-white shadow-2xl sm:rounded-3xl">
        <div className="shrink-0 border-b border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/60 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
              <Icon name="alertTriangle" className="h-6 w-6" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 id="call-seller-modal-title" className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                {t('product.callSellerModalTitle')}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{t('product.callSellerModalSubtitle')}</p>
            </div>
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={onClose}
              className="ms-auto grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white/80 hover:text-slate-800"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div
            dir={isRtl ? 'rtl' : undefined}
            className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-4"
          >
            <p className="text-sm font-semibold leading-relaxed text-amber-950">{t('product.callSellerWarning')}</p>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {t('product.callSellerPhoneLabel')}
          </p>
          <p className="mt-1 text-center text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums" dir="ltr">
            {phoneNumber}
          </p>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            {telHref ? (
              <a
                href={telHref}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99]"
              >
                <Icon name="phone" className="h-5 w-5 shrink-0" />
                {t('product.callSellerCallNow')}
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
