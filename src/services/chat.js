// Chat threads — same `chatThreads` collection + `messages` subcollection
// used by VideoUploadApp/src/services/commerceFirestore.ts so a buyer who
// starts a conversation on the website continues it seamlessly on mobile.
//
// =============================================================================
//  REQUIRED FIRESTORE COMPOSITE INDEXES
// =============================================================================
//  Firebase will return an "index requires" error the first time these queries
//  run. Open the link printed in the browser console — it auto-creates the
//  exact index below — or create them manually in the Firestore console.
//
//  1) Inbox listing (used by `listenChatThreads`)
//        Collection:  chatThreads
//        Fields:
//          - participantIds   Array contains
//          - createdAt        Descending
//          - __name__         Descending
//
//  2) Find-existing thread for a listing (used by `getOrCreateChatThreadForAd`)
//        Collection:  chatThreads
//        Fields:
//          - listingId        Ascending
//          - buyerUid         Ascending
//          - __name__         Ascending
// =============================================================================
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const CHAT_THREADS = 'chatThreads';
const NOTIFICATIONS = 'notifications';

const threadsCol = () => collection(db, CHAT_THREADS);
const messagesCol = (threadId) =>
  collection(db, CHAT_THREADS, threadId, 'messages');

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  return uid;
}

/**
 * Log a Firestore "failed-precondition" / index-required error in a way that
 * makes the auto-generated "create index" link easy to spot in DevTools.
 *
 *   1. The link is always inside `err.message` for `failed-precondition`
 *      errors. We print the **whole message** verbatim so you can click it.
 *   2. We also print `err` itself afterwards, in case the SDK ever splits the
 *      link out into a separate field.
 */
function logIndexError(label, err) {
  // eslint-disable-next-line no-console
  console.error(`INDEX LINK HERE: [${label}]`, err?.message || String(err));
  // eslint-disable-next-line no-console
  console.error(`[${label}] full error:`, err);
}

/**
 * Live inbox for the current user. Subscribes to every chat thread the user
 * participates in, newest first.
 *
 *   Query:  chatThreads
 *           where participantIds array-contains <uid>
 *           orderBy createdAt desc
 *           limit 50
 */
export function listenChatThreads(uid, onChange, onError) {
  const q = query(
    threadsCol(),
    where('participantIds', 'array-contains', uid),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      logIndexError('chatThreads inbox', err);
      onError && onError(err);
    },
  );
}

/**
 * Live messages for one thread, oldest first so the chat reads top→bottom.
 *
 *   Query:  chatThreads/{threadId}/messages
 *           orderBy createdAt asc
 *           limit 200
 */
export function listenThreadMessages(threadId, onChange, onError) {
  const q = query(messagesCol(threadId), orderBy('createdAt', 'asc'), limit(200));
  return onSnapshot(
    q,
    (snap) =>
      onChange(snap.docs.map((d) => ({ id: d.id, threadId, ...d.data() }))),
    (err) => {
      logIndexError(`chatThreads/${threadId}/messages`, err);
      onError && onError(err);
    },
  );
}

/**
 * Send a message into a thread.
 *
 * The message document keeps the canonical mobile schema (`senderUid`,
 * `createdAt`) plus the alias fields requested by the web spec
 * (`senderId`, `timestamp`, `listingId`) so server logic and analytics can
 * read either name.
 */
export async function sendChatMessage(threadId, text, options = {}) {
  const uid = requireUid();
  const trimmed = (text || '').trim();
  const imageUrl = options.imageUrl || null;
  const listingId = options.listingId || null;
  const recipientId = options.recipientId || null;
  const senderName = options.senderName || auth.currentUser?.displayName || auth.currentUser?.email || '';
  if (!trimmed && !imageUrl) return;
  const now = serverTimestamp();
  const msgRef = doc(messagesCol(threadId));
  const batch = writeBatch(db);
  batch.set(msgRef, {
    text: trimmed || (imageUrl ? ' ' : ''),
    senderUid: uid,
    senderId: uid,
    listingId,
    imageUrl,
    createdAt: now,
    timestamp: now,
  });
  batch.set(
    doc(threadsCol(), threadId),
    {
      lastMessageText: trimmed || '📷 Photo',
      lastMessageAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  // Notification (best-effort, written in same batch).
  if (recipientId && recipientId !== uid) {
    const nRef = doc(collection(db, NOTIFICATIONS));
    batch.set(nRef, {
      recipientId,
      senderName: String(senderName || '').trim(),
      message: trimmed || '📷 Photo',
      type: 'new_message',
      isRead: false,
      createdAt: now,
      link: { type: 'chat', threadId, listingId },
    });
  }
  await batch.commit();
}

/**
 * Find or create a chat thread for an ad, on behalf of the current user
 * (buyer). Mirrors `ensureChatThreadForOrder` from the mobile codebase so
 * threads are deduped across platforms.
 *
 *   Lookup query:
 *           chatThreads
 *           where listingId == <adId>
 *           where buyerUid  == <currentUid>
 *           limit 1
 *
 * Returns the threadId of the existing or newly-created thread.
 */
export async function getOrCreateChatThreadForAd(ad) {
  const buyerUid = requireUid();
  if (!ad || !ad.id) throw new Error('Missing ad.');
  if (!ad.ownerUid) throw new Error('This listing has no seller.');
  if (ad.ownerUid === buyerUid) {
    throw new Error('You cannot message yourself on your own listing.');
  }

  // 1) Try to find an existing 1:1 thread for this listing + buyer.
  // Read by `listingId` first; fall back to legacy `adId` for older threads
  // created before the field was renamed.
  //
  // These two queries combine two equality filters on different fields, so
  // Firestore requires a composite index. The .catch() below prints the
  // auto-generated "create index" link from the error message verbatim — you
  // can click it directly from DevTools to provision the index.
  const byListingId = await getDocs(
    query(
      threadsCol(),
      where('listingId', '==', ad.id),
      where('buyerUid', '==', buyerUid),
      limit(1),
    ),
  ).catch((err) => {
    logIndexError('chatThreads (listingId == adId, buyerUid == uid)', err);
    throw err;
  });
  if (!byListingId.empty) return byListingId.docs[0].id;

  const byAdId = await getDocs(
    query(
      threadsCol(),
      where('adId', '==', ad.id),
      where('buyerUid', '==', buyerUid),
      limit(1),
    ),
  ).catch((err) => {
    logIndexError('chatThreads (adId == adId, buyerUid == uid)', err);
    throw err;
  });
  if (!byAdId.empty) return byAdId.docs[0].id;

  // 2) Otherwise create a new thread document.
  const participants = [buyerUid, ad.ownerUid].sort();
  const ref = await addDoc(threadsCol(), {
    listingId: ad.id,
    adId: ad.id,
    buyerUid,
    sellerUid: ad.ownerUid,
    participantIds: participants,
    productTitle: ad.title || '',
    productThumb: ad.thumbnailUrl || '',
    priceLabel: `${Math.round((ad.priceCents || 0) / 100)} ${ad.currency || 'MAD'}`,
    lastMessageText: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
