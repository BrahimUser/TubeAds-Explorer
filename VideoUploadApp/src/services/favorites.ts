import auth from '@react-native-firebase/auth';
import firestore, {
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import type { Ad, Currency } from '../types/Ad';
import type { CityId } from '../config/marketplace';

/**
 * Per-user favorites.
 *
 * Layout in Firestore:
 *   users/{uid}/favorites/{adId}
 *
 * The doc id is the ad id, so membership lookups are O(1) (no query
 * needed). The full document denormalizes just enough product info
 * (`title`, `priceCents`, `currency`, `thumbnailUrl`, `city`) to render
 * the favorites grid without re-fetching the parent listing — useful
 * because the original ad may have been sold or hidden.
 *
 * Security rules (deploy separately, not in this file):
 *   match /users/{userId}/favorites/{adId} {
 *     allow read, write: if request.auth != null && request.auth.uid == userId;
 *   }
 */

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

function favoritesCol(uid: string) {
  return firestore().collection('users').doc(uid).collection('favorites');
}

function requireUid(): string {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to manage favorites.');
  return uid;
}

/** Add an ad to the current user's favorites (idempotent — uses set). */
export async function addFavorite(ad: Ad): Promise<void> {
  const uid = requireUid();
  await favoritesCol(uid)
    .doc(ad.id)
    .set(
      {
        adId: ad.id,
        title: ad.title,
        priceCents: ad.priceCents,
        currency: ad.currency,
        thumbnailUrl: ad.thumbnailUrl,
        city: ad.city,
        ownerUid: ad.ownerUid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/** Remove an ad from the current user's favorites. */
export async function removeFavorite(adId: string): Promise<void> {
  const uid = requireUid();
  await favoritesCol(uid).doc(adId).delete();
}

/**
 * Toggle the favorite state, using the locally-known status to skip a
 * server round-trip. Pass `currentlyFavorited` from the live listener
 * snapshot to keep this O(1).
 */
export async function toggleFavorite(
  ad: Ad,
  currentlyFavorited: boolean,
): Promise<void> {
  if (currentlyFavorited) {
    await removeFavorite(ad.id);
  } else {
    await addFavorite(ad);
  }
}

function timestampToMs(
  ts: FirebaseFirestoreTypes.Timestamp | undefined | null,
): number | null {
  if (!ts) return null;
  if (typeof (ts as { toMillis?: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  const secs = (ts as { seconds?: number }).seconds;
  return secs != null ? secs * 1000 : null;
}

function parseFavoriteDoc(
  id: string,
  raw: Record<string, unknown>,
): FavoriteItem {
  return {
    adId: (raw.adId as string | undefined) ?? id,
    title: String(raw.title ?? ''),
    priceCents: Number(raw.priceCents) || 0,
    currency: (raw.currency as Currency) ?? 'MAD',
    thumbnailUrl: String(raw.thumbnailUrl ?? ''),
    city: (raw.city as CityId) ?? ('casablanca' as CityId),
    ownerUid: String(raw.ownerUid ?? ''),
    createdAtMs: timestampToMs(
      raw.createdAt as FirebaseFirestoreTypes.Timestamp | undefined,
    ),
  };
}

/**
 * Subscribes to the live set of favorited ad ids for the given user.
 * Used by product cards / detail screens for the heart fill state — a
 * `Set` lets each card do an O(1) `has` check on every render.
 */
export function listenFavoriteIds(
  uid: string,
  onChange: (ids: Set<string>) => void,
  onError?: (err: Error) => void,
): () => void {
  return favoritesCol(uid).onSnapshot(
    (snap) => {
      const set = new Set<string>();
      snap.docs.forEach((d) => set.add(d.id));
      onChange(set);
    },
    (err) => onError?.(err as Error),
  );
}

/**
 * Subscribes to the user's full favorites list, newest first. Used by
 * the Favorites tab to render the grid.
 */
export function listenFavorites(
  uid: string,
  onChange: (items: FavoriteItem[]) => void,
  onError?: (err: Error) => void,
): () => void {
  return favoritesCol(uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snap) => {
        const items = snap.docs.map((d) => parseFavoriteDoc(d.id, d.data()));
        onChange(items);
      },
      (err) => onError?.(err as Error),
    );
}
