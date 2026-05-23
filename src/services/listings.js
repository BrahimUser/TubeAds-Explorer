// Read-only Marketplace feed — Firestore `listings` collection (same as the RN app)
// shared with the React Native Video Ads app (`src/firebase.js` → Firestore db).
//
// Real-time via a single collection subscription (no redundant duplicate
// listeners). Field coercion in `parseAd` keeps web + mobile payloads aligned
// (youtubeVideoId, videoUrl, camelCase/snake_case, etc.).
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { categoryFirestoreValue } from './categories';

/**
 * Collection ID must match the React Native app (`VideoUploadApp/src/services/firestore.ts`
 * → `firestore().collection('listings')`). If your deployed app still uses another name,
 * change only this string.
 */
export const ANNONCES_COLLECTION = 'listings';

/** Canonical fields for **new** writes: camelCase `priceCents`, `youtubeVideoId`, `ownerUid`, `status`, …
 * (`parseAd` still reads legacy keys like `prix`, `titre`, `price_cents` for old documents.)
 */
function normCat(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ');
}

export function adMatchesSelectedCategory(ad, selectedTileId) {
  if (!selectedTileId) return true;
  const stored = normCat(ad.category);
  const fromTileId = normCat(categoryFirestoreValue(selectedTileId));
  const slug = normCat(selectedTileId.replace(/-/g, ' '));
  return stored === fromTileId || stored === slug || stored === normCat(selectedTileId);
}

/** Hero / filter by city id (same ids as `categories.js` CITIES). */
export function adMatchesCity(ad, cityId) {
  if (!cityId) return true;
  return String(ad.city ?? '') === String(cityId);
}

