// Per-user favorites — exact same Firestore layout the mobile app uses
// (VideoUploadApp/src/services/favorites.ts).
//
//   users/{uid}/favorites/{adId}
//
// The doc id is the ad id, so toggling is O(1) and the heart icon stays in
// sync between web and mobile in real time.
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

function favCol(uid) {
  return collection(db, 'users', uid, 'favorites');
}

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in to manage favorites.');
  return uid;
}

export async function addFavorite(ad) {
  const uid = requireUid();
  await setDoc(
    doc(favCol(uid), ad.id),
    {
      adId: ad.id,
      title: ad.title,
      priceCents: ad.priceCents,
      currency: ad.currency,
      thumbnailUrl: ad.thumbnailUrl,
      city: ad.city,
      ownerUid: ad.ownerUid,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function removeFavorite(adId) {
  const uid = requireUid();
  await deleteDoc(doc(favCol(uid), adId));
}

export async function toggleFavorite(ad, currentlyFavorited) {
  if (currentlyFavorited) {
    await removeFavorite(ad.id);
  } else {
    await addFavorite(ad);
  }
}

/**
 * Live `Set<adId>` of the user's favorites. The card renders the filled heart
 * by checking `set.has(ad.id)` — O(1) per render.
 */
export function listenFavoriteIds(uid, onChange, onError) {
  return onSnapshot(
    favCol(uid),
    (snap) => {
      const set = new Set();
      snap.docs.forEach((d) => set.add(d.id));
      onChange(set);
    },
    (err) => onError && onError(err),
  );
}
