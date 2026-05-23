/**
 * Page « Meilleurs vendeurs » — `/sellers`.
 *
 * Affiche tous les vendeurs ayant publié au moins une annonce, classés par
 * volume de listings actifs. Chaque carte montre : avatar, nom, badge Pro
 * (si applicable), badge vérifié, étoiles, note + nb d'avis, nb d'annonces,
 * et un CTA « Visiter la boutique ».
 *
 * Affiché en remplacement de la grille d'annonces / sidebars quand
 * l'utilisateur clique sur « Voir tout » à côté de Top vendeurs.
 */
import { useEffect, useMemo, useState } from 'react';
import { adIsVisibleOnPublicHome, listenAds } from '../services/listings';
import { useSellerProfiles } from '../hooks/useSellerProfiles';
import { ratingMeta } from '../utils/sellerRating';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import { Icon } from './Icons';

const PAGE_SIZE = 12;

function StarRow({ value, size = 'h-3.5 w-3.5' }) {
  const full = Number.isFinite(value) ? Math.min(5, Math.round(value)) : 5;
  return (
    <span className="flex items-center gap-0.5 text-amber-400" aria-label={`Note ${value}/5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name={i < full ? 'starFilled' : 'star'} className={size} />
      ))}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span
      className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white"
      title="Vendeur vérifié"
      aria-label="Vendeur vérifié"
    >
      <Icon name="check" className="h-3.5 w-3.5" />
    </span>
  );
}

function SellerCard({ seller, profile, onVisitShop }) {
  const name =
    profile?.shopName?.trim() || `Vendeur · ${String(seller.ownerUid).slice(0, 6)}…`;
  const description = profile?.shopDescription?.trim();
  const initial = (name[0] || '?').toUpperCase();
  const isPro = !!profile?.isPro;
  const { rating, reviews } = seller;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <div className="flex items-start gap-3">
        <span className="relative shrink-0">
          <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-slate-100 text-lg font-bold text-slate-600 ring-2 ring-slate-100">
            {profile?.shopLogoUrl ? (
              <img
                src={profile.shopLogoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="bg-brand-100 text-brand-700 flex h-full w-full items-center justify-center">
                {initial}
              </span>
            )}
          </span>
          <VerifiedBadge />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-base font-extrabold text-slate-900">
              {name}
            </h3>
            {isPro && (
              <span
                className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
                title="Compte Pro"
              >
                Pro
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StarRow value={rating} />
            <span className="text-xs font-semibold tabular-nums text-slate-700">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">({reviews} avis)</span>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-slate-500">
        {description ||
          'Vendeur Marketplace actif. Découvrez ses annonces et boutique.'}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon name="tag" className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="font-extrabold text-slate-900 tabular-nums">
              {seller.count}
            </span>{' '}
            annonce{seller.count !== 1 ? 's' : ''}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-emerald-600">
          <Icon name="shield" className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">Vérifié</span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => onVisitShop?.(seller.ownerUid)}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-500 bg-white py-2.5 text-sm font-extrabold text-brand-600 transition hover:bg-brand-50"
      >
        Visiter la boutique
        <Icon name="chevronDown" className="h-4 w-4 -rotate-90" />
      </button>
    </article>
  );
}

function PageButton({ active, disabled, onClick, children, ariaLabel, current }) {
  const base =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40';
  const tone = active
    ? 'bg-brand-500 text-white shadow-sm'
    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={current ? 'page' : undefined}
      aria-label={ariaLabel}
      className={`${base} ${tone}`}
    >
      {children}
    </button>
  );
}

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (current >= total - 2)
    [total - 1, total - 2, total - 3].forEach((p) => set.add(p));
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

export default function TopSellersPage({ onClose, onNavigateHome, onVisitShop }) {
  const [ads, setAds] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setStatus('loading');
    return listenAds(
      { max: 200 },
      (items) => {
        setAds(items);
        setStatus('ready');
        setError(null);
      },
      (err) => {
        setError(err);
        setStatus('error');
      },
    );
  }, []);

  const publishedAds = useMemo(() => ads.filter(adIsVisibleOnPublicHome), [ads]);

  const sellers = useMemo(() => {
    const counts = new Map();
    for (const ad of publishedAds) {
      const uid = ad.ownerUid;
      if (!uid) continue;
      counts.set(uid, (counts.get(uid) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([ownerUid, count]) => {
        const meta = ratingMeta(ownerUid);
        return { ownerUid, count, rating: meta.rating, reviews: meta.reviews };
      })
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.rating - a.rating;
      });
  }, [publishedAds]);

  const sellerUids = useMemo(() => sellers.map((s) => s.ownerUid), [sellers]);
  const profiles = useSellerProfiles(sellerUids);

  const totalPages = Math.max(1, Math.ceil(sellers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = sellers.slice(start, start + PAGE_SIZE);

  const items = buildPageList(safePage, totalPages);

  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-4 sm:pt-6">
      <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`}>
        <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <button
            type="button"
            onClick={onNavigateHome}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            Accueil
          </button>
          <span aria-hidden className="text-slate-300">/</span>
          <span className="font-semibold text-slate-900">Meilleurs vendeurs</span>
        </nav>

        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <Icon name="user" className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Meilleurs vendeurs
              </h1>
            </div>
            <p className="mt-2 text-sm text-slate-500 tabular-nums">
              {status === 'ready' && sellers.length > 0 && (
                <>
                  {sellers.length} vendeur{sellers.length !== 1 ? 's' : ''} actif
                  {sellers.length !== 1 ? 's' : ''}
                  {totalPages > 1 ? ` · page ${safePage}/${totalPages}` : ''}
                </>
              )}
              {status === 'ready' && sellers.length === 0 && 'Aucun vendeur pour le moment.'}
              {status === 'loading' && 'Chargement des vendeurs…'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Icon name="chevronDown" className="h-4 w-4 rotate-90" />
            Retour à l’accueil
          </button>
        </header>

        {status === 'loading' && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-2xl bg-white shadow-[0_2px_10px_rgba(15,23,42,0.045)]"
              />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Impossible de charger les vendeurs. {error?.message || ''}
          </div>
        )}

        {status === 'ready' && sellers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-600">
            Aucun vendeur n’a publié d’annonce pour le moment.
          </div>
        )}

        {status === 'ready' && sellers.length > 0 && (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((s) => (
                <SellerCard
                  key={s.ownerUid}
                  seller={s}
                  profile={profiles[s.ownerUid]}
                  onVisitShop={onVisitShop}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                role="navigation"
                aria-label="Pagination des vendeurs"
                className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
              >
                <PageButton
                  ariaLabel="Page précédente"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <Icon name="chevronDown" className="h-4 w-4 rotate-90" />
                </PageButton>
                {items.map((it, i) =>
                  it === '…' ? (
                    <span
                      key={`gap-${i}`}
                      aria-hidden
                      className="grid h-9 w-7 place-items-center text-sm text-slate-400"
                    >
                      …
                    </span>
                  ) : (
                    <PageButton
                      key={it}
                      active={it === safePage}
                      current={it === safePage}
                      onClick={() => setPage(it)}
                    >
                      {it}
                    </PageButton>
                  ),
                )}
                <PageButton
                  ariaLabel="Page suivante"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <Icon name="chevronDown" className="h-4 w-4 -rotate-90" />
                </PageButton>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
