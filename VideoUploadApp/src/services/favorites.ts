import type { Ad, Currency } from '../types/Ad';
import type { CityId } from '../config/marketplace';
import api, { getAccessToken, silentRequest, unwrap } from '../api/client';
import { apiDateToMs } from '../utils/apiMappers';

export type FavoriteItem = {
  adId: string;
  title: string;
  priceCents: number;
  currency: Currency;
  thumbnailUrl: string;
  city: CityId;
  ownerUid: string;
  createdAtMs: number | null;
};

function parseFavorite(raw: Record<string, unknown>): FavoriteItem {
  const adId = String(raw.adId ?? raw.listingId ?? raw.id ?? '');
  return {
    adId,
    title: String(raw.title ?? ''),
    priceCents: Number(raw.priceCents) || 0,
    currency: (raw.currency as Currency) ?? 'MAD',
    thumbnailUrl: String(raw.thumbnailUrl ?? ''),
    city: (raw.city as CityId) ?? 'casablanca',
    ownerUid: String(raw.ownerUid ?? raw.ownerId ?? ''),
    createdAtMs: apiDateToMs(raw.createdAt as string | null),
  };
}

async function requireAuth(): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('You must be signed in to manage favorites.');
}

export async function addFavorite(ad: Ad): Promise<void> {
  await requireAuth();
  await api.post('/favorites', { listingId: ad.id });
}

export async function removeFavorite(adId: string): Promise<void> {
  await requireAuth();
  await api.delete(`/favorites/${adId}`);
}

export async function toggleFavorite(ad: Ad, currentlyFavorited: boolean): Promise<void> {
  if (currentlyFavorited) {
    await removeFavorite(ad.id);
  } else {
    await addFavorite(ad);
  }
}

export async function fetchFavorites(): Promise<FavoriteItem[]> {
  const token = await getAccessToken();
  if (!token) return [];
  const res = await api.get('/favorites', silentRequest);
  const data = unwrap<{ favorites: Record<string, unknown>[] }>(res);
  return (data.favorites || []).map((f) => parseFavorite(f));
}

export async function fetchFavoriteIds(): Promise<Set<string>> {
  const token = await getAccessToken();
  if (!token) return new Set();
  const res = await api.get('/favorites', silentRequest);
  const data = unwrap<{ ids?: string[]; favorites?: Record<string, unknown>[] }>(res);
  const ids =
    data.ids ||
    (data.favorites || []).map((f) => String(f.listingId ?? f.adId ?? ''));
  return new Set(ids.filter(Boolean));
}
