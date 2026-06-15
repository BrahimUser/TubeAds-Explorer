import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryLabel, cityLabel } from '../services/categories';
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

function formatSubmittedAt(createdAt, lang) {
  if (!createdAt) return '—';
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '—';
  const dateLocale = PRICE_LOCALE_FOR_LANG[lang] || 'fr-FR';
  return date.toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' });
}

function listingImages(ad) {
  const list = Array.isArray(ad.imageUrls) && ad.imageUrls.length > 0 ? ad.imageUrls : [];
  if (list.length > 0) return list;
  if (ad.thumbnailUrl) return [ad.thumbnailUrl];
  return [];
}

function sellerLabel(ad, t) {
  const owner = ad.owner;
  if (!owner) return ad.ownerUid || '—';
  const shop = owner.shopName?.trim();
  const name = owner.displayName?.trim();
  if (shop) return shop;
  if (name) return name;
  return owner.phoneNumber?.trim() || ad.ownerUid || '—';
}

function sellerSecondary(ad) {
  const owner = ad.owner;
  if (!owner) return null;
  const shop = owner.shopName?.trim();
  const name = owner.displayName?.trim();
  if (shop && name && shop !== name) return name;
  if (owner.phoneNumber?.trim()) return owner.phoneNumber.trim();
  return null;
}

export default function AdminModerationCard({
  ad,
  busyApprove,
  busyReject,
  locked,
  onApprove,
  onReject,
  onPlayVideo,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const [activeIndex, setActiveIndex] = useState(0);

  const images = useMemo(() => listingImages(ad), [ad]);
  const hasVideo = Boolean(ad.youtubeVideoId) || Boolean(ad.videoUrl);
  const videoThumb = ad.youtubeVideoId
    ? `https://i.ytimg.com/vi/${ad.youtubeVideoId}/hqdefault.jpg`
    : ad.thumbnailUrl || images[0] || '';

  const category = categoryLabel(ad.category);
  const city = cityLabel(ad.city);
  const submittedAt = formatSubmittedAt(ad.createdAt, lang);
  const activeImage = images[activeIndex] || images[0] || '';
  const sellerPrimary = sellerLabel(ad, t);
  const sellerMeta = sellerSecondary(ad);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {locked && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-sm font-bold text-white shadow-lg">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {busyApprove ? t('adminModeration.approving') : t('adminModeration.rejecting')}
          </div>
        </div>
      )}

      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200">
                {t('adminModeration.pendingReview')}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Icon name="clock" className="h-3.5 w-3.5" />
                {t('adminModeration.submitted')} {submittedAt}
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
              {ad.title || t('common.untitled')}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                <Icon name="user" className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{sellerPrimary}</span>
                {ad.owner?.isPro ? (
                  <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-700">
                    Pro
                  </span>
                ) : null}
              </span>
              {sellerMeta ? <span className="text-xs text-slate-500">{sellerMeta}</span> : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
            <div className="text-left sm:text-right">
              <div className="text-2xl font-extrabold text-brand-600">
                {formatPrice(ad.priceCents, ad.currency, lang)}
              </div>
              {ad.currency ? (
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {ad.currency}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={locked}
                className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
                onClick={onApprove}
              >
                <Icon name="check" className="h-4 w-4" />
                {busyApprove ? t('adminModeration.approving') : t('adminModeration.approve')}
              </button>
              <button
                type="button"
                disabled={locked}
                className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-extrabold text-red-700 transition hover:bg-red-50 disabled:opacity-60 sm:flex-none"
                onClick={onReject}
              >
                <Icon name="close" className="h-4 w-4" />
                {busyReject ? t('adminModeration.rejecting') : t('adminModeration.reject')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-4 border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              {t('adminModeration.mediaGallery')}
            </div>
            {activeImage ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <img src={activeImage} alt="" className="aspect-[4/3] w-full object-cover" />
              </div>
            ) : (
              <div className="grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                {t('adminModeration.noImages')}
              </div>
            )}

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
          </div>

          {hasVideo && (
            <div>
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                {t('adminModeration.videoPreview')}
              </div>
              <button
                type="button"
                onClick={() => onPlayVideo?.(ad)}
                className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-black text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="relative aspect-video w-full">
                  {videoThumb ? (
                    <img
                      src={videoThumb}
                      alt=""
                      className="h-full w-full object-cover opacity-90 transition group-hover:opacity-75"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-slate-900 text-slate-400">
                      <Icon name="play" className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 grid place-items-center bg-black/25 transition group-hover:bg-black/35">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-brand-600 shadow-lg transition group-hover:scale-105">
                      <Icon name="play" className="ml-1 h-7 w-7" />
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-bold text-slate-800">{t('adminModeration.watchVideo')}</span>
                  {ad.videoUrl && (
                    <a
                      href={ad.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      {t('adminModeration.openVideoLink')}
                    </a>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col p-5">
          <div className="mb-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">
            {t('adminModeration.listingDetails')}
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {category && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {t('common.category')}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">{category}</dd>
              </div>
            )}
            {city && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {t('common.city')}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900">{city}</dd>
              </div>
            )}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:col-span-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t('adminModeration.listingId')}
              </dt>
              <dd className="mt-0.5 break-all font-mono text-[11px] text-slate-700">{ad.id}</dd>
            </div>
          </dl>

          <section className="mt-5 flex-1">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              {t('product.description')}
            </h3>
            {ad.description?.trim() ? (
              <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-700">
                {ad.description.trim()}
              </div>
            ) : (
              <p className="mt-2 text-sm italic text-slate-500">{t('adminModeration.noDescription')}</p>
            )}
          </section>
        </div>
      </div>
    </article>
  );
}
