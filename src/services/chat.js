// Chat threads via Express API + Socket.IO for real-time updates.
import api, { getAccessToken, unwrap } from '../api/client';

function requireAuth() {
  if (!getAccessToken()) throw new Error('You must be signed in.');
}

export function sortThreads(threads) {
  return threads.slice().sort((a, b) => {
    const ta = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
}

export function upsertThread(threads, updated) {
  const idx = threads.findIndex((t) => t.id === updated.id);
  if (idx >= 0) {
    const next = threads.slice();
    next[idx] = { ...next[idx], ...updated };
    return sortThreads(next);
  }
  return sortThreads([updated, ...threads]);
}

export async function fetchChatThreads() {
  requireAuth();
  const res = await api.get('/chat/threads');
  const { threads: list } = unwrap(res);
  return sortThreads(list || []);
}

export async function fetchThreadMessages(threadId) {
  requireAuth();
  const res = await api.get(`/chat/threads/${threadId}/messages`);
  const { messages: list } = unwrap(res);
  return (list || []).map((m) => ({ ...m, threadId }));
}

export async function sendChatMessage(threadId, text, options = {}) {
  requireAuth();
  const trimmed = (text || '').trim();
  const imageUrl = options.imageUrl || null;
  const listingId = options.listingId || null;
  const recipientId = options.recipientId || null;
  const senderName = options.senderName || '';
  if (!trimmed && !imageUrl) return null;

  const body = { text: trimmed };
  if (imageUrl) body.imageUrl = imageUrl;
  if (listingId) body.listingId = listingId;
  if (recipientId) body.recipientId = recipientId;
  if (senderName) body.senderName = senderName;

  const res = await api.post(`/chat/threads/${threadId}/messages`, body);
  const { message } = unwrap(res);
  return message ? { ...message, threadId } : null;
}

export async function getOrCreateChatThreadForAd(ad) {
  requireAuth();
  if (!ad || !ad.id) throw new Error('Missing ad.');
  if (!ad.ownerUid) throw new Error('This listing has no seller.');

  const res = await api.post('/chat/threads', { listingId: ad.id });
  const { thread } = unwrap(res);
  return thread.id;
}
