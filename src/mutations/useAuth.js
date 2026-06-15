import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getRefreshToken } from '../api/client';
import { disconnectSocket } from '../services/socket';
import {
  registerWithPhonePassword,
  signInWithPhonePassword,
} from '../services/phonePasswordAuth';
import { clearAuthAndCache } from '../queries/useAuth';
import { queryKeys } from '../queries/keys';

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, password }) => registerWithPhonePassword(phone, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
    meta: { showGlobalLoader: true },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, password }) => signInWithPhonePassword(phone, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
    meta: { showGlobalLoader: true },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch {
          /* best-effort */
        }
      }
    },
    onSettled: () => {
      disconnectSocket();
      clearAuthAndCache(queryClient);
    },
    meta: { showGlobalLoader: true },
  });
}

export function useRefreshSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      return queryClient.fetchQuery({ queryKey: queryKeys.auth.me() });
    },
    meta: { showGlobalLoader: false },
  });
}
