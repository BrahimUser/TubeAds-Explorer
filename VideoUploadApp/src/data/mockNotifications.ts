/**
 * Mock data for the in-app notifications list.
 *
 * Will be replaced by a real Firestore-backed feed once the inbox lands;
 * the shape below is the contract the modal renders against, so the swap
 * only changes where the data comes from — not how it's displayed.
 */

export type NotificationKind = 'message' | 'order';

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  /** For `message` kind: sender display name. */
  senderName?: string;
  /** For `order` kind: short order reference (e.g. "ORD-4821"). */
  orderId?: string;
  /** Optional one-line preview shown under the headline. */
  preview?: string;
  /** Epoch ms — used to compute the "x min ago" label. */
  createdAtMs: number;
  read: boolean;
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Snapshot of mock data, evaluated lazily so timestamps are fresh on each open. */
export function buildMockNotifications(): NotificationItem[] {
  const now = Date.now();
  return [
    {
      id: 'n-1',
      kind: 'message',
      senderName: 'Sarah Johnson',
      preview: 'Is the vintage bike still available?',
      createdAtMs: now - 2 * MIN,
      read: false,
    },
    {
      id: 'n-2',
      kind: 'order',
      orderId: 'ORD-4821',
      preview: 'iPhone 13 Pro · 1 item',
      createdAtMs: now - 12 * MIN,
      read: false,
    },
    {
      id: 'n-3',
      kind: 'message',
      senderName: 'Ahmed El-Idrissi',
      preview: 'Can you ship to Casablanca?',
      createdAtMs: now - 45 * MIN,
      read: true,
    },
    {
      id: 'n-4',
      kind: 'order',
      orderId: 'ORD-4815',
      preview: 'Leather sofa · 1 item',
      createdAtMs: now - 3 * HOUR,
      read: true,
    },
    {
      id: 'n-5',
      kind: 'message',
      senderName: 'Fatima Z.',
      preview: 'Thanks! See you tomorrow.',
      createdAtMs: now - 26 * HOUR,
      read: true,
    },
    {
      id: 'n-6',
      kind: 'order',
      orderId: 'ORD-4789',
      preview: 'Acoustic guitar · 1 item',
      createdAtMs: now - 4 * DAY,
      read: true,
    },
  ];
}
