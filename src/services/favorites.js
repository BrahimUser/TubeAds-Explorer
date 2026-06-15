// Per-user favorites via Express API.
import api, { getAccessToken, silentRequest, unwrap } from '../api/client';

export async function addFavorite(ad) {
  if (!getAccessToken()) throw new Error('You must be signed in to manage favorites.');
  await api.post('/favorites', { listingId: ad.id });
}

export async function removeFavorite(adId) {
  if (!getAccessToken()) throw new Error('You must be signed in to manage favorites.');
  await api.delete(`/favorites/${adId}`);
}

export async function toggleFavorite(ad, currentlyFavorited) {
  if (currentlyFavorited) {
    await removeFavorite(ad.id);
  } else {
    await addFavorite(ad);
  }
}

export async function fetchFavorites() {
  const res = await api.get('/favorites', silentRequest);
  const data = unwrap(res);
  return data.favorites || [];
}

export async function fetchFavoriteIds() {
  const res = await api.get('/favorites', silentRequest);
  const data = unwrap(res);
  const ids = data.ids || (data.favorites || []).map((f) => f.listingId || f.adId);
  return new Set(ids);
}
