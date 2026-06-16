/**
 * Navigation param list — lives in its own file so screens can import the
 * types WITHOUT touching `RootStack.tsx`.
 *
 * Why separate?
 *   `RootStack.tsx` imports every screen component (`HomeScreen`, etc.).
 *   If a screen ever accidentally imported `RootStack` as a runtime module
 *   (or Metro/Babel failed to strip a `type` import), you'd get a circular
 *   dependency: RootStack → HomeScreen → … → RootStack. During that
 *   cycle the intermediate module object can be temporarily `undefined`,
 *   which surfaces as errors like
 *   "Cannot read property 'VideoFeedItem' of undefined" when destructuring
 *   named exports from a half-initialized module.
 *
 * Keeping route params here guarantees screens only depend on types — zero
 * runtime edge toward the navigator file.
 */
export type RootStackParamList = {
  Main: undefined;
  PostAd: undefined;
  Auth: { mode?: 'sign-in' | 'sign-up' } | undefined;
  ProductDetail: { adId: string };
  Checkout: { adId: string };
  Chat: { adId: string; sellerUid: string; threadId?: string };
  Orders: undefined;
  SellerDashboard: undefined;
  AdminDashboard: undefined;
  SellerOrderDetail: { orderId: string };
};
