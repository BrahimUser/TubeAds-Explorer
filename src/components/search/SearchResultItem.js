import { categoryLabel, cityLabel } from '../../services/categories';
import { Icon } from '../Icons';

function formatPriceCompact(priceCents, currency = 'MAD') {
  if (typeof priceCents !== 'number' || Number.isNaN(priceCents)) return '—';
  const amount = Math.round(priceCents / 100).toLocaleString('fr-FR');
  return currency === 'MAD' ? `${amount} MAD` : `${amount} ${currency}`;
}

export default function SearchResultItem({ item, active, id, onSelect }) {
  const meta = [categoryLabel(item.category), cityLabel(item.city)].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={active}
      onClick={() => onSelect?.(item)}
      className={
        'flex w-full items-center gap-3 rounded-xl p-2 text-left transition ' +
        (active ? 'bg-brand-50' : 'hover:bg-slate-50')
      }
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-100">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
            —
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">
          {item.title || '—'}
        </span>
        <span className="mt-0.5 block text-xs font-bold text-brand-500">
          {formatPriceCompact(item.priceCents, item.currency)}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[11px] text-slate-500">{meta}</span>
        ) : null}
      </span>
      <Icon name="chevronDown" className="-rotate-90 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
    </button>
  );
}
