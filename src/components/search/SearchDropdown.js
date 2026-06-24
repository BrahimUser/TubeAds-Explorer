import { useTranslation } from 'react-i18next';
import { mapApiError } from '../../api/client';
import SearchResultItem from './SearchResultItem';

export default function SearchDropdown({
  open,
  query,
  items,
  isLoading,
  error,
  activeIndex,
  listboxId,
  onSelect,
  onRetry,
}) {
  const { t } = useTranslation();

  if (!open || !query || query.length < 3) return null;

  return (
    <div
      className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
      role="presentation"
    >
      {isLoading ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
          {t('navbar.searchDropdown.loading')}
        </div>
      ) : error ? (
        <div className="px-4 py-3">
          <p className="text-sm text-red-600">{t('navbar.searchDropdown.error')}</p>
          <p className="mt-1 text-xs text-slate-500">{mapApiError(error)}</p>
          <button
            type="button"
            onClick={() => onRetry?.()}
            className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {t('navbar.searchDropdown.retry')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500">
          {t('navbar.searchDropdown.empty', { query })}
        </p>
      ) : (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('navbar.searchDropdown.resultsAria', { count: items.length })}
          className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5"
        >
          {items.map((item, index) => (
            <li key={item.id} role="presentation">
              <SearchResultItem
                item={item}
                active={index === activeIndex}
                id={`${listboxId}-option-${index}`}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
