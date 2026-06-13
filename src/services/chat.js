// Chat threads via Express API (replaces Firestore chatThreads).
import api, { getAccessToken, unwrap } from '../api/client';
import { createPoller } from '../hooks/usePolling';

function requireAuth() {
  if (!getAccessToken()) throw new Error('You must be signed in.');
}

export function listenChatThreads(uid, onChange, onError) {
  if (!uid) {
    onChange([]);
    return () => {};
  }
  return createPoller(
    async () => {
      const res = await api.get('/chat/threads');
      const { threads } = unwrap(res);
      return threads || [];
    },
    onChange,
    onError,
    15000,
  );
}

export function listenThreadMessages(threadId, onChange, onError) {
  if (!threadId) {
    onChange([]);
    return () => {};
  }
  return createPoller(
    async () => {
      const res = await api.get(`/chat/threads/${threadId}/messages`);
      const { messages } = unwrap(res);
      return (messages || []).map((m) => ({ ...m, threadId }));
    },
    onChange,
    onError,
    10000,
  );
}

export async function sendChatMessage(threadId, text, options = {}) {
  requireAuth();
  const trimmed = (text || '').trim();
  const imageUrl = options.imageUrl || null;
  const listingId = options.listingId || null;
  const recipientId = options.recipientId || null;
  const senderName = options.senderName || '';
  if (!trimmed && !imageUrl) return;

  await api.post(`/chat/threads/${threadId}/messages`, {
    text: trimmed,
    imageUrl,
    listingId,
    recipientId,
    senderName,
  });
}

export async function getOrCreateChatThreadForAd(ad) {
  requireAuth();
  if (!ad || !ad.id) throw new Error('Missing ad.');
  if (!ad.ownerUid) throw new Error('This listing has no seller.');

  const res = await api.post('/chat/threads', { listingId: ad.id });
  const { thread } = unwrap(res);
  return thread.id;
}
