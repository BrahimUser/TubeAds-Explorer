import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useFavoritesList } from '../queries/useFavorites';
import { useToggleFavorite } from '../mutations/useToggleFavorite';
import { DEFAULT_LANGUAGE } from '../i18n';
import { Icon } from './Icons';

const CURRENCY_SUFFIX = { MAD: 'MAD', EUR: '€', USD: '$' };

function formatPrice(priceCents, currency = 'MAD', lang = DEFAULT_LANGUAGE) {
  const amount = (Number(priceCents) || 0) / 100;
  const localeTag = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  const grouped = Math.round(amount).toLocaleString(localeTag);
  const suffix = CURRENCY_SUFFIX[currency] || currency;
  return currency === 'MAD' ? `${grouped} ${suffix}` : `${suffix}${grouped}`;
}

function formatSavedDate(ts, lang = DEFAULT_LANGUAGE) {
  if (!ts) return '';
  let ms = null;
  if (typeof ts.toMillis === 'function') ms = ts.toMillis();
  else if (typeof ts.seconds === 'number') ms = ts.seconds * 1000;
  else if (typeof ts === 'string' || typeof ts === 'number') ms = new Date(ts).getTime();
  if (ms == null || Number.isNaN(ms)) return '';
  const localeTag = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  return new Date(ms).toLocaleDateString(localeTag, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function listingId(fav) {
  return fav.listingId || fav.adId || fav.id;
}

export default function MyFavouritesPage({ onRequireLogin, onOpenListing, onBrowseListings }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || DEFAULT_LANGUAGE;
  const { user, ready } = useAuth();
  const { data: favorites = [], isLoading, isError, error } = useFavoritesList(user?.uid, {
    enabled: !!user?.uid,
  });
  const toggleFavorite = useToggleFavorite();

  const status = isLoading ? 'loading' : isError ? 'error' : 'ready';
  const removingId = toggleFavorite.isPending ? toggleFavorite.variables?.ad?.id : null;

  useEffect(() => {
    if (ready && !user) onRequireLogin?.();
  }, [ready, user, onRequireLogin]);

  async function handleRemove(fav) {
    const id = listingId(fav);
    if (!id || !user?.uid) return;
    const ad = { id, title: fav.title, priceCents: fav.priceCents, currency: fav.currency };
    try {
      await toggleFavorite.mutateAsync({
        ad,
        currentlyFavorited: true,
        uid: user.uid,
      });
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(String(e?.message || e));
    }
  }

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('myFavourites.signedOutTitle')}</h1>
        <p className="mt-2 text-slate-500">{t('myFavourites.signedOutBody')}</p>
        <button
          type="button"
          onClick={() => onRequireLogin?.()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          {t('myFavourites.signIn')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-2">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('myFavourites.pageTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('myFavourites.pageSubtitle')}</p>
      </header>

      {status === 'loading' && <SkeletonGrid />}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('myFavourites.loadFailed', { message: error?.message || 'unknown' })}
        </div>
      )}

      {status === 'ready' && favorites.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
          <h2 className="text-base font-semibold text-slate-900">{t('myFavourites.emptyTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('myFavourites.emptyBody')}</p>
          <button
            type="button"
            onClick={() => onBrowseListings?.()}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            {t('myFavourites.browse')}
          </button>
        </div>
      )}

      {status === 'ready' && favorites.length > 0 && (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={t('myFavourites.listAria')}
        >
          {favorites.map((fav) => {
            const id = listingId(fav);
            const img = fav.thumbnailUrl || '';
            const saved = formatSavedDate(fav.createdAt, lang);
            return (
              <li
                key={fav.id || id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onOpenListing?.(id)}
                  className="relative block aspect-[4/3] w-full bg-slate-100 text-start"
                >
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-slate-400">
                      {t('common.noImage')}
                    </div>
                  )}
                  <span className="absolute top-2 start-2 inline-flex items-center rounded-full bg-brand-500/95 px-2 py-0.5 text-[11px] font-semibold text-white">
                    <Icon name="heartFilled" className="me-1 h-3 w-3" />
                    {t('myFavourites.savedBadge')}
                  </span>
                </button>
                <div className="space-y-2 p-4">
                  <div className="truncate text-base font-bold text-brand-600">
                    {formatPrice(fav.priceCents, fav.currency, lang)}
                  </div>
                  <div className="truncate font-medium text-slate-900" title={fav.title}>
                    {fav.title || t('common.untitled')}
                  </div>
                  {fav.city && (
                    <div className="truncate text-xs text-slate-500">{fav.city}</div>
                  )}
                  {saved && (
                    <div className="text-xs text-slate-500">
                      {t('myFavourites.savedOn', { date: saved })}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenListing?.(id)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 sm:flex-none"
                    >
                      <Icon name="search" className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                      {t('myFavourites.view')}
                    </button>
                    <button
                      type="button"
                      disabled={removingId === id}
                      onClick={() => handleRemove(fav)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 sm:flex-none"
                    >
                      <Icon name="heart" className="h-3.5 w-3.5 shrink-0" />
                      {removingId === id ? t('myFavourites.removing') : t('myFavourites.remove')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}
