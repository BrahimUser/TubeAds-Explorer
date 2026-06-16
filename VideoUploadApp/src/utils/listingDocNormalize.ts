import type { Ad } from '../types/Ad';

/**
 * Canonical listing **write** fields (mobile + website): use these in new documents.
 * Reads still accept legacy aliases below via coercion.
 */
export const LISTING_CANONICAL_FIELDS = [
  'title',
  'description',
  'priceCents',
  'currency',
  'category',
  'city',
  'youtubeVideoId',
  'thumbnailUrl',
  'ownerUid',
  'status',
  'createdAt',
] as const;

/** Coerce integer cents from Firestore — mirrors `marketplace-web` `coercePriceCents`. */
export function coerceListingPriceCents(raw: Record<string, unknown>): number | undefined {
  const r = raw;
  if (typeof r.priceCents === 'number' && Number.isFinite(r.priceCents)) {
    return Math.round(r.priceCents);
  }
  if (typeof r.price_cents === 'number' && Number.isFinite(r.price_cents)) {
    return Math.round(r.price_cents);
  }
  if (typeof r.price === 'number' && Number.isFinite(r.price)) {
    return Math.round(r.price * 100);
  }
  if (typeof r.prix === 'number' && Number.isFinite(r.prix)) {
    return Math.round(r.prix * 100);
  }
  if (typeof r.price === 'string' && r.price.trim()) {
    const n = Number.parseFloat(r.price.replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  if (typeof r.prix === 'string' && r.prix.trim()) {
    const n = Number.parseFloat(String(r.prix).replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return undefined;
}

/** Title / description fallback keys for cross-platform legacy data. */
export function coerceListingTitle(raw: Record<string, unknown>): string | undefined {
  const t = raw.title ?? raw.name ?? raw.titre;
  if (typeof t === 'string' && t.trim()) return t.trim();
  return undefined;
}

export function coerceListingDescription(raw: Record<string, unknown>): string | undefined {
  const d = raw.description ?? raw.desc;
  if (typeof d === 'string') return d;
  return undefined;
}

/** Apply canonical coercions on top of raw Firestore data for display. */
export function applyListingReadCoercions(
  partial: Ad,
  raw: Record<string, unknown>,
): Ad {
  const cents = coerceListingPriceCents(raw);
  const title = coerceListingTitle(raw);
  const description = coerceListingDescription(raw);
  return {
    ...partial,
    ...(cents !== undefined ? { priceCents: cents } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
  };
}
