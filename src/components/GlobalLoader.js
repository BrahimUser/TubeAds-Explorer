import { useTranslation } from 'react-i18next';

export default function GlobalLoader({ visible }) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/25 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t('common.processing')}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-8 py-7 shadow-card">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-500"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-700">{t('common.processing')}</p>
      </div>
    </div>
  );
}
