import { QueryClient } from '@tanstack/react-query';

export const STALE_TIME = {
  /** Default for most list/detail queries */
  default: 30 * 1000,
  /** User profiles change infrequently */
  user: 5 * 60 * 1000,
};

export const GC_TIME = 5 * 60 * 1000;

export const REFETCH_INTERVAL = {
  listings: 10 * 1000,
  favorites: 10 * 1000,
  users: 10 * 1000,
  notifications: 15 * 1000,
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.default,
        gcTime: GC_TIME,
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const queryClient = createQueryClient();
