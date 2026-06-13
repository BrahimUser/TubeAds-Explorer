// Marketplace listings — Express API (replaces Firestore `listings` collection).
import api, { unwrap } from '../api/client';
import { createPoller } from '../hooks/usePolling';
import { categoryFirestoreValue } from './categories';

export const ANNONCES_COLLECTION = 'listings';

function normCat(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ');
}

export function adMatchesSelectedCategory(ad, selectedTileId) {
  if (!selectedTileId) return true;
  const stored = normCat(ad.category);
  const fromTileId = normCat(categoryFirestoreValue(selectedTileId));
  const slug = normCat(selectedTileId.replace(/-/g, ' '));
  return stored === fromTileId || stored === slug || stored === normCat(selectedTileId);
}

export function adMatchesCity(ad, cityId) {
  if (!cityId) return true;
  return String(ad.city ?? '') === String(cityId);
}

function extractYoutubeVideoId(candidate) {
  if (!candidate || typeof candidate !== 'string') return '';
  const trimmed = candidate.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const embedded = trimmed.match(/(?:youtube\.com\/(?:embed\/|live\/|shorts\/|watch\?(?:.*?&)?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (embedded?.[1]) return embedded[1];
  const watch = trimmed.match(/\bv=([a-zA-Z0-9_-]{11})\b/);
  return watch?.[1] || '';
}

/** Resolve how to play a listing video: YouTube embed or direct file URL. */
export function resolveAdVideoPlayback(ad) {
  if (!ad) return { kind: 'none' };

  const youtubeVideoId =
    (typeof ad.youtubeVideoId === 'string' && extractYoutubeVideoId(ad.youtubeVideoId)) ||
    extractYoutubeVideoId(ad.videoUrl || '');

  if (youtubeVideoId) {
    return { kind: 'youtube', youtubeVideoId };
  }

  const videoUrl = typeof ad.videoUrl === 'string' ? ad.videoUrl.trim() : '';
  if (videoUrl) {
    return { kind: 'direct', videoUrl };
  }

  return { kind: 'none' };
}

function coercePriceCents(raw) {
  if (typeof raw.priceCents === 'number' && Number.isFinite(raw.priceCents)) {
    return Math.round(raw.priceCents);
  }
  if (typeof raw.price_cents === 'number' && Number.isFinite(raw.price_cents)) {
    return Math.round(raw.price_cents);
  }
  if (typeof raw.price === 'number' && Number.isFinite(raw.price)) {
    return Math.round(raw.price * 100);
  }
  return 0;
}

export function parseAd(id, raw) {
  raw = raw && typeof raw === 'object' ? raw : {};

  const rawVideoUrl =
    (typeof raw.videoUrl === 'string' && raw.videoUrl) ||
    (typeof raw.video_url === 'string' && raw.video_url) ||
    '';

  const fromUrlFields = [rawVideoUrl, raw.youtubeUrl, raw.youtube_url]
    .map((v) => (typeof v === 'string' ? extractYoutubeVideoId(v) : ''))
    .find(Boolean);

  const yt =
    (typeof raw.youtubeVideoId === 'string' && extractYoutubeVideoId(raw.youtubeVideoId || '')) ||
    fromUrlFields ||
    '';

  const thumbnailUrl =
    (typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl) ||
    (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '');

  const imageUrls = (() => {
    const out = [];
    if (Array.isArray(raw.imageUrls)) {
      for (const u of raw.imageUrls) {
        if (typeof u === 'string' && u.trim()) out.push(u.trim());
      }
    }
    if (thumbnailUrl && !out.includes(thumbnailUrl)) out.unshift(thumbnailUrl);
    return out.length ? out : thumbnailUrl ? [thumbnailUrl] : [];
  })();

  return {
    id,
    title: String(raw.title ?? raw.name ?? raw.titre ?? ''),
    description: String(raw.description ?? raw.desc ?? ''),
    priceCents: coercePriceCents(raw),
    currency: raw.currency || 'MAD',
    category: String(raw.category ?? ''),
    city: String(raw.city ?? ''),
    youtubeVideoId: yt,
    videoUrl: rawVideoUrl || (yt ? `https://www.youtube.com/watch?v=${yt}` : ''),
    thumbnailUrl,
    imageUrls,
    ownerUid: String(raw.ownerUid ?? raw.ownerId ?? raw.owner_uid ?? ''),
    status: raw.status ?? 'active',
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    viewCount: typeof raw.viewCount === 'number' ? raw.viewCount : null,
  };
}

function timestampMs(ts) {
  if (!ts) return 0;
  if (typeof ts === 'string') return new Date(ts).getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

async function fetchListings(params) {
  const res = await api.get('/listings', { params });
  const { items } = unwrap(res);
  return (items || []).map((d) => parseAd(d.id, d));
}

export function listenAds({ max = 120 } = {}, onChange, onError) {
  return createPoller(
    async () => {
      const items = await fetchListings({ status: 'approved', limit: max });
      items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
      return items.slice(0, max);
    },
    onChange,
    onError,
    10000,
  );
}

export function listenPendingAds(onChange, onError) {
  return createPoller(
    async () => {
      const items = await fetchListings({ status: 'pending', limit: 100 });
      items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
      return items;
    },
    onChange,
    onError,
    10000,
  );
}

export function listenListingsByOwner(ownerUid, onChange, onError) {
  if (!ownerUid) {
    onChange([]);
    return () => {};
  }
  return createPoller(
    async () => {
      const items = await fetchListings({ ownerId: ownerUid, limit: 100 });
      items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
      return items;
    },
    onChange,
    onError,
    10000,
  );
}

export async function getAd(adId) {
  const res = await api.get(`/listings/${adId}`);
  const { listing } = unwrap(res);
  if (!listing) return null;
  return parseAd(listing.id, listing);
}

export async function updateAd(adId, patch) {
  if (!adId) throw new Error('Missing adId');
  if (!patch || typeof patch !== 'object') throw new Error('Missing patch');
  await api.put(`/listings/${adId}`, patch);
}

export async function deleteAd(adId) {
  if (!adId) throw new Error('Missing adId');
  await api.delete(`/listings/${adId}`);
}

export async function approveListing(adId) {
  if (!adId) throw new Error('Missing adId');
  await api.post(`/listings/${adId}/approve`);
}

export async function rejectListing(adId) {
  if (!adId) throw new Error('Missing adId');
  await api.post(`/listings/${adId}/reject`);
}

export function adIsVisibleOnPublicHome(ad) {
  const s = String(ad?.status ?? '').toLowerCase();
  return s === 'approved';
}

export function listenMyAds(uid, onChange, onError) {
  return listenListingsByOwner(uid, onChange, onError);
}
