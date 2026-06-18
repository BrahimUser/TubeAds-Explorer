import type { Ad, NewAdInput } from '../types/Ad';
import type { CategoryId } from '../config/marketplace';
import { categoryFirestoreValue } from '../config/marketplace';
import { applyListingReadCoercions } from '../utils/listingDocNormalize';
import api, { silentRequest, unwrap } from '../api/client';
import { resolveDevServerUrl } from '../config/api';
import { createPoller } from '../hooks/usePolling';

function extractYoutubeVideoId(candidate: string): string {
  if (!candidate) return '';
  const trimmed = candidate.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const embedded = trimmed.match(
    /(?:youtube\.com\/(?:embed\/|live\/|shorts\/|watch\?(?:.*?&)?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (embedded?.[1]) return embedded[1];
  const watch = trimmed.match(/\bv=([a-zA-Z0-9_-]{11})\b/);
  return watch?.[1] || '';
}

function parseAd(id: string, raw: Record<string, unknown>): Ad {
  const rawVideoUrl =
    (typeof raw.videoUrl === 'string' && raw.videoUrl) ||
    (typeof raw.video_url === 'string' && raw.video_url) ||
    '';

  const youtubeVideoId =
    (typeof raw.youtubeVideoId === 'string' && extractYoutubeVideoId(raw.youtubeVideoId)) ||
    extractYoutubeVideoId(rawVideoUrl) ||
    '';

  const rawThumbnail =
    (typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl) ||
    (youtubeVideoId ? `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg` : '');
  const thumbnailUrl = resolveDevServerUrl(rawThumbnail);

  const base: Ad = {
    id,
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    priceCents: Number(raw.priceCents) || 0,
    currency: (raw.currency as Ad['currency']) ?? 'MAD',
    category: String(raw.category ?? ''),
    city: (raw.city as Ad['city']) ?? 'casablanca',
    youtubeVideoId,
    thumbnailUrl,
    ownerUid: String(raw.ownerUid ?? raw.ownerId ?? ''),
    status: String(raw.status ?? 'pending').toLowerCase() as Ad['status'],
    createdAt: (raw.createdAt as string | null) ?? null,
  };
  return applyListingReadCoercions(base, raw);
}

export async function fetchListings(params?: {
  status?: string;
  category?: string;
  ownerId?: string;
  search?: string;
  limit?: number;
}): Promise<Ad[]> {
  const res = await api.get('/listings', { ...silentRequest, params });
  const data = unwrap<{ items: Record<string, unknown>[] }>(res);
  return (data.items || []).map((d) => parseAd(String(d.id), d));
}

export async function getAd(adId: string): Promise<Ad | null> {
  const res = await api.get(`/listings/${adId}`);
  const data = unwrap<{ listing: Record<string, unknown> | null }>(res);
  if (!data.listing) return null;
  return parseAd(String(data.listing.id), data.listing);
}

export async function createAd(input: NewAdInput): Promise<string> {
  const res = await api.post('/listings', input);
  const data = unwrap<{ listing: Record<string, unknown> }>(res);
  if (!data.listing?.id) throw new Error('Listing not created');
  return String(data.listing.id);
}

export async function approveListing(adId: string): Promise<void> {
  if (!adId) throw new Error('Missing ad id');
  await api.post(`/listings/${adId}/approve`);
}

export async function rejectListing(adId: string): Promise<void> {
  if (!adId) throw new Error('Missing ad id');
  await api.post(`/listings/${adId}/reject`);
}

export function listenToAds(
  onChange: (ads: Ad[]) => void,
  onError: (err: Error) => void,
  options?: { category?: CategoryId },
): () => void {
  return createPoller(
    async () => {
      const params: Record<string, string | number> = {
        status: 'approved',
        limit: 50,
      };
      if (options?.category) {
        params.category = categoryFirestoreValue(options.category);
      }
      return fetchListings(params);
    },
    onChange,
    onError,
    10000,
  );
}

export function listenToPendingAds(
  onChange: (ads: Ad[]) => void,
  onError: (err: Error) => void,
): () => void {
  return createPoller(
    () => fetchListings({ status: 'pending', limit: 80 }),
    onChange,
    onError,
    5000,
  );
}
