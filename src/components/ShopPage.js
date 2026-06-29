import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../queries/useUsers';
import { useOwnerListings } from '../queries/useListings';
import { useFavoriteIds } from '../queries/useFavorites';
import { adIsVisibleOnPublicHome } from '../services/listings';
import { pushPath } from '../utils/routing';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import AdCard from './AdCard';

function isVisibleOnShop(ad, isOwnShop) {
  const s = String(ad?.status ?? '').toLowerCase();
  if (isOwnShop) return s === 'approved' || s === 'pending';
  return adIsVisibleOnPublicHome(ad);
}

export default function ShopPage({
  sellerId,
  onRequireLogin,
  onPlay,
  onOpenListing,
  onEdit,
  onCreateAd,
  onNavigateHome,
  onVisitShop,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: seller } = useUser(sellerId, { enabled: !!sellerId });
  const { data: allAds = [], isLoading, isError, error: loadErr } = useOwnerListings(sellerId, {
    enabled: !!sellerId,
  });
  const { data: favIds = new Set() } = useFavoriteIds(user?.uid, { enabled: !!user });

  const isOwnShop = !!user?.uid && user.uid === sellerId;
  const status = isLoading ? 'loading' : isError ? 'error' : 'ready';

  const ads = useMemo(
    () => allAds.filter((ad) => isVisibleOnShop(ad, isOwnShop)),
    [allAds, isOwnShop],
  );

  const displayName = useMemo(() => {
    if (seller?.shopName) return seller.shopName;
    return t('shop.shopFallback', { id: sellerId?.slice(0, 8) });
  }, [seller, sellerId, t]);

  function handleVisitSeller(uid) {
    if (!uid) return;
    onVisitShop?.(uid);
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <header className="border-b border-slate-100 bg-white">
        <div
          className={`mx-auto flex ${SITE_MAX_WIDTH_CLASS} flex-col gap-5 py-10 lg:flex-row lg:items-start lg:gap-10 ${SITE_GUTTER_CLASS}`}
        >
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:h-28 sm:w-28">
            {seller?.shopLogoUrl ? (
              <img src={seller.shopLogoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-slate-300">
                {(displayName.slice(0, 1) || '?').toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {displayName}
              </h1>
              {seller?.isPro && (
                <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  Pro
                </span>
              )}
              {isOwnShop && (
                <button
                  type="button"
                  onClick={() => onCreateAd?.()}
                  className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-brand-600"
                >
                  {t('shop.publishListing')}
                </button>
              )}
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              {seller?.shopDescription || t('shop.defaultDescription')}
            </p>
            <button
              type="button"
              className="text-sm font-bold text-brand-600 hover:underline"
              onClick={() => {
                pushPath('/');
                onNavigateHome?.();
              }}
            >
              {t('shop.backToMarket')}
            </button>
          </div>
        </div>
      </header>

      <section className={`mx-auto mt-10 ${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`}>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          {t('shop.sellerListings', { count: ads.length })}
        </h2>

        {status === 'loading' && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
                <div className="aspect-[4/3] animate-pulse bg-slate-100" />
                <div className="space-y-2 p-4">
                  <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-[92%] animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {loadErr?.message || String(loadErr)}
          </div>
        )}

        {status === 'ready' && ads.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-600">
            <p>{t('shop.emptyListings')}</p>
            {isOwnShop && (
              <button
                type="button"
                onClick={() => onCreateAd?.()}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                {t('shop.publishListing')}
              </button>
            )}
          </div>
        )}

        {status === 'ready' && ads.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                isFavorite={favIds.has(ad.id)}
                onRequireLogin={onRequireLogin}
                onPlay={onPlay}
                onOpenDetail={onOpenListing ? (a) => onOpenListing(a.id) : undefined}
                onEdit={onEdit}
                sellerProfile={seller && ad.ownerUid === sellerId ? seller : undefined}
                showVisitShop={false}
                onVisitShop={handleVisitSeller}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
