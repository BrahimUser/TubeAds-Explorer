/**
 * Icônes réseaux sociaux (glyphs proches des logos officiels) — SVG inline.
 */

const BADGE_COPY = {
  en: {
    googlePlay: { line1: 'GET IT ON', line2: 'Google Play' },
    appStore: { line1: 'Download on the', line2: 'App Store' },
  },
  fr: {
    googlePlay: { line1: 'DISPONIBLE SUR', line2: 'Google Play' },
    appStore: { line1: "Télécharger dans l'", line2: 'App Store' },
  },
  ar: {
    googlePlay: { line1: 'احصل عليه من', line2: 'Google Play' },
    appStore: { line1: 'تنزيل على', line2: 'App Store' },
  },
};

function badgeLang(lang) {
  const code = String(lang || 'ar').split('-')[0].toLowerCase();
  return BADGE_COPY[code] ? code : 'en';
}

function badgeFont(lang) {
  return badgeLang(lang) === 'ar'
    ? 'Noto Sans Arabic, system-ui, sans-serif'
    : 'system-ui, sans-serif';
}

function GooglePlayIcon() {
  return (
    <>
      <path d="M14 13 L14 41 L35 27 Z" fill="url(#gpGradFooter)" />
      <path d="M14 13 L35 27 L27 33 L14 13 Z" fill="#3DDC84" />
      <path d="M14 41 L27 21 L35 27 L14 41 Z" fill="#FFC107" />
      <path d="M27 21 L35 27 L27 33 Z" fill="#FF5722" />
      <defs>
        <linearGradient
          id="gpGradFooter"
          x1="14"
          y1="13"
          x2="35"
          y2="41"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00D4FF" />
          <stop offset="1" stopColor="#4285F4" />
        </linearGradient>
      </defs>
    </>
  );
}

function AppStoreIcon() {
  return (
    <path
      fill="#fff"
      transform="translate(12, 11) scale(1.15)"
      d="M15.768 12.5c-.03-3.02 2.407-4.484 2.514-4.54a5.218 5.218 0 0 0-4.128-2.254c-1.766-.179-3.432 1.045-4.322 1.045-.904 0-2.268-1.016-3.738-.988a5.486 5.486 0 0 0-4.655 2.813c-1.982 3.437-.504 8.513 1.406 11.302.942 1.363 2.063 2.895 3.529 2.841 1.415-.057 1.948-.917 3.658-.917 1.693 0 2.182.917 3.663.887 1.514-.025 2.476-1.378 3.398-2.755 1.072-1.556 1.512-3.074 1.538-3.151-.033-.015-2.948-1.133-2.976-4.486zm2.842-8.232a5.038 5.038 0 0 0 1.155-3.597c-1.118.066-2.483.745-3.291 1.688-.766.887-1.436 2.306-1.256 3.676 1.328.103 2.672-.674 3.392-1.767z"
    />
  );
}

export function FacebookOfficialIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function InstagramOfficialIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function TikTokOfficialIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function YouTubeOfficialIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function GooglePlayBadgeSvg({ className, lang = 'ar' }) {
  const code = badgeLang(lang);
  const copy = BADGE_COPY[code].googlePlay;
  const font = badgeFont(code);

  return (
    <svg className={className} viewBox="0 0 180 54" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="180" height="54" rx="10" fill="#000" />
      <GooglePlayIcon />
      <text x="48" y="22" fill="#fff" fontSize="9" fontFamily={font}>
        {copy.line1}
      </text>
      <text x="48" y="40" fill="#fff" fontSize="17" fontWeight="700" fontFamily={font}>
        {copy.line2}
      </text>
    </svg>
  );
}

export function AppStoreBadgeSvg({ className, lang = 'ar' }) {
  const code = badgeLang(lang);
  const copy = BADGE_COPY[code].appStore;
  const font = badgeFont(code);

  return (
    <svg className={className} viewBox="0 0 180 54" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="180" height="54" rx="10" fill="#000" />
      <AppStoreIcon />
      <text x="52" y="22" fill="#fff" fontSize="9" fontFamily={font}>
        {copy.line1}
      </text>
      <text x="52" y="40" fill="#fff" fontSize="17" fontWeight="700" fontFamily={font}>
        {copy.line2}
      </text>
    </svg>
  );
}