/** Strip a bare YouTube ID or parse one from youtube.com / youtu.be URLs. */
function extractYoutubeVideoId(candidate) {
  if (!candidate || typeof candidate !== 'string') return '';
  const trimmed = candidate.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const embedded = trimmed.match(/(?:youtube\.com\/(?:embed\/|live\/|shorts\/|watch\?(?:.*?&)?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (embedded?.[1]) return embedded[1];
  const watch = trimmed.match(/\bv=([a-zA-Z0-9_-]{11})\b/);
  return watch?.[1] || '';
}

/**
 * Hydrate a Firestore listing document into the canonical `Ad` shape.
 * Mirrors mobile fields: title, priceCents, category, thumbnail, youtubeVideoId /
 * videoUrl / video_url, etc.
 */
function coercePriceCents(raw) {
  if (typeof raw.priceCents === 'number' && Number.isFinite(raw.priceCents)) {
    return Math.round(raw.priceCents);
  }
  if (typeof raw.price_cents === 'number' && Number.isFinite(raw.price_cents)) {
    return Math.round(raw.price_cents);
  }
  if (typeof raw.price === 'number' && Number.isFinite(raw.price)) {
    return Math.round(raw.price * 100);
  }
  if (typeof raw.price === 'string' && raw.price.trim()) {
    const n = Number.parseFloat(raw.price.replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  if (typeof raw.prix === 'number' && Number.isFinite(raw.prix)) {
    return Math.round(raw.prix * 100);
  }
  if (typeof raw.prix === 'string' && raw.prix.trim()) {
    const n = Number.parseFloat(String(raw.prix).replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n * 100);
  }
  return 0;
}

export function parseAd(id, raw) {
  // Defensive: Firestore can return unexpected shapes; never crash the UI.
  raw = raw && typeof raw === 'object' ? raw : {};

  // eslint-disable-next-line no-console
  console.log('Fetched Ad Data:', raw);

  const rawVideoUrl =
    (typeof raw.videoUrl === 'string' && raw.videoUrl) ||
    (typeof raw.video_url === 'string' && raw.video_url) ||
    '';

  const fromUrlFields = [
    rawVideoUrl,
    raw.youtubeUrl,
    raw.youtube_url,
  ]
    .map((v) => (typeof v === 'string' ? extractYoutubeVideoId(v) : ''))
    .find(Boolean);

  const yt =
    (typeof raw.youtubeVideoId === 'string' &&
      extractYoutubeVideoId(raw.youtubeVideoId || '')) ||
    (typeof raw.youtube_video_id === 'string' &&
      extractYoutubeVideoId(raw.youtube_video_id || '')) ||
    (typeof raw.videoId === 'string' &&
      extractYoutubeVideoId(raw.videoId || '')) ||
    (typeof raw.video_id === 'string' &&
      extractYoutubeVideoId(raw.video_id || '')) ||
    fromUrlFields ||
    '';

  const thumbnailUrl =
    (typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl) ||
    (typeof raw.thumbnail_url === 'string' && raw.thumbnail_url) ||
    (typeof raw.imageUrl === 'string' && raw.imageUrl) ||
    (typeof raw.image_url === 'string' && raw.image_url) ||
    (Array.isArray(raw.images) && typeof raw.images[0] === 'string' && raw.images[0]) ||
    (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '');

  const imageUrls = (() => {
    const out = [];
    if (Array.isArray(raw.images)) {
      for (const u of raw.images) {
        if (typeof u === 'string' && u.trim()) out.push(u.trim());
      }
    }
    const single =
      (typeof raw.imageUrl === 'string' && raw.imageUrl.trim()) ||
      (typeof raw.image_url === 'string' && raw.image_url.trim()) ||
      '';
    if (single && !out.includes(single)) out.unshift(single);
    const seen = new Set();
    const deduped = out.filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
    if (deduped.length > 0) return deduped;
    if (thumbnailUrl) return [thumbnailUrl];
    return [];
  })();

  return {
    id,
    title: String(raw.title ?? raw.name ?? raw.titre ?? ''),
    description: String(raw.description ?? raw.desc ?? ''),
    priceCents: coercePriceCents(raw),
    currency: raw.currency || 'MAD',
    category: String(raw.category ?? ''),
    city: String(raw.city ?? ''),
    youtubeVideoId: yt,
    // Keep a direct file URL if the mobile app stores one (mp4 / storage),
    // otherwise synthesize a watch URL from the YouTube id.
    videoUrl:
      rawVideoUrl ||
      (yt ? `https://www.youtube.com/watch?v=${yt}` : ''),
    thumbnailUrl,
    imageUrls,
    ownerUid: String(
      raw.ownerUid ?? raw.owner_uid ?? raw.userId ?? raw.user_id ?? '',
    ),
    status: raw.status ?? 'active',
    createdAt:
      raw.createdAt ?? raw.created_at ?? raw.timestamp ?? raw.date ?? null,
    viewCount: (() => {
      const v = raw.views ?? raw.viewCount ?? raw.view_count;
      if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
      if (typeof v === 'string' && v.trim()) {
        const n = Number.parseInt(v, 10);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    })(),
  };
}

function timestampMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

/**
 * Public marketplace feed: real-time `onSnapshot` — UI updates immediately when
 * an admin sets `status` to `approved` (no manual refresh).
 */
export function listenAds({ max = 120 } = {}, onChange, onError) {
  return onSnapshot(
    query(collection(db, ANNONCES_COLLECTION), where('status', '==', 'approved')),
    (snapshot) => {
      const items = snapshot.docs.map((d) => parseAd(d.id, d.data()));
      items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
      onChange(items.slice(0, max));
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error(`[${ANNONCES_COLLECTION}] approved feed`, err);
      onError?.(err);
    },
  );
}

/**
 * Moderation queue: real-time `onSnapshot` on `status == "pending"`.
 */
export function listenPendingAds(onChange, onError) {
  return onSnapshot(
    query(collection(db, ANNONCES_COLLECTION), where('status', '==', 'pending')),
    (snapshot) => {
      // eslint-disable-next-line no-console
      console.log('Admin pending queue:', snapshot.docs.length);
      const items = snapshot.docs.map((d) => parseAd(d.id, d.data()));
      items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
      onChange(items);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error(`[${ANNONCES_COLLECTION}] pending query`, err);
      onError?.(err);
    },
  );
}

/**
 * All listings owned by a user (Boutique / seller page, “Mes annonces”).
 * Merges `ownerUid` and `userId` queries so legacy mobile docs that only set
 * `userId` still appear without scanning the whole collection.
 */
export function listenListingsByOwner(ownerUid, onChange, onError) {
  if (!ownerUid) {
    onChange([]);
    return () => {};
  }
  const byOwner = new Map();
  const byUserId = new Map();
  const byUserSnake = new Map();

  function emit() {
    const merged = new Map();
    for (const [id, ad] of byUserSnake) merged.set(id, ad);
    for (const [id, ad] of byUserId) merged.set(id, ad);
    for (const [id, ad] of byOwner) merged.set(id, ad);
    const items = [...merged.values()].sort(
      (a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt),
    );
    onChange(items);
  }

  const unsubOwner = onSnapshot(
    query(collection(db, ANNONCES_COLLECTION), where('ownerUid', '==', ownerUid)),
    (snapshot) => {
      byOwner.clear();
      for (const d of snapshot.docs) {
        byOwner.set(d.id, parseAd(d.id, d.data()));
      }
      emit();
    },
    (err) => onError?.(err),
  );
  const unsubUserId = onSnapshot(
    query(collection(db, ANNONCES_COLLECTION), where('userId', '==', ownerUid)),
    (snapshot) => {
      byUserId.clear();
      for (const d of snapshot.docs) {
        byUserId.set(d.id, parseAd(d.id, d.data()));
      }
      emit();
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn(`[${ANNONCES_COLLECTION}] listenListingsByOwner userId`, err);
    },
  );
  const unsubUserSnake = onSnapshot(
    query(collection(db, ANNONCES_COLLECTION), where('user_id', '==', ownerUid)),
    (snapshot) => {
      byUserSnake.clear();
      for (const d of snapshot.docs) {
        byUserSnake.set(d.id, parseAd(d.id, d.data()));
      }
      emit();
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn(`[${ANNONCES_COLLECTION}] listenListingsByOwner user_id`, err);
    },
  );
  return () => {
    unsubOwner();
    unsubUserId();
    unsubUserSnake();
  };
}

export async function getAd(adId) {
  const snap = await getDoc(doc(db, ANNONCES_COLLECTION, adId));
  if (!snap.exists()) return null;
  return parseAd(snap.id, snap.data());
}

export async function updateAd(adId, patch) {
  if (!adId) throw new Error('Missing adId');
  if (!patch || typeof patch !== 'object') throw new Error('Missing patch');
  await updateDoc(doc(db, ANNONCES_COLLECTION, adId), patch);
}

export async function deleteAd(adId) {
  if (!adId) throw new Error('Missing adId');
  await deleteDoc(doc(db, ANNONCES_COLLECTION, adId));
}

export async function approveListing(adId) {
  if (!adId) throw new Error('Missing adId');
  await updateDoc(doc(db, ANNONCES_COLLECTION, adId), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });
}

export async function rejectListing(adId) {
  if (!adId) throw new Error('Missing adId');
  await updateDoc(doc(db, ANNONCES_COLLECTION, adId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

/** Visible on public home, search, and seller shop browse: `approved` only. */
export function adIsVisibleOnPublicHome(ad) {
  const s = String(ad?.status ?? '').toLowerCase();
  return s === 'approved';
}

export function listenMyAds(uid, onChange, onError) {
  return listenListingsByOwner(uid, onChange, onError);
}
