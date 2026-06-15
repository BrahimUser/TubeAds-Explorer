/**
 * Listing card — video-centric: YouTube-backed thumbnail (`annonces` doc),
 * tap opens the modal player (read-only browsing). Heart syncs with mobile
 * favorites.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToggleFavorite } from '../mutations/useToggleFavorite';
import { cityLabel } from '../services/categories';
import { Icon } from './Icons';

const CURRENCY_SUFFIX = { MAD: 'MAD', EUR: '€', USD: '$' };
const NUMBER_LOCALE_FOR_LANG = { fr: 'fr-FR', en: 'en-US', ar: 'ar-MA' };

function formatPrice(priceCents, currency = 'MAD', lang = 'fr') {
  if (typeof priceCents !== 'number' || Number.isNaN(priceCents)) return '—';
  const amount = priceCents / 100;
  const grouped = Math.round(amount).toLocaleString(NUMBER_LOCALE_FOR_LANG[lang] || 'fr-FR');
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
  if (minutes < 1) return t('card.timeJustNow');
  if (minutes < 60) return t('card.timeMinutesAgo', { minutes });
  const h = Math.round(minutes / 60);
  if (h < 24) return t('card.timeHoursAgo', { hours: h });
  const d = Math.round(h / 24);
  if (d < 14) return t('card.timeDaysAgo', { days: d });
  return t('card.timeWeeksAgo', { weeks: Math.round(d / 7) });
}

const NEW_MS = 7 * 86400000;
function hasNewBadge(ts) {
  const ms = tsMs(ts);
  return ms != null && Date.now() - ms < NEW_MS;
}

function AdCardTextBlock({ ad, compact, isSellerPro, isOwner, onEdit, onOpenDetail, t, lang }) {
  return (
    <>
      <div className="flex min-h-[2.25rem] flex-wrap items-start gap-2">
        <h3
          className={
            compact
              ? 'line-clamp-2 flex-1 text-[13px] font-semibold leading-snug text-slate-900'
              : 'line-clamp-2 flex-1 text-[15px] font-semibold leading-snug text-slate-900'
          }
        >
          {ad.title || t('card.untitled')}
        </h3>
        {isSellerPro && (
          <span
            className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
            title={t('card.proAccount')}
          >
            {t('card.pro')}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div
          className={
            compact ? 'min-w-0 text-base font-extrabold text-brand-500' : 'min-w-0 text-lg font-extrabold text-brand-500'
          }
        >
          {formatPrice(ad.priceCents, ad.currency, lang)}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onOpenDetail && (
            <button
              type="button"
              className={
                'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 ' +
                (compact ? 'px-3 py-2' : 'px-3 py-2.5')
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenDetail(ad);
              }}
            >
              <Icon name="search" className="h-3.5 w-3.5 shrink-0 text-brand-600" />
              {t('card.viewListing')}
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              className={
                'rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 ' +
                (compact ? 'px-2.5 py-1' : 'px-3 py-1.5')
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.(ad);
              }}
            >
              {t('card.edit')}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
        <span className="flex flex-wrap items-center gap-x-1">
          <Icon name="pin" className="h-3.5 w-3.5 shrink-0 opacity-75" />
          <span>{cityLabel(ad.city) || '—'}</span>
          <span className="text-slate-300" aria-hidden>
            •
          </span>
          <span>{relativeTime(ad.createdAt, t) || t('card.recent')}</span>
        </span>
        {typeof ad.viewCount === 'number' && ad.viewCount >= 0 && (
          <span className="flex items-center gap-1 tabular-nums text-slate-400">
            <Icon name="eye" className="h-3.5 w-3.5" />
            {ad.viewCount}
          </span>
        )}
      </div>
    </>
  );
}

export default function AdCard({
  ad,
  isFavorite,
  onRequireLogin,
  onPlay,
  onOpenDetail,
  onEdit,
  sellerProfile,
  onVisitShop,
  showVisitShop = true,
  density = 'default',
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';
  const { user } = useAuth();
  const toggleFavoriteMutation = useToggleFavorite();
  const [favorited, setFavorited] = useState(!!isFavorite);

  useEffect(() => {
    setFavorited(!!isFavorite);
  }, [isFavorite]);

  const heartBusy = toggleFavoriteMutation.isPending;
  const hasVideo = Boolean(ad.youtubeVideoId) || Boolean(ad.videoUrl);
  const isDirectVideo =
    typeof ad.videoUrl === 'string' &&
    (/\.(mp4|webm|ogg)(\?|#|$)/i.test(ad.videoUrl) ||
      ad.videoUrl.includes('firebasestorage') ||
      ad.videoUrl.includes('storage.googleapis'));

  async function onFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      onRequireLogin?.();
      return;
    }
    if (heartBusy) return;
    const next = !favorited;
    setFavorited(next);
    try {
      await toggleFavoriteMutation.mutateAsync({
        ad,
        currentlyFavorited: favorited,
        uid: user.uid,
      });
    } catch {
      setFavorited(!next);
    }
  }

  const isOwner = !!user && user.uid === ad.ownerUid;
  const isSellerPro = !!sellerProfile?.isPro;
  const compact = density === 'compact';

  return (
    <article className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.045)] transition hover:z-[1] hover:border-slate-200 hover:shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        className="relative block w-full overflow-hidden rounded-t-xl text-start outline-none ring-inset focus-visible:ring-2 focus-visible:ring-brand-400"
        onClick={() => onPlay?.(ad)}
      >
        <div className="relative aspect-[4/3] w-full bg-slate-50">
          {isDirectVideo ? (
            <video
              src={ad.videoUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              poster={ad.thumbnailUrl || undefined}
            />
          ) : ad.thumbnailUrl ? (
            <img
              src={ad.thumbnailUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
              {t('card.noPreview')}
            </div>
          )}

          {hasVideo && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <span
                className={
                  'flex items-center justify-center rounded-full bg-white/95 text-brand-500 shadow-lg ring-1 ring-black/5 transition group-hover:scale-105 ' +
                  (compact ? 'h-11 w-11' : 'h-[52px] w-[52px]')
                }
              >
                <Icon name="play" className={compact ? 'ml-0.5 h-5 w-5' : 'ml-0.5 h-6 w-6'} />
              </span>
            </span>
          )}

          {isOwner && String(ad.status ?? '').toLowerCase() === 'pending' ? (
            <span className="absolute start-2.5 top-2.5 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              {t('myAds.status.pending')}
            </span>
          ) : hasNewBadge(ad.createdAt) ? (
            <span className="absolute start-2.5 top-2.5 rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              {t('card.new')}
            </span>
          ) : null}
        </div>
      </button>

      <button
        type="button"
        onClick={onFavorite}
        disabled={heartBusy}
        aria-pressed={favorited}
        aria-label={t('card.favorite')}
        aria-busy={heartBusy}
        className={
          'absolute end-2.5 top-2.5 z-[2] grid place-items-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-md transition hover:scale-105 disabled:pointer-events-none disabled:opacity-60 ' +
          (compact ? 'h-9 w-9 ' : 'h-10 w-10 ') +
          (favorited ? 'text-brand-500' : '')
        }
      >
        <Icon name={favorited ? 'heartFilled' : 'heart'} className={compact ? 'h-4.5 w-4.5' : 'h-5 w-5'} />
      </button>

      <div className={compact ? 'space-y-1.5 p-3' : 'space-y-2 p-4'}>
        {onOpenDetail ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenDetail(ad)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail(ad);
              }
            }}
            className={
              '-m-1 cursor-pointer rounded-xl p-1 text-start outline-none transition hover:bg-slate-50/90 focus-visible:ring-2 focus-visible:ring-brand-400 ' +
              (compact ? 'space-y-1.5' : 'space-y-2')
            }
          >
            <AdCardTextBlock
              ad={ad}
              compact={compact}
              isSellerPro={isSellerPro}
              isOwner={isOwner}
              onEdit={onEdit}
              onOpenDetail={onOpenDetail}
              t={t}
              lang={lang}
            />
          </div>
        ) : (
          <AdCardTextBlock
            ad={ad}
            compact={compact}
            isSellerPro={isSellerPro}
            isOwner={isOwner}
            onEdit={onEdit}
            onOpenDetail={onOpenDetail}
            t={t}
            lang={lang}
          />
        )}
        {showVisitShop && ad.ownerUid && onVisitShop && (
          <button
            type="button"
            className={
              'mt-1 w-full rounded-xl border border-slate-200/90 bg-white text-center text-xs font-bold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 ' +
              (compact ? 'py-2' : 'py-2.5')
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onVisitShop(ad.ownerUid);
            }}
          >
            {t('card.visitShop')}
          </button>
        )}
      </div>
    </article>
  );
}
