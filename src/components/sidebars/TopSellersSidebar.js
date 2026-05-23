/**
 * “Top vendeurs” — avatars, verified badge, star ratings (deterministic when no reviews in DB).
 */
import { useMemo } from 'react';
import { Icon } from '../Icons';
import { ratingMeta } from '../../utils/sellerRating';

function VerifiedBadge() {
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-white"
      title="Vendeur vérifié"
      aria-label="Vendeur vérifié"
    >
      <Icon name="check" className="h-2.5 w-2.5" />
    </span>
  );
}

function StarRow({ value }) {
  const v = Number.parseFloat(String(value));
  const full = Number.isFinite(v) ? Math.min(5, Math.round(v)) : 5;
  return (
    <span className="flex items-center gap-0.5 text-amber-400">
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name={i < full ? 'starFilled' : 'star'} className="h-3 w-3" />
      ))}
    </span>
  );
}

export default function TopSellersSidebar({ ads, sellerProfiles, onVisitShop, onViewAll }) {
  const rows = useMemo(() => {
    const counts = new Map();
    for (const ad of ads) {
      const uid = ad.ownerUid;
      if (!uid) continue;
      counts.set(uid, (counts.get(uid) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([ownerUid, count]) => ({ ownerUid, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [ads]);

  if (rows.length === 0) return null;

  return (
    <aside className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.045)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <Icon name="user" className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-extrabold tracking-tight text-slate-900">Top vendeurs</h3>
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
      <ul className="space-y-1">
        {rows.map(({ ownerUid }) => {
          const prof = sellerProfiles[ownerUid];
          const name =
            prof?.shopName?.trim() ||
            `Vendeur ${String(ownerUid).slice(0, 5)}…`;
          const logo = prof?.shopLogoUrl;
          const { rating, reviews } = ratingMeta(ownerUid);
          return (
            <li key={ownerUid}>
              <button
                type="button"
                onClick={() => onVisitShop?.(ownerUid)}
                className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition hover:border-slate-100 hover:bg-slate-50"
              >
                <span className="relative shrink-0">
                  <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                    {logo ? (
                      <img src={logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <VerifiedBadge />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="truncate text-[13px] font-semibold text-slate-900">{name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <StarRow value={rating} />
                    <span className="text-[11px] font-medium tabular-nums text-slate-600">
                      {rating} ({reviews} avis)
                    </span>
                  </span>
                </span>
                <Icon name="chevronDown" className="-rotate-90 h-4 w-4 shrink-0 text-slate-400" />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
