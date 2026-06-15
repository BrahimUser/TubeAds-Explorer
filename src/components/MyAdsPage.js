import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { deleteAd, listenListingsByOwner } from '../services/listings';
import { Icon } from './Icons';

const CURRENCY_SUFFIX = { MAD: 'MAD', EUR: '€', USD: '$' };

function formatPrice(priceCents, currency = 'MAD', lang = 'fr') {
  const amount = (Number(priceCents) || 0) / 100;
  const localeTag = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  const grouped = Math.round(amount).toLocaleString(localeTag);
  const suffix = CURRENCY_SUFFIX[currency] || currency;
  return currency === 'MAD' ? `${grouped} ${suffix}` : `${suffix}${grouped}`;
}

function formatPublishedDate(ts, lang = 'fr') {
  if (!ts) return '';
  let ms = null;
  if (typeof ts.toMillis === 'function') ms = ts.toMillis();
  else if (typeof ts.seconds === 'number') ms = ts.seconds * 1000;
  if (ms == null) return '';
  const localeTag = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  return new Date(ms).toLocaleDateString(localeTag, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function listingImage(ad) {
  if (Array.isArray(ad.imageUrls) && ad.imageUrls[0]) return ad.imageUrls[0];
  return ad.thumbnailUrl || '';
}

function statusPresentation(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'approved' || s === 'active') {
    return { tone: 'bg-emerald-500/95 text-white', key: 'myAds.status.online' };
  }
  if (s === 'sold') {
    return { tone: 'bg-slate-700/95 text-white', key: 'myAds.status.sold' };
  }
  if (s === 'hidden') {
    return { tone: 'bg-slate-500/95 text-white', key: 'myAds.status.hidden' };
  }
  if (s === 'pending') {
    return { tone: 'bg-amber-500/95 text-white', key: 'myAds.status.pending' };
  }
  if (s === 'rejected') {
    return { tone: 'bg-red-600/95 text-white', key: 'myAds.status.rejected' };
  }
  return { tone: 'bg-slate-400/95 text-white', key: 'myAds.status.default' };
}

export default function MyAdsPage({ onRequireLogin, onEditAd, onCreateAd }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const { user, ready } = useAuth();
  const [ads, setAds] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (ready && !user) onRequireLogin?.();
  }, [ready, user, onRequireLogin]);

  useEffect(() => {
    if (!user?.uid) {
      setAds([]);
      setStatus('ready');
      return undefined;
    }
    setStatus('loading');
    setError(null);
    return listenListingsByOwner(
      user.uid,
      (list) => {
        setAds(list);
        setStatus('ready');
      },
      (err) => {
        setError(err);
        setStatus('error');
      },
    );
  }, [user?.uid]);

  async function handleDelete(ad) {
    if (!ad?.id || !user?.uid) return;
    if (ad.ownerUid !== user.uid) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('myAds.deleteConfirm'))) return;
    setDeletingId(ad.id);
    try {
      await deleteAd(ad.id);
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(String(e?.message || e));
    } finally {
      setDeletingId(null);
    }
  }

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('myAds.signedOutTitle')}</h1>
        <p className="mt-2 text-slate-500">{t('myAds.signedOutBody')}</p>
        <button
          type="button"
          onClick={() => onRequireLogin?.()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          {t('myAds.signIn')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-2">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('myAds.pageTitle')}</h1>
        <button
          type="button"
          onClick={() => onCreateAd?.()}
          className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
        >
          {t('myAds.publish')}
        </button>
      </header>

      {status === 'loading' && <SkeletonGrid />}

      {status === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('myAds.loadFailed', { message: error?.message || 'unknown' })}
          <div className="mt-1 text-red-800/80">{t('myAds.indexHint')}</div>
        </div>
      )}

      {status === 'ready' && ads.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
          <h2 className="text-base font-semibold text-slate-900">{t('myAds.emptyTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('myAds.emptyBody')}</p>
          <button
            type="button"
            onClick={() => onCreateAd?.()}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            {t('myAds.publish')}
          </button>
        </div>
      )}

      {status === 'ready' && ads.length > 0 && (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-label={t('myAds.listAria')}
        >
          {ads.map((ad) => {
            const img = listingImage(ad);
            const pub = formatPublishedDate(ad.createdAt, lang);
            const sp = statusPresentation(ad.status);
            return (
              <li
                key={ad.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-slate-400">
                      {t('common.noImage')}
                    </div>
                  )}
                  <span
                    className={
                      'absolute top-2 start-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
                      sp.tone
                    }
                  >
                    {t(sp.key)}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="truncate text-base font-bold text-brand-600">
                    {formatPrice(ad.priceCents, ad.currency, lang)}
                  </div>
                  <div className="truncate font-medium text-slate-900" title={ad.title}>
                    {ad.title || t('common.untitled')}
                  </div>
                  {pub && (
                    <div className="text-xs text-slate-500">
                      {t('myAds.published', { date: pub })}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onEditAd?.(ad)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 sm:flex-none"
                    >
                      <Icon name="fileText" className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                      {t('myAds.edit')}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === ad.id}
                      onClick={() => handleDelete(ad)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 sm:flex-none"
                    >
                      {deletingId === ad.id ? t('myAds.deleting') : t('myAds.delete')}
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
