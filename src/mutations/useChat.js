import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendChatMessage, getOrCreateChatThreadForAd } from '../services/chat';
import { queryKeys } from '../queries/keys';

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, text, options }) => sendChatMessage(threadId, text, options),
    onSuccess: (message, { threadId }) => {
      if (message) {
        const key = queryKeys.chat.messages(threadId);
        queryClient.setQueryData(key, (prev) => {
          const list = Array.isArray(prev) ? prev : [];
          if (list.some((m) => m.id === message.id)) return list;
          return [...list, message];
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    meta: { showGlobalLoader: false },
  });
}

export function useCreateChatThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ad) => getOrCreateChatThreadForAd(ad),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.all });
    },
    meta: { showGlobalLoader: true },
  });
}
