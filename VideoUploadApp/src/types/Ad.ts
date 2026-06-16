import type { CityId } from '../config/marketplace';

/**
 * Lifecycle of a marketplace listing.
 * Web moderation uses `pending` → `approved` | `rejected`; legacy/mobile used `active`.
 */
export type AdStatus =
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'active'
  | 'sold'
  | 'hidden';

/** Supported currencies. Extend the union when you add a new market. */
export type Currency = 'MAD' | 'EUR' | 'USD';

/**
 * A marketplace listing from the Express API.
 */
export type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: Currency;
  category: string;
  city: CityId;
  youtubeVideoId: string;
  thumbnailUrl: string;
  ownerUid: string;
  status: AdStatus;
  createdAt: string | null;
};

/**
 * Shape accepted by `createAd(...)`. The server fills in `id`, `ownerUid`,
 * `status`, and `createdAt`, so the caller doesn't supply them.
 */
export type NewAdInput = Pick<
  Ad,
  | 'title'
  | 'description'
  | 'priceCents'
  | 'currency'
  | 'category'
  | 'city'
  | 'youtubeVideoId'
  | 'thumbnailUrl'
>;
