/**
 * “Populaires en ce moment” — compact thumbnail rows.
 */
import { useMemo } from 'react';
import { Icon } from '../Icons';

function tsMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

function formatPriceCompact(priceCents, currency = 'MAD') {
  if (typeof priceCents !== 'number' || Number.isNaN(priceCents)) return '—';
  const amount = Math.round(priceCents / 100).toLocaleString('fr-FR');
  return currency === 'MAD' ? `${amount} MAD` : `${amount} ${currency}`;
}

export default function PopularNowSidebar({ ads, onPlay, onViewAll }) {
  const items = useMemo(() => {
    const sorted = [...ads].sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
    return sorted.slice(0, 4);
  }, [ads]);

  if (items.length === 0) return null;

  return (
    <aside className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.045)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="tag" className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-extrabold tracking-tight text-slate-900">Populaires en ce moment</h3>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={() => onViewAll()}
            className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Voir tout
          </button>
        )}
      </div>
      <ul className="space-y-0.5">
        {items.map((ad) => (
          <li key={ad.id}>
            <button
              type="button"
              onClick={() => onPlay?.(ad)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-100">
                {ad.thumbnailUrl ? (
                  <img src={ad.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                    —
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 py-0.5">
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">
                  {ad.title || 'Sans titre'}
                </span>
                <span className="mt-0.5 block text-xs font-bold text-brand-500">
                  {formatPriceCompact(ad.priceCents, ad.currency)}
                </span>
              </span>
              <Icon name="chevronDown" className="-rotate-90 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
