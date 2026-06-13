// Chat threads via Express API + Socket.IO for real-time updates.
import api, { getAccessToken, unwrap } from '../api/client';
import { getSocket } from './socket';

function requireAuth() {
  if (!getAccessToken()) throw new Error('You must be signed in.');
}

function sortThreads(threads) {
  return threads.slice().sort((a, b) => {
    const ta = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
}

function upsertThread(threads, updated) {
  const idx = threads.findIndex((t) => t.id === updated.id);
  if (idx >= 0) {
    const next = threads.slice();
    next[idx] = { ...next[idx], ...updated };
    return sortThreads(next);
  }
  return sortThreads([updated, ...threads]);
}

export function listenChatThreads(uid, onChange, onError) {
  if (!uid) {
    onChange([]);
    return () => {};
  }

  let cancelled = false;
  let threads = [];
  const socket = getSocket();

  if (!socket) {
    onChange([]);
    onError?.(new Error('You must be signed in.'));
    return () => {};
  }

  async function loadInitial() {
    try {
      const res = await api.get('/chat/threads');
      const { threads: list } = unwrap(res);
      if (!cancelled) {
        threads = sortThreads(list || []);
        onChange(threads);
      }
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  }

  function onThreadUpdated(updated) {
    if (cancelled || !updated?.id) return;
    threads = upsertThread(threads, updated);
    onChange(threads);
  }

  function onConnectError(err) {
    if (!cancelled) onError?.(err);
  }

  loadInitial();
  socket.on('chat:thread_updated', onThreadUpdated);
  socket.on('connect_error', onConnectError);

  return () => {
    cancelled = true;
    socket.off('chat:thread_updated', onThreadUpdated);
    socket.off('connect_error', onConnectError);
  };
}

export function listenThreadMessages(threadId, onChange, onError) {
  if (!threadId) {
    onChange([]);
    return () => {};
  }

  let cancelled = false;
  let messages = [];
  const socket = getSocket();

  if (!socket) {
    onChange([]);
    onError?.(new Error('You must be signed in.'));
    return () => {};
  }

  async function loadInitial() {
    try {
      const res = await api.get(`/chat/threads/${threadId}/messages`);
      const { messages: list } = unwrap(res);
      if (!cancelled) {
        messages = (list || []).map((m) => ({ ...m, threadId }));
        onChange(messages);
      }
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  }

  function appendMessage(message) {
    if (cancelled || message.threadId !== threadId) return;
    if (messages.some((m) => m.id === message.id)) return;
    messages = [...messages, { ...message, threadId }];
    onChange(messages);
  }

  function joinThread() {
    socket.emit('chat:join_thread', threadId, (res) => {
      if (!res?.ok && !cancelled) {
        onError?.(new Error(res?.message || 'Could not join conversation'));
      }
    });
  }

  loadInitial();

  if (socket.connected) {
    joinThread();
  } else {
    socket.once('connect', joinThread);
  }

  socket.on('chat:message', appendMessage);

  return () => {
    cancelled = true;
    socket.off('connect', joinThread);
    socket.emit('chat:leave_thread', threadId);
    socket.off('chat:message', appendMessage);
  };
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
