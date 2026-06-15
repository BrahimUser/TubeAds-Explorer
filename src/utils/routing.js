import { FOOTER_INFO_PATHS } from '../constants/footerLinks';

export function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '') return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

export const LISTINGS_PAGE_PATH = '/listings';

export const SELLERS_PAGE_PATH = '/sellers';

export const MY_ADS_PAGE_PATH = '/my-ads';

export const MY_FAVOURITES_PAGE_PATH = '/my-favourites';

export function isListingsPagePath(pathname) {
  return normalizePathname(pathname) === LISTINGS_PAGE_PATH;
}

export function isSellersPagePath(pathname) {
  return normalizePathname(pathname) === SELLERS_PAGE_PATH;
}

export function isMyAdsPagePath(pathname) {
  return normalizePathname(pathname) === MY_ADS_PAGE_PATH;
}

export function isMyFavouritesPagePath(pathname) {
  return normalizePathname(pathname) === MY_FAVOURITES_PAGE_PATH;
}

export function isAdminDashboardPath(pathname) {
  return normalizePathname(pathname) === ADMIN_DASHBOARD_PATH;
}

/** `/shop/:userId` — seller boutique page */
export function matchShopPath(pathname) {
  const p = normalizePathname(pathname);
  const m = p.match(/^\/shop\/([^/]+)$/);
  if (!m) return null;
  try {
    return { userId: decodeURIComponent(m[1]) };
  } catch {
    return { userId: m[1] };
  }
}

export function shopPathForUser(userId) {
  if (!userId) return '/';
  return `/shop/${encodeURIComponent(userId)}`;
}

const LISTING_PATH_RE = /^\/listing\/([^/]+)$/;

/** `/listing/:id` — product detail page */
export function matchListingPath(pathname) {
  const p = normalizePathname(pathname);
  const m = p.match(LISTING_PATH_RE);
  if (!m) return null;
  try {
    return { listingId: decodeURIComponent(m[1]) };
  } catch {
    return { listingId: m[1] };
  }
}

export function listingPathForId(listingId) {
  if (!listingId) return '/';
  return `/listing/${encodeURIComponent(listingId)}`;
}

const CHECKOUT_PATH_RE = /^\/checkout\/([^/]+)$/;

/** @deprecated Checkout UI removed; `matchCheckoutPath` is kept for redirects only. */
export function matchCheckoutPath(pathname) {
  const p = normalizePathname(pathname);
  const m = p.match(CHECKOUT_PATH_RE);
  if (!m) return null;
  try {
    return { listingId: decodeURIComponent(m[1]) };
  } catch {
    return { listingId: m[1] };
  }
}

/** @deprecated Use listing PDP + chat; kept for bookmarks / old links. */
export function checkoutPathForListing(listingId) {
  if (!listingId) return '/';
  return `/checkout/${encodeURIComponent(listingId)}`;
}

/** Pages statiques liées au footer (qui sommes-nous, aide, CGU, etc.). */
export function matchFooterInfoPath(pathname) {
  const p = normalizePathname(pathname);
  return FOOTER_INFO_PATHS.has(p) ? p : null;
}

export function subscribePathname(onChange) {
  function handler() {
    onChange(normalizePathname(window.location.pathname));
  }
  window.addEventListener('popstate', handler);
  return () => window.removeEventListener('popstate', handler);
}

export function pushPath(nextPathname) {
  const next = normalizePathname(nextPathname);
  window.history.pushState({}, '', next);
}
