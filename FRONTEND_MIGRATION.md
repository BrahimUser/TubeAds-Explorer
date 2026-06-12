# Frontend Migration Guide — Firebase → Express API

This guide maps every Firebase call in `marketplace-web` to the new REST API.

**Base URL:** `REACT_APP_API_URL` (default `http://localhost:3002/api`)

---

## Setup

1. Install axios: `npm install axios`
2. Add to `.env`: `REACT_APP_API_URL=http://localhost:3002/api`
3. Remove `firebase` from `package.json` after migration
4. Delete `src/firebase.js`

---

## Auth

### OLD — `phonePasswordAuth.js`

```js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
await registerWithPhonePassword(localPhone, password);
await signInWithPhonePassword(localPhone, password);
```

### NEW

```js
import api from '../api/client';
const { data } = await api.post('/auth/register', { phone: localPhone, password });
// data.data: { user, accessToken, refreshToken }
const { data } = await api.post('/auth/login', { phone: localPhone, password });
```

**Files:** `src/services/phonePasswordAuth.js`, `src/components/LoginModal.js`

---

### OLD — `AuthContext.js`

```js
import { onAuthStateChanged, signOut } from 'firebase/auth';
onAuthStateChanged(auth, setUser);
signOut(auth);
```

### NEW

```js
// On mount: if accessToken in localStorage → GET /auth/me
const { data } = await api.get('/auth/me');
// Logout:
await api.post('/auth/logout', { refreshToken });
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

**Files:** `src/context/AuthContext.js`

---

### OLD — Admin check `useIsAdmin.js`

```js
const r = await user.getIdTokenResult(true);
claimsAdmin = !!r?.claims?.admin;
userProfile?.role === 'admin'
```

### NEW

```js
// role from /auth/me response: user.role === 'admin'
// Optional: REACT_APP_ADMIN_UIDS still supported for bootstrap
```

**Files:** `src/hooks/useIsAdmin.js`, `src/constants/superAdmin.js` (can use env admin user id instead)

---

## Users

### OLD — `users.js`

```js
onSnapshot(doc(db, 'users', uid), ...);
getDoc(doc(db, USERS_COLLECTION, uid));
```

### NEW

```js
// Polling every 10s (replaces onSnapshot)
const { data } = await api.get(`/users/${uid}`);
const profile = data.data.user;
```

**Files:** `src/services/users.js`, `src/hooks/useSellerProfiles.js`, `src/components/ProductDetailPage.js`, `src/components/ShopPage.js`

---

## Listings

### OLD — `listings.js`

```js
onSnapshot(query(collection(db, 'listings'), where('status', '==', 'approved')), ...);
getDoc(doc(db, ANNONCES_COLLECTION, adId));
updateDoc(doc(db, ANNONCES_COLLECTION, adId), patch);
deleteDoc(doc(db, ANNONCES_COLLECTION, adId));
```

### NEW

```js
// Public feed (poll every 10s)
const { data } = await api.get('/listings', { params: { status: 'approved', limit: 120 } });
const ads = data.data.items;

// Single ad
const { data } = await api.get(`/listings/${adId}`);

// Update
await api.put(`/listings/${adId}`, { title, priceCents, videoUrl }); // → status pending

// Delete
await api.delete(`/listings/${adId}`);

// Admin approve/reject
await api.post(`/listings/${adId}/approve`);
await api.post(`/listings/${adId}/reject`);

// Owner listings
await api.get('/listings', { params: { ownerId: uid } });
```

**Files:** `src/services/listings.js`, `src/components/RecentListings.js`, `src/components/AdminDashboard.js`, `src/components/MyAdsPage.js`, `src/components/EditAdModal.js`, `src/components/ProductDetailPage.js`

---

## Favorites

### OLD — `favorites.js`

```js
setDoc(doc(favCol(uid), ad.id), {...});
deleteDoc(doc(favCol(uid), adId));
onSnapshot(favCol(uid), ...);
```

### NEW

```js
await api.post('/favorites', { listingId: ad.id });
await api.delete(`/favorites/${adId}`);
// Poll favorites
const { data } = await api.get('/favorites');
const favIds = new Set(data.data.ids);
```

**Files:** `src/services/favorites.js`, `src/components/AdCard.js`, `src/components/RecentListings.js`, `src/components/ShopPage.js`

---

## Chat

### OLD — `chat.js`

```js
onSnapshot(query(threadsCol(), where('participantIds', 'array-contains', uid)), ...);
onSnapshot(query(messagesCol(threadId), orderBy('createdAt', 'asc')), ...);
await addDoc(threadsCol(), {...});
batch.set(msgRef, {...});
```

### NEW

```js
// Inbox (poll every 5s when drawer open)
const { data } = await api.get('/chat/threads');

// Messages (poll every 3s)
const { data } = await api.get(`/chat/threads/${threadId}/messages`);

// Get or create thread
const { data } = await api.post('/chat/threads', { listingId: ad.id });
const threadId = data.data.thread.id;

// Send message
await api.post(`/chat/threads/${threadId}/messages`, { text, recipientId });
```

**Files:** `src/services/chat.js`, `src/components/MessagesDrawer.js`, `src/components/ProductDetailPage.js`

---

## Notifications

### OLD — `notifications.js`

```js
onSnapshot(query(collection(db, NOTIFICATIONS), where('recipientId', '==', uid), where('isRead', '==', false)), ...);
updateDoc(doc(db, NOTIFICATIONS, id), { isRead: true });
```

### NEW

```js
// Unread count (poll every 15s)
const { data } = await api.get('/notifications/unread-count');
const count = data.data.count;

// Recent list
const { data } = await api.get('/notifications');

// Mark read
await api.patch(`/notifications/${id}/read`);
```

**Files:** `src/services/notifications.js`, `src/components/Header.js`

---

## Orders (service exists, UI not wired)

### OLD — `orders.js`

```js
await addDoc(collection(db, ORDERS), {...});
onSnapshot(query(collection(db, ORDERS), where('sellerUid', '==', uid)), ...);
updateDoc(doc(db, ORDERS, order.id), { status: nextStatus });
```

### NEW

```js
await api.post('/orders', { listingId, sellerUid, subtotalCents, delivery, ... });
await api.get('/orders', { params: { role: 'seller' } });
await api.patch(`/orders/${orderId}/status`, { action: 'confirm' });
```

**Files:** `src/services/orders.js` (rewrite when UI is restored)

---

## Polling helper

Replace `onSnapshot` listeners with:

```js
// src/hooks/usePolling.js
export function usePolling(fetchFn, intervalMs = 10000, enabled = true) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      try {
        const result = await fetchFn();
        if (!cancelled) setData(result);
      } catch (e) { /* handle */ }
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled, intervalMs]);
  return data;
}
```

---

## Files to delete

- `src/firebase.js`

## Files to create

- `src/api/client.js` — Axios + JWT interceptors
- `src/hooks/usePolling.js` — polling utility

## Files to rewrite

- `src/services/*.js` (all Firebase services)
- `src/context/AuthContext.js`
- `src/hooks/useIsAdmin.js`
- `src/hooks/useSellerProfiles.js`

## Files with direct Firestore imports to update

- `src/components/ProductDetailPage.js` — remove `getDoc`/`doc` imports
