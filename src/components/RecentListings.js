/**
 * Marketplace listings grid — `annonces` collection, read-only.
 *
 * Layouts :
 *  • Aperçu accueil  → grille 4 colonnes côté principal + sidebars empilées.
 *  • Vue « Voir tout » (page `/listings`) → grille 4 colonnes pleine largeur,
 *    sidebars masquées, pagination (flèches + numéros) en bas.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import { useAuth } from '../context/AuthContext';
import { useSellerProfiles } from '../queries/useUsers';
import { useApprovedListings } from '../queries/useListings';
import { useFavoriteIds } from '../queries/useFavorites';
import {
  ANNONCES_COLLECTION,
  adIsVisibleOnPublicHome,
  adMatchesCity,
  adMatchesSelectedCategory,
} from '../services/listings';
import AdCard from './AdCard';
import PopularNowSidebar from './sidebars/PopularNowSidebar';
import TopSellersSidebar from './sidebars/TopSellersSidebar';
import { Icon } from './Icons';

const PAGE_SIZE = 12;

/** Grille uniforme : 1 / 2 / 3 / 4 colonnes selon la largeur. */
const GRID_CLASS =
  'grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

export default function RecentListings({
  searchQuery = '',
  category = null,
  cityFilter = null,
  onRequireLogin,
  onPlay,
  onOpenListing,
  onEdit,
  onVisitShop,
  previewLimit = null,
  onViewAll,
  onViewAllSellers,
  showSectionTitle = true,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: ads = [], isLoading, isError, error } = useApprovedListings();
  const { data: favIds = new Set() } = useFavoriteIds(user?.uid, { enabled: !!user });
  const [page, setPage] = useState(1);

  const status = isLoading ? 'loading' : isError ? 'error' : 'ready';

  const publishedAds = useMemo(() => ads.filter(adIsVisibleOnPublicHome), [ads]);

  const ownerUidList = useMemo(
    () => publishedAds.map((a) => a.ownerUid),
    [publishedAds],
  );
  const sellerProfiles = useSellerProfiles(ownerUidList);

  const filtered = useMemo(() => {
    const byCategory = category
      ? publishedAds.filter((ad) => adMatchesSelectedCategory(ad, category))
      : publishedAds;
    const byCity = byCategory.filter((ad) => adMatchesCity(ad, cityFilter));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCity;
    return byCity.filter((ad) =>
      [ad.title, ad.description, ad.category, ad.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [publishedAds, searchQuery, category, cityFilter]);

  const isHomePreview =
    typeof previewLimit === 'number' && previewLimit > 0;

  // Reset to page 1 whenever filters change (full-grid view only).
  useEffect(() => {
    if (!isHomePreview) setPage(1);
  }, [searchQuery, category, cityFilter, isHomePreview]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visibleAds = useMemo(() => {
    if (isHomePreview) return filtered.slice(0, previewLimit);
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, isHomePreview, previewLimit, safePage]);

  const renderHeader = () => {
    if (!showSectionTitle) return null;
    return (
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 lg:mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">
            {t('listings.sectionTitle')}
          </h2>
          {!isHomePreview && status === 'ready' && filtered.length > 0 && (
            <p className="mt-1 text-sm text-slate-500 tabular-nums">
              {filtered.length === 1
                ? t('listings.countOne', { count: filtered.length })
                : t('listings.countMany', { count: filtered.length })}
              {totalPages > 1 ? ` · ${t('listings.pageOf', { current: safePage, total: totalPages })}` : ''}
            </p>
          )}
        </div>
        {isHomePreview && onViewAll && (
          <button
            type="button"
            onClick={() => onViewAll()}
            className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-brand-600 transition hover:text-brand-700"
          >
            {t('listings.viewAll')}
            <Icon name="chevronDown" className="h-4 w-4 -rotate-90 rtl:rotate-90" />
          </button>
        )}
      </header>
    );
  };

  const renderError = () => (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      {t('listings.loadError')}{' '}
      <code className="font-mono text-xs">{ANNONCES_COLLECTION}</code>.{' '}
      {error?.message || ''}
    </div>
  );

  const renderEmpty = () => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-600">
      {searchQuery.trim()
        ? t('listings.emptyForQuery')
        : category
          ? t('listings.emptyForCategory')
          : ads.length === 0
            ? t('listings.emptyNoneLoaded')
            : t('listings.emptyNonePublished')}
    </div>
  );

  const renderGrid = () => (
    <div className={GRID_CLASS}>
      {visibleAds.map((ad) => (
        <AdCard
          key={ad.id}
          ad={ad}
          isFavorite={favIds.has(ad.id)}
          onRequireLogin={onRequireLogin}
          onPlay={onPlay}
          onOpenDetail={onOpenListing ? (a) => onOpenListing(a.id) : undefined}
          onEdit={onEdit}
          sellerProfile={sellerProfiles[ad.ownerUid]}
          onVisitShop={onVisitShop}
          density="default"
        />
      ))}
    </div>
  );

  const shellPad =
    `${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS} mx-auto ` +
    (showSectionTitle ? 'py-12 lg:py-14' : 'pb-12 pt-2 lg:pb-14 lg:pt-4');

  // ---------------------------------------------------------------------
  // Aperçu accueil : ads (4 colonnes) à gauche + sidebars empilées à droite
  // ---------------------------------------------------------------------
  if (isHomePreview) {
    return (
      <section id="recent-listings" className={shellPad}>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-9">
            {renderHeader()}
            {status === 'loading' && <SkeletonGrid count={previewLimit} />}
            {status === 'error' && renderError()}
            {status === 'ready' && filtered.length === 0 && renderEmpty()}
            {status === 'ready' && filtered.length > 0 && renderGrid()}
          </div>
          <aside className="flex min-w-0 flex-col gap-6 lg:col-span-3">
            <PopularNowSidebar
              ads={publishedAds}
              onPlay={onPlay}
              onViewAll={onViewAll}
            />
            <TopSellersSidebar
              ads={publishedAds}
              sellerProfiles={sellerProfiles}
              onVisitShop={onVisitShop}
              onViewAll={onViewAllSellers}
            />
          </aside>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------
  // Vue « Voir tout » : pleine largeur + pagination, pas de sidebar
  // ---------------------------------------------------------------------
  return (
    <section id="recent-listings" className={shellPad}>
      {renderHeader()}
      {status === 'loading' && <SkeletonGrid count={PAGE_SIZE} />}
      {status === 'error' && renderError()}
      {status === 'ready' && filtered.length === 0 && renderEmpty()}
      {status === 'ready' && filtered.length > 0 && (
        <>
          {renderGrid()}
          <Pagination
            page={safePage}
            pageCount={totalPages}
            onChange={(p) => {
              setPage(p);
              const grid = document.getElementById('recent-listings');
              if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

function Pagination({ page, pageCount, onChange }) {
  const { t } = useTranslation();
  if (pageCount <= 1) return null;
  const items = buildPageList(page, pageCount);

  const arrowBase =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white';

  return (
    <nav
      role="navigation"
      aria-label={t('common.paginationAria')}
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label={t('common.previousPage')}
        className={arrowBase}
      >
        <Icon name="chevronDown" className="h-4 w-4 rotate-90 rtl:-rotate-90" />
      </button>
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
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-current={it === page ? 'page' : undefined}
            className={
              'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ' +
              (it === page
                ? 'bg-brand-500 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50')
            }
          >
            {it}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        aria-label={t('common.nextPage')}
        className={arrowBase}
      >
        <Icon name="chevronDown" className="h-4 w-4 -rotate-90 rtl:rotate-90" />
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function SkeletonGrid({ count = PAGE_SIZE }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-4">
            <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-[92%] animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
