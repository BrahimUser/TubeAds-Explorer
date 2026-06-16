import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
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
 * A marketplace listing as stored in Firestore.
 *
 * Notes:
 * - `priceCents` is INTEGER cents/centimes — never a float. Floats break
 *   currency math (0.1 + 0.2 !== 0.3). Format on the way out.
 * - `youtubeVideoId` is the id returned by YouTube after upload (`videos.insert`).
 * - `thumbnailUrl` is derived from `youtubeVideoId` at write time so listing
 *   reads don't have to compute it. We use the YouTube CDN URL because the
 *   video is hosted on YouTube; switch this if you migrate to Firebase
 *   Storage / Mux / Cloudinary later.
 * - `category` is the English label stored in Firestore (e.g. `Electronics`,
 *   `Real Estate`), matching Add Post and Home filters. Legacy slug ids
 *   (e.g. `electronics`) are still accepted and normalized for display.
 * - `city` stays a stable id (e.g. `casablanca`).
 * - `createdAt` is set via `serverTimestamp()` so the device clock can't be
 *   used to fake "newer" listings.
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
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
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
