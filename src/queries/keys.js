/** Centralized query key factory — organized by feature/domain. */
export const queryKeys = {
  auth: {
    all: ['auth'],
    me: () => [...queryKeys.auth.all, 'me'],
  },
  listings: {
    all: ['listings'],
    lists: () => [...queryKeys.listings.all, 'list'],
    list: (filters) => [...queryKeys.listings.lists(), filters],
    search: (q) => [...queryKeys.listings.all, 'search', q ?? ''],
    details: () => [...queryKeys.listings.all, 'detail'],
    detail: (id) => [...queryKeys.listings.details(), id],
  },
  favorites: {
    all: ['favorites'],
    ids: (uid) => [...queryKeys.favorites.all, 'ids', uid ?? ''],
    list: (uid) => [...queryKeys.favorites.all, 'list', uid ?? ''],
  },
  users: {
    all: ['users'],
    detail: (uid) => [...queryKeys.users.all, 'detail', uid ?? ''],
    profiles: (uids) => [...queryKeys.users.all, 'profiles', [...(uids || [])].sort().join(',')],
  },
  notifications: {
    all: ['notifications'],
    unreadCount: (uid) => [...queryKeys.notifications.all, 'unread-count', uid ?? ''],
  },
  chat: {
    all: ['chat'],
    threads: (uid) => [...queryKeys.chat.all, 'threads', uid ?? ''],
    messages: (threadId) => [...queryKeys.chat.all, 'messages', threadId ?? ''],
  },
};
