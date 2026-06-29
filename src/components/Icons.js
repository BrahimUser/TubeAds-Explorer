// Tiny inline-SVG icon set so we don't pull in an icon library.
// Stroke-based, follow `currentColor`, sized via Tailwind classes (w-*/h-*).

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function Icon({ name, className = 'w-5 h-5', ...rest }) {
  const Cmp = ICONS[name] || ICONS.grid;
  return <Cmp className={className} {...rest} />;
}

const ICONS = {
  search: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  heart: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
    </svg>
  ),
  heartFilled: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
    </svg>
  ),
  pin: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  clock: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  chevronDown: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  check: (props) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  close: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  send: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  ),
  sprout: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 22V12" />
      <path d="M12 12c-4-6-8-6-8-2 0 3 3 5 8 2" />
      <path d="M12 12c4-6 8-6 8-2 0 3-3 5-8 2" />
    </svg>
  ),
  car: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M5 17V11l2-5h10l2 5v6" />
      <path d="M3 17h18" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  ),
  home: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5h4v5" />
    </svg>
  ),
  cpu: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  ),
  tshirt: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 7 8 4l4 2 4-2 4 3-3 3-1-1v11H8V9L7 10 4 7Z" />
    </svg>
  ),
  sofa: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4H4v-4Z" />
      <path d="M4 16v2M20 16v2M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
    </svg>
  ),
  briefcase: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  ),
  wrench: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M14 6a4 4 0 1 1 4 4l-9 9-3 1 1-3 7-7Z" />
    </svg>
  ),
  rug: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M4 9h16M4 15h16M8 6v12M16 6v12" />
    </svg>
  ),
  grid: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  ),
  tag: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M3 12V4h8l10 10-8 8L3 12Z" />
      <circle cx="8" cy="8" r="1.6" />
    </svg>
  ),
  message: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  ),
  plus: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  user: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  bell: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  globe: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </svg>
  ),
  play: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  ),
  baby: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="9.5" r="3.5" />
      <path d="M6 21a6 6 0 1 1 12 0" />
      <circle cx="8.25" cy="13" r="1" />
      <circle cx="15.75" cy="13" r="1" />
    </svg>
  ),
  shield: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  smartphone: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="6.5" y="3" width="11" height="18" rx="2" />
      <path d="M10 19h4" />
    </svg>
  ),
  phone: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  ),
  alertTriangle: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  fileText: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  soccer: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-2 3.5-2 14.5 0 18M3 12c3.5 2 14.5 2 18 0" />
      <path d="m7.5 8.5 3 2.5M13.5 8.5 17 11M9 15l6-1" />
    </svg>
  ),
  star: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M12 2l3 6 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 8.9 9 8z" />
    </svg>
  ),
  starFilled: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  eye: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  refresh: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  ),
  logout: (props) => (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};
