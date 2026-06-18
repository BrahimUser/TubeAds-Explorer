import type { Ad } from '../types/Ad';
import type { ChatMessage, ChatThread } from '../types/Commerce';
import api, { getAccessToken, silentRequest, unwrap } from '../api/client';
import { createPoller } from '../hooks/usePolling';
import { getSocket } from './socket';

function parseThread(raw: Record<string, unknown>): ChatThread {
  const id = String(raw.id ?? '');
  return {
    id,
    adId: String(raw.adId ?? raw.listingId ?? ''),
    buyerUid: String(raw.buyerUid ?? raw.buyerId ?? ''),
    sellerUid: String(raw.sellerUid ?? raw.sellerId ?? ''),
    participantIds: Array.isArray(raw.participantIds)
      ? raw.participantIds.map(String)
      : [String(raw.buyerId ?? ''), String(raw.sellerId ?? '')].filter(Boolean),
    productTitle: String(raw.productTitle ?? ''),
    productThumb: String(raw.productThumb ?? ''),
    priceLabel: String(raw.priceLabel ?? ''),
    lastMessageText: String(raw.lastMessageText ?? ''),
    lastMessageAt: (raw.lastMessageAt as string | null) ?? null,
    createdAt: (raw.createdAt as string | null) ?? null,
  };
}

function parseMessage(threadId: string, raw: Record<string, unknown>): ChatMessage {
  return {
    id: String(raw.id ?? ''),
    threadId,
    senderUid: String(raw.senderUid ?? raw.senderId ?? ''),
    text: String(raw.text ?? ''),
    imageUrl: (raw.imageUrl as string | null) ?? null,
    createdAt: (raw.createdAt as string | null) ?? null,
  };
}

async function requireAuth(): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('You must be signed in.');
}

export async function fetchChatThreads(): Promise<ChatThread[]> {
  await requireAuth();
  const res = await api.get('/chat/threads', silentRequest);
  const data = unwrap<{ threads: Record<string, unknown>[] }>(res);
  return (data.threads || []).map((t) => parseThread(t));
}

export function listenChatThreads(
  onChange: (threads: ChatThread[]) => void,
  onError: (e: Error) => void,
  options?: { enabled?: boolean },
): () => void {
  if (options?.enabled === false) {
    return () => undefined;
  }
  return createPoller(
    () => fetchChatThreads(),
    onChange,
    onError,
    5000,
  );
}

export async function fetchThreadMessages(threadId: string): Promise<ChatMessage[]> {
  await requireAuth();
  const res = await api.get(`/chat/threads/${threadId}/messages`, silentRequest);
  const data = unwrap<{ messages: Record<string, unknown>[] }>(res);
  return (data.messages || []).map((m) => parseMessage(threadId, m));
}

export function listenThreadMessages(
  threadId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError: (e: Error) => void,
): () => void {
  let cancelled = false;
  let pollCleanup: (() => void) | undefined;
  let socketCleanup: (() => void) | undefined;

  const startPolling = () => {
    if (pollCleanup || cancelled) return;
    pollCleanup = createPoller(
      () => fetchThreadMessages(threadId),
      onChange,
      onError,
      5000,
    );
  };

  const stopPolling = () => {
    pollCleanup?.();
    pollCleanup = undefined;
  };

  void (async () => {
    const socket = await getSocket();
    if (cancelled) return;

    if (!socket) {
      startPolling();
      return;
    }

    socket.emit('chat:join_thread', { threadId });
    const onMessage = (payload: { threadId?: string }) => {
      if (payload?.threadId === threadId) {
        void fetchThreadMessages(threadId)
          .then((list) => {
            if (!cancelled) onChange(list);
          })
          .catch((err) => onError(err as Error));
      }
    };
    socket.on('chat:message', onMessage);

    const onConnect = () => stopPolling();
    const onDisconnect = () => startPolling();

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      stopPolling();
    } else {
      startPolling();
    }

    socketCleanup = () => {
      socket.emit('chat:leave_thread', { threadId });
      socket.off('chat:message', onMessage);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  })();

  return () => {
    cancelled = true;
    stopPolling();
    socketCleanup?.();
  };
}

export async function sendChatMessage(
  threadId: string,
  text: string,
  imageUrl?: string | null,
): Promise<void> {
  await requireAuth();
  const trimmed = text.trim();
  if (!trimmed && !imageUrl) return;
  const body: Record<string, string> = { text: trimmed };
  if (imageUrl) body.imageUrl = imageUrl;
  await api.post(`/chat/threads/${threadId}/messages`, body);
}

export async function getOrCreateChatThread(input: {
  ad: Ad;
  buyerUid: string;
}): Promise<string> {
  await requireAuth();
  const res = await api.post('/chat/threads', { listingId: input.ad.id });
  const data = unwrap<{ thread: Record<string, unknown> }>(res);
  return String(data.thread.id);
}

/** Find an existing thread for a listing between buyer and seller (seller inbox). */
export async function findChatThreadForOrder(
  adId: string,
  buyerUid: string,
  sellerUid: string,
): Promise<string | null> {
  const threads = await fetchChatThreads();
  const match = threads.find(
    (t) => t.adId === adId && t.buyerUid === buyerUid && t.sellerUid === sellerUid,
  );
  return match?.id ?? null;
}
