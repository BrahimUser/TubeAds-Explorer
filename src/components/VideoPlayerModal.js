// VideoPlayerModal — fullscreen lightbox that embeds the YouTube video for a
// given ad. The web shows the same YouTube ID the React Native mobile app
// stores on each `annonces` doc, so opening a card on the web plays the
// exact video posted from the app.
//
// Props:
//   open       boolean       — when true the modal is rendered + focused
//   ad         Ad | null     — the ad to play; provides title and youtubeVideoId
//   onClose    () => void    — fires on backdrop click / ESC / close button
//
// Implementation notes:
//   • We only mount the <iframe> while `open` is true, so closing the
//     modal kills the embed (and stops audio) without needing the YouTube
//     iframe API.
//   • `?autoplay=1&modestbranding=1&rel=0` mirrors the parameters the
//     mobile player uses.
//   • A keyboard listener on the document closes the modal on ESC.
import { useEffect } from 'react';
import { Icon } from './Icons';

const CURRENCY_SUFFIX = { MAD: 'MAD', EUR: '€', USD: '$' };

function formatPrice(priceCents, currency = 'MAD') {
  if (typeof priceCents !== 'number' || Number.isNaN(priceCents)) return '';
  const amount = priceCents / 100;
  const grouped = Math.round(amount).toLocaleString('fr-FR');
  const suffix = CURRENCY_SUFFIX[currency] || currency;
  return currency === 'MAD' ? `${grouped} ${suffix}` : `${suffix}${grouped}`;
}

export default function VideoPlayerModal({ open, ad, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    // Lock background scroll while the lightbox is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !ad) return null;

  const videoId = ad.youtubeVideoId;
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ad.title || 'Video player'}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="relative w-full max-w-4xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-12 right-0 grid place-items-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>

        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          {embedUrl ? (
            <iframe
              key={videoId}
              src={embedUrl}
              title={ad.title || 'Ad video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">
              No video available for this ad.
            </div>
          )}
        </div>

        {/* Metadata strip: price + title, mirroring the AdCard layout */}
        <div className="mt-4 flex items-end justify-between gap-3 text-white">
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-brand-400">
              {formatPrice(ad.priceCents, ad.currency)}
            </div>
            <h3 className="text-base font-semibold leading-tight truncate">
              {ad.title || 'Untitled'}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
