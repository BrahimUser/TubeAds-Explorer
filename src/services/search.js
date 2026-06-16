import api, { silentRequest, unwrap } from '../api/client';

function parseSearchHit(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    thumbnailUrl: String(raw.thumbnailUrl ?? ''),
    priceCents: typeof raw.priceCents === 'number' ? raw.priceCents : 0,
    currency: raw.currency || 'MAD',
    category: String(raw.category ?? ''),
    city: String(raw.city ?? ''),
  };
}

export async function searchListings(q, { signal } = {}) {
  const trimmed = String(q ?? '').trim();
  const res = await api.get('/listings/search', {
    ...silentRequest,
    params: { q: trimmed, limit: 10 },
    signal,
  });
  const { items } = unwrap(res);
  return (items || []).map((d) => parseSearchHit(d)).filter(Boolean);
}
