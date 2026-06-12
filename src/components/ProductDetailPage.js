/**
 * Product detail (PDP) — Firebase listing: title, price, image gallery, description, specs.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getAd } from '../services/listings';
import { categoryLabel, cityLabel } from '../services/categories';
import { fetchUser, normalizeUserProfile } from '../services/users';
import { getOrCreateChatThreadForAd } from '../services/chat';
import { SITE_GUTTER_CLASS, SITE_MAX_WIDTH_CLASS } from '../constants/layout';
import { Icon } from './Icons';

const CURRENCY_SUFFIX = { MAD: 'MAD', EUR: '€', USD: '$' };
const PRICE_LOCALE_FOR_LANG = { fr: 'fr-FR', en: 'en-US', ar: 'ar-MA' };

function formatPrice(priceCents, currency = 'MAD', lang = 'fr') {
  if (typeof priceCents !== 'number' || Number.isNaN(priceCents)) return '—';
  const amount = priceCents / 100;
  const numberLocale = PRICE_LOCALE_FOR_LANG[lang] || 'fr-FR';
  const grouped = Math.round(amount).toLocaleString(numberLocale);
  const suffix = CURRENCY_SUFFIX[currency] || currency;
  return currency === 'MAD' ? `${grouped} ${suffix}` : `${suffix}${grouped}`;
}

function tsMs(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return null;
}

function relativeTime(ts, t) {
  const ms = tsMs(ts);
  if (ms == null) return '';
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return t('product.timeJustNow');
  if (minutes < 60) return t('product.timeMinutesAgo', { minutes });
  const h = Math.round(minutes / 60);
  if (h < 24) return t('product.timeHoursAgo', { hours: h });
  const d = Math.round(h / 24);
  if (d < 14) return t('product.timeDaysAgo', { days: d });
  return t('product.timeWeeksAgo', { weeks: Math.round(d / 7) });
}

const NEW_MS = 7 * 86400000;
function hasNewBadge(ts) {
  const ms = tsMs(ts);
  return ms != null && Date.now() - ms < NEW_MS;
}

function buildSpecRows(ad, t, lang) {
  const rows = [];
  const cat = categoryLabel(ad.category);
  if (cat) rows.push({ k: t('common.category'), v: cat });
  const city = cityLabel(ad.city);
  if (city) rows.push({ k: t('common.city'), v: city });
  if (ad.currency) rows.push({ k: t('common.currency'), v: String(ad.currency) });
  if (typeof ad.viewCount === 'number' && ad.viewCount >= 0) {
    rows.push({ k: t('common.views'), v: String(ad.viewCount) });
  }
  const ms = tsMs(ad.createdAt);
  if (ms != null) {
    const dateLocale = PRICE_LOCALE_FOR_LANG[lang] || 'fr-FR';
    rows.push({
      k: t('common.published'),
      v: new Date(ms).toLocaleDateString(dateLocale, { dateStyle: 'medium' }),
    });
  }
  const desc = (ad.description || '').trim();
  const kvLines = desc
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
      if (m) return { k: m[1].trim(), v: m[2].trim() };
      return null;
    })
    .filter(Boolean);
  const seen = new Set(rows.map((r) => r.k));
  for (const row of kvLines) {
    if (!seen.has(row.k)) {
      rows.push(row);
      seen.add(row.k);
    }
  }
  return rows;
}

export default function ProductDetailPage({
  listingId,
  onBack,
  onPlay,
  onVisitShop,
  onRequireLogin,
  onOpenMessages,
  onEdit,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const { user } = useAuth();
  const [ad, setAd] = useState(null);
  const [seller, setSeller] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [contactError, setContactError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    setActiveIndex(0);
    (async () => {
      try {
        const next = await getAd(listingId);
        if (cancelled) return;
        if (!next) {
          setAd(null);
          setSeller(null);
          setStatus('missing');
          return;
        }
        setAd(next);
        setStatus('ready');
        if (next.ownerUid) {
          try {
            const profile = await fetchUser(next.ownerUid);
            if (cancelled) return;
            setSeller(profile);
          } catch {
            if (!cancelled) setSeller(normalizeUserProfile(next.ownerUid, null));
          }
        } else {
          setSeller(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const images = useMemo(() => {
    if (!ad) return [];
    const list = Array.isArray(ad.imageUrls) && ad.imageUrls.length > 0 ? ad.imageUrls : [];
    if (list.length > 0) return list;
    if (ad.thumbnailUrl) return [ad.thumbnailUrl];
    return [];
  }, [ad]);

  const hasVideo = Boolean(ad?.youtubeVideoId) || Boolean(ad?.videoUrl);
  const specRows = useMemo(() => (ad ? buildSpecRows(ad, t, lang) : []), [ad, t, lang]);
  const isOwner = !!user && ad && user.uid === ad.ownerUid;

  async function handleContactSeller() {
    if (!user) {
      onRequireLogin?.();
      return;
    }
    if (!ad) return;
    if (ad.ownerUid && ad.ownerUid === user.uid) {
      // Owners can't message themselves; just open the inbox.
      onOpenMessages?.();
      return;
    }
    setContactError(null);
    setContacting(true);
    try {
      const threadId = await getOrCreateChatThreadForAd(ad);
      onOpenMessages?.(threadId);
    } catch (err) {
      console.error('getOrCreateChatThreadForAd', err);
      setContactError(err);
      // Still open the messages drawer so the user can see existing chats.
      onOpenMessages?.();
    } finally {
      setContacting(false);
    }
  }

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
  }, [images.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (images.length ? (i + 1) % images.length : 0));
  }, [images.length]);

  const mainSrc = images[activeIndex] || '';

  if (status === 'loading') {
    return (
      <main className={`min-h-screen bg-white pb-16 pt-6 ${SITE_GUTTER_CLASS}`}>
        <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} py-24 text-center text-slate-500`}>
          {t('product.loadingListing')}
        </div>
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className={`min-h-screen bg-white pb-16 pt-6 ${SITE_GUTTER_CLASS}`}>
        <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} max-w-lg py-16 text-center`}>
          <p className="text-slate-700">{t('product.cannotLoadListing')}</p>
          <p className="mt-2 text-sm text-slate-500">{String(error?.message || error)}</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-600"
          >
            {t('common.back')}
          </button>
        </div>
      </main>
    );
  }

  if (status === 'missing' || !ad) {
    return (
      <main className={`min-h-screen bg-white pb-16 pt-6 ${SITE_GUTTER_CLASS}`}>
        <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} py-16 text-center text-slate-600`}>
          <p className="font-semibold text-slate-900">{t('product.listingNotFound')}</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 text-sm font-bold text-brand-600 hover:text-brand-700"
          >
            {t('product.backToMarketplace')}
          </button>
        </div>
      </main>
    );
  }

  const displayName =
    seller?.shopName?.trim() || `${t('product.seller')} · ${ad.ownerUid?.slice(0, 8) || '—'}…`;

  return (
    <main
      className={
        'min-h-screen bg-white pt-4 sm:pt-6 ' +
        (!isOwner ? 'pb-28 sm:pb-20' : 'pb-20')
      }
    >
      <div className={`mx-auto ${SITE_MAX_WIDTH_CLASS} ${SITE_GUTTER_CLASS}`}>
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <button type="button" onClick={onBack} className="font-medium text-brand-600 hover:text-brand-700">
            {t('common.home')}
          </button>
          <span aria-hidden className="text-slate-300">
            /
          </span>
          <span className="text-slate-700">{categoryLabel(ad.category) || t('product.ad')}</span>
          <span aria-hidden className="text-slate-300">
            /
          </span>
          <span className="line-clamp-1 max-w-[min(100%,28rem)] font-medium text-slate-900">
            {ad.title || t('common.untitled')}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-sm">
              {mainSrc ? (
                <img src={mainSrc} alt="" className="aspect-[4/3] w-full object-contain sm:aspect-[16/10]" />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center text-slate-400">
                  {t('common.noImage')}
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={t('product.previousImage')}
                    onClick={goPrev}
                    className="absolute start-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
                  >
                    <Icon name="chevronDown" className="h-5 w-5 rotate-90 rtl:-rotate-90" />
                  </button>
                  <button
                    type="button"
                    aria-label={t('product.nextImage')}
                    onClick={goNext}
                    className="absolute end-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
                  >
                    <Icon name="chevronDown" className="h-5 w-5 -rotate-90 rtl:rotate-90" />
                  </button>
                </>
              )}
              {images.length > 0 && (
                <span className="absolute bottom-3 end-3 rounded-md bg-slate-900/75 px-2 py-1 text-xs font-semibold text-white">
                  {activeIndex + 1}/{images.length}
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={
                      'relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 transition ' +
                      (i === activeIndex ? 'ring-brand-500' : 'ring-transparent hover:ring-slate-200')
                    }
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {hasVideo && (
              <button
                type="button"
                onClick={() => onPlay?.(ad)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-white shadow">
                  <Icon name="play" className="ml-0.5 h-5 w-5" />
                </span>
                {t('product.watchVideo')}
              </button>
            )}

            {ad.description?.trim() && (
              <section>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{t('product.description')}</h2>
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-700">
                  {ad.description.trim()}
                </div>
              </section>
            )}

            {specRows.length > 0 && (
              <section>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{t('product.features')}</h2>
                <dl className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {specRows.map(({ k, v }) => (
                    <div key={k} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-4">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{k}</dt>
                      <dd className="text-sm font-medium text-slate-800">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-start gap-2">
                {hasNewBadge(ad.createdAt) && (
                  <span className="rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    {t('product.new')}
                  </span>
                )}
                <h1 className="text-xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-2xl">
                  {ad.title || t('common.untitled')}
                </h1>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-brand-500 sm:text-3xl">
                {formatPrice(ad.priceCents, ad.currency, lang)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Icon name="pin" className="h-3.5 w-3.5 opacity-70" />
                  {cityLabel(ad.city) || '—'}
                </span>
                <span className="text-slate-300">•</span>
                <span>{relativeTime(ad.createdAt, t) || t('common.recent')}</span>
                {typeof ad.viewCount === 'number' && ad.viewCount >= 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Icon name="eye" className="h-3.5 w-3.5" />
                      {ad.viewCount} {t('common.views')}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm leading-relaxed text-slate-600">{t('product.contactSellerLead')}</p>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={handleContactSeller}
                    disabled={contacting}
                    className="mt-4 hidden w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-4 text-base font-extrabold text-white shadow-lg transition hover:bg-brand-600 active:scale-[0.99] disabled:opacity-60 lg:flex"
                  >
                    <Icon name="message" className="h-5 w-5 shrink-0 opacity-95" />
                    {contacting ? t('product.openingChat') : t('product.contactSeller')}
                  </button>
                )}
                {contactError && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {t('product.cannotOpenChat')} : {contactError.message || String(contactError)}
                  </p>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => onEdit?.(ad)}
                    className="mt-4 w-full rounded-2xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    {t('product.editAd')}
                  </button>
                )}
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{t('product.secureExchange')}</span>
              </div>
            </div>

            {ad.ownerUid && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-100">
                    {seller?.shopLogoUrl ? (
                      <img src={seller.shopLogoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-400">
                        {(displayName[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-bold text-slate-900">{displayName}</p>
                      {seller?.isPro && (
                        <span className="shrink-0 text-emerald-600" title={t('product.proAccount')}>
                          <Icon name="check" className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{t('product.sellerOnMarketplace')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onVisitShop?.(ad.ownerUid)}
                  className="mt-4 w-full rounded-xl border-2 border-brand-500 bg-white py-2.5 text-sm font-extrabold text-brand-600 transition hover:bg-brand-50"
                >
                  {t('product.viewSellerProfile')}
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>

      {!isOwner && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-orange-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(15,23,42,0.12)] backdrop-blur-md lg:hidden">
          {contactError && (
            <p className="pointer-events-auto mb-2 text-center text-xs font-medium text-red-600">
              {t('product.cannotOpenChat')}
            </p>
          )}
          <button
            type="button"
            onClick={handleContactSeller}
            disabled={contacting}
            className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-base font-extrabold text-white shadow-lg transition hover:bg-brand-600 active:scale-[0.99] disabled:opacity-60"
          >
            <Icon name="message" className="h-5 w-5 shrink-0 opacity-95" />
            {contacting ? t('product.openingChat') : t('product.contactSeller')}
          </button>
        </div>
      )}
    </main>
  );
}
