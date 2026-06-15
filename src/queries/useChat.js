import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchChatThreads,
  fetchThreadMessages,
  sortThreads,
  upsertThread,
} from '../services/chat';
import { getSocket } from '../services/socket';
import { queryKeys } from './keys';

/** Chat thread list with Socket.IO real-time updates. */
export function useChatThreads(uid, { enabled = true } = {}) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.chat.threads(uid);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchChatThreads(),
    enabled: enabled && !!uid,
    meta: { showGlobalLoader: false },
  });

  useEffect(() => {
    if (!enabled || !uid) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    function onThreadUpdated(updated) {
      if (!updated?.id) return;
      queryClient.setQueryData(queryKey, (prev) => {
        const threads = Array.isArray(prev) ? prev : [];
        return upsertThread(threads, updated);
      });
    }

    function onConnectError() {
      queryClient.invalidateQueries({ queryKey });
    }

    socket.on('chat:thread_updated', onThreadUpdated);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('chat:thread_updated', onThreadUpdated);
      socket.off('connect_error', onConnectError);
    };
  }, [enabled, uid, queryClient, queryKey]);

  return query;
}

/** Messages for a single thread with Socket.IO real-time updates. */
export function useChatMessages(threadId, { enabled = true } = {}) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.chat.messages(threadId);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchThreadMessages(threadId),
    enabled: enabled && !!threadId,
    meta: { showGlobalLoader: false },
  });

  useEffect(() => {
    if (!enabled || !threadId) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    function joinThread() {
      socket.emit('chat:join_thread', threadId, (res) => {
        if (!res?.ok) {
          queryClient.invalidateQueries({ queryKey });
        }
      });
    }

    function appendMessage(message) {
      if (message.threadId !== threadId) return;
      queryClient.setQueryData(queryKey, (prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((m) => m.id === message.id)) return list;
        return [...list, { ...message, threadId }];
      });
    }

    if (socket.connected) {
      joinThread();
    } else {
      socket.once('connect', joinThread);
    }

    socket.on('chat:message', appendMessage);

    return () => {
      socket.off('connect', joinThread);
      socket.emit('chat:leave_thread', threadId);
      socket.off('chat:message', appendMessage);
    };
  }, [enabled, threadId, queryClient, queryKey]);

  return query;
}

export { sortThreads };
