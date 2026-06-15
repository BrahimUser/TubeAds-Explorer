import { useQuery } from '@tanstack/react-query';
import { REFETCH_INTERVAL } from '../api/queryClient';
import { fetchUnreadNotificationsCount } from '../services/notifications';
import { queryKeys } from './keys';

/** Unread notification count for the header badge. */
export function useUnreadNotificationsCount(uid, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(uid),
    queryFn: () => fetchUnreadNotificationsCount(),
    enabled: enabled && !!uid,
    refetchInterval: REFETCH_INTERVAL.notifications,
    placeholderData: 0,
  });
}
