// VideoPlayerModal — fullscreen lightbox for listing videos.
// Supports YouTube embeds (youtubeVideoId / YouTube URLs) and direct MP4 URLs (videoUrl).
//
// Props:
//   open           boolean       — when true the modal is rendered + focused
//   ad             Ad | null     — the ad to play; provides title, youtubeVideoId, videoUrl
//   playlist       Ad[]          — optional list for prev/next browsing
//   currentIndex   number        — index into playlist (default 0)
//   onChangeIndex  (i) => void   — called when user navigates to another listing
//   onClose        () => void    — fires on backdrop click / ESC / close button
//
// Implementation notes:
//   • We only mount the player while `open` is true, so closing the modal stops playback.
//   • Multi-listing browsing uses Swiper (mouse drag + touch swipe + keyboard arrows).
//   • YouTube iframe keeps click-to-pause; swipe from the left/right edges or use arrows.
//   • Direct file URLs use a native <video> element with controls.
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard } from 'swiper/modules';
import 'swiper/css';
import { resolveAdVideoPlayback } from '../services/listings';
import { Icon } from './Icons';

const CURRENCY_SUFFIX = { MAD: 'MAD', EUR: '€', USD: '$' };

function formatPrice(priceCents, currency = 'MAD') {
  if (typeof priceCents !== 'number' || Number.isNaN(priceCents)) return '';
  const amount = priceCents / 100;
  const grouped = Math.round(amount).toLocaleString('fr-FR');
  const suffix = CURRENCY_SUFFIX[currency] || currency;
  return currency === 'MAD' ? `${grouped} ${suffix}` : `${suffix}${grouped}`;
}

function ListingVideoPlayer({ ad, swipeable }) {
  const playback = resolveAdVideoPlayback(ad);
  const youtubeEmbedUrl =
    playback.kind === 'youtube'
      ? `https://www.youtube.com/embed/${playback.youtubeVideoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`
      : null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
      {youtubeEmbedUrl ? (
        <>
          <iframe
            key={playback.youtubeVideoId}
            src={youtubeEmbedUrl}
            title={ad.title || 'Ad video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className={
              'absolute inset-0 h-full w-full' + (swipeable ? ' swiper-no-swiping' : '')
            }
          />
          {swipeable && (
            <>
              <div
                className="absolute inset-y-0 start-0 z-10 w-14 cursor-grab active:cursor-grabbing sm:w-20"
                aria-hidden
              />
              <div
                className="absolute inset-y-0 end-0 z-10 w-14 cursor-grab active:cursor-grabbing sm:w-20"
                aria-hidden
              />
            </>
          )}
        </>
      ) : playback.kind === 'direct' ? (
        <video
          key={playback.videoUrl}
          src={playback.videoUrl}
          poster={ad.thumbnailUrl || undefined}
          controls
          autoPlay
          playsInline
          className={
            'absolute inset-0 h-full w-full bg-black object-contain' +
            (swipeable ? ' swiper-no-swiping' : '')
          }
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
          No video available for this ad.
        </div>
      )}
    </div>
  );
}

export default function VideoPlayerModal({
  open,
  ad,
  playlist,
  currentIndex = 0,
  onChangeIndex,
  onClose,
}) {
  const { t } = useTranslation();
  const swiperRef = useRef(null);
  const canNavigate = Array.isArray(playlist) && playlist.length > 1;

  const goPrev = useCallback(() => {
    if (!canNavigate) return;
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slidePrev();
      return;
    }
    const next = (currentIndex - 1 + playlist.length) % playlist.length;
    onChangeIndex?.(next);
  }, [canNavigate, currentIndex, onChangeIndex, playlist]);

  const goNext = useCallback(() => {
    if (!canNavigate) return;
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slideNext();
      return;
    }
    const next = (currentIndex + 1) % playlist.length;
    onChangeIndex?.(next);
  }, [canNavigate, currentIndex, onChangeIndex, playlist]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (canNavigate && e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (canNavigate && e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, canNavigate, goPrev, goNext]);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (!open || !swiper || swiper.destroyed || !canNavigate) return;
    const active = swiper.realIndex ?? swiper.activeIndex;
    if (active !== currentIndex) {
      if (swiper.params.loop) swiper.slideToLoop(currentIndex, 0);
      else swiper.slideTo(currentIndex, 0);
    }
  }, [open, currentIndex, canNavigate]);

  if (!open || !ad) return null;

  const player = canNavigate ? (
    <Swiper
      className="video-player-swiper w-full"
      modules={[Keyboard]}
      initialSlide={currentIndex}
      loop={playlist.length > 1}
      grabCursor
      simulateTouch
      touchStartPreventDefault={false}
      keyboard={{ enabled: true, onlyInViewport: true }}
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
      }}
      onSlideChange={(swiper) => {
        const next = swiper.realIndex ?? swiper.activeIndex;
        if (next !== currentIndex) onChangeIndex?.(next);
      }}
    >
      {playlist.map((item) => (
        <SwiperSlide key={item.id}>
          <ListingVideoPlayer ad={item} swipeable />
        </SwiperSlide>
      ))}
    </Swiper>
  ) : (
    <ListingVideoPlayer ad={ad} swipeable={false} />
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ad.title || 'Video player'}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="relative w-full max-w-4xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>

        <div className="relative">
          {player}

          {canNavigate && (
            <>
              <button
                type="button"
                aria-label={t('videoPlayer.previousListing')}
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute start-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white shadow-md transition hover:bg-black/70"
              >
                <Icon name="chevronDown" className="h-5 w-5 rotate-90 rtl:-rotate-90" />
              </button>
              <button
                type="button"
                aria-label={t('videoPlayer.nextListing')}
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute end-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white shadow-md transition hover:bg-black/70"
              >
                <Icon name="chevronDown" className="h-5 w-5 -rotate-90 rtl:rotate-90" />
              </button>
              <span className="absolute bottom-3 end-3 z-20 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white tabular-nums">
                {t('videoPlayer.position', {
                  current: currentIndex + 1,
                  total: playlist.length,
                })}
              </span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-brand-400">
              {formatPrice(ad.priceCents, ad.currency)}
            </div>
            <h3 className="truncate text-base font-semibold leading-tight">
              {ad.title || t('common.untitled')}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
