import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import type { Ad, NewAdInput } from '../types/Ad';
import { categoryFirestoreValue, type CategoryId } from '../config/marketplace';
import { applyListingReadCoercions } from '../utils/listingDocNormalize';

/**
 * Firestore data layer for the marketplace.
 *
 * Collection: `listings`. One document per posted listing.
 *
 * All reads/writes go through this module so:
 *   - The `Ad` shape is enforced in one place.
 *   - The Firestore SDK isn't sprinkled across screens.
 *
 * IMPORTANT: this module is useless until the Firebase project is
 * configured natively (google-services.json on Android, GoogleService-Info.plist
 * on iOS). Without those, every call below throws "default app not initialized".
 */

const listingsCol = () => firestore().collection('listings');

function mapListingDoc(
  d: FirebaseFirestoreTypes.QueryDocumentSnapshot | FirebaseFirestoreTypes.DocumentSnapshot,
): Ad {
  const raw = d.data() as Record<string, unknown> & Omit<Ad, 'id' | 'youtubeVideoId'>;
  const youtubeVideoId =
    (typeof raw.youtubeVideoId === 'string' && raw.youtubeVideoId) ||
    (typeof raw.videoId === 'string' && raw.videoId) ||
    '';
  const { videoId: _legacy, ...rest } = raw as Omit<Ad, 'id'> & { videoId?: string };
  void _legacy;
  const base: Ad = {
    id: d.id,
    ...rest,
    youtubeVideoId,
    thumbnailUrl:
      typeof rest.thumbnailUrl === 'string' && rest.thumbnailUrl
        ? rest.thumbnailUrl
        : youtubeVideoId
          ? `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`
          : '',
  };
  return applyListingReadCoercions(base, raw as Record<string, unknown>);
}

/**
 * Create a new ad document. The server fills in `id`, `ownerUid`,
 * `status`, and `createdAt`.
 *
 * New listings start as `pending` so they match the website moderation queue
 * (`marketplace-web`); the public feed listens for `approved` only.
 *
 * **Field names:** camelCase only on write (`priceCents`, …). See `listingDocNormalize.ts`.
 */
export async function createAd(input: NewAdInput): Promise<string> {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to post an ad.');
  }
  const ref = await listingsCol().add({
    ...input,
    ownerUid: uid,
    status: 'pending' as const,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export type AdsListenMeta = {
  /** `true` once this snapshot reflects a server round-trip (index ready / query executed on backend). */
  isFromServer: boolean;
};

export function isFirestoreIndexBuildingError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const msg = String((err as Error)?.message ?? '');
  return (
    code === 'firestore/failed-precondition' ||
    msg.includes('FAILED_PRECONDITION') ||
    /requires an index/i.test(msg)
  );
}

/**
 * Real-time public feed: `onSnapshot` updates the UI when `status` becomes `approved`.
 * Same filter as `marketplace-web` `listenAds`.
 */
export function listenToAds(
  onChange: (ads: Ad[], meta: AdsListenMeta) => void,
  onError: (err: Error) => void,
  options?: { category?: CategoryId },
): () => void {
  let q = listingsCol()
    .where('status', '==', 'approved') as FirebaseFirestoreQuery;
  if (options?.category) {
    q = q.where('category', '==', categoryFirestoreValue(options.category));
  }
  return q
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap) {
          onChange([], { isFromServer: false });
          return;
        }
        const items: Ad[] = snap.docs.map(mapListingDoc);
        onChange(items, { isFromServer: !snap.metadata.fromCache });
      },
      (err) => onError(err as Error),
    );
}

/** Moderation queue — real-time `onSnapshot`; items drop when status changes from `pending`. */
export function listenToPendingAds(
  onChange: (ads: Ad[]) => void,
  onError: (err: Error) => void,
): () => void {
  return listingsCol()
    .where('status', '==', 'pending')
    .onSnapshot(
      (snap) => {
        const items = snap.docs.map(mapListingDoc);
        items.sort((a, b) => {
          const ta = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        onChange(items);
      },
      (err) => onError(err as Error),
    );
}

export async function approveListing(adId: string): Promise<void> {
  if (!adId) throw new Error('Missing ad id');
  await listingsCol().doc(adId).update({
    status: 'approved',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

export async function rejectListing(adId: string): Promise<void> {
  if (!adId) throw new Error('Missing ad id');
  await listingsCol().doc(adId).update({
    status: 'rejected',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
}

type FirebaseFirestoreQuery = ReturnType<ReturnType<typeof listingsCol>['where']>;

export async function getAd(adId: string): Promise<Ad | null> {
  const doc = await listingsCol().doc(adId).get();
  if (!doc.exists()) return null;
  return mapListingDoc(doc);
}
