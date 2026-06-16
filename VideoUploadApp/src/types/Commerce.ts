import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { Currency } from './Ad';

/** Stored on each order document in Firestore (exact strings for queries/filters). */
export type OrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type DeliveryMethod = 'home' | 'hand';

export type PaymentMethod = 'cash' | 'online';

export type OrderDelivery = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
};

export type Order = {
  id: string;
  buyerUid: string;
  sellerUid: string;
  adId: string;
  adTitle: string;
  adThumbnailUrl: string;
  /** Line item (product) price in cents. */
  priceCents: number;
  currency: Currency;
  delivery: OrderDelivery;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  /** Human-readable order reference, e.g. ORD-XXXX. */
  orderNumber: string;
  subtotalCents: number;
  shippingFeeCents: number;
  totalCents: number;
  /** Legacy buyer timeline (optional). */
  timeline?: OrderTimelineStep[];
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseFirestoreTypes.Timestamp | null;
};

export type OrderTimelineStep = {
  key: string;
  label: string;
  done: boolean;
  at: FirebaseFirestoreTypes.Timestamp | null;
};

export type ChatThread = {
  id: string;
  adId: string;
  buyerUid: string;
  sellerUid: string;
  participantIds: string[];
  productTitle: string;
  productThumb: string;
  priceLabel: string;
  lastMessageText: string;
  lastMessageAt: FirebaseFirestoreTypes.Timestamp | null;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderUid: string;
  text: string;
  imageUrl: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
};
