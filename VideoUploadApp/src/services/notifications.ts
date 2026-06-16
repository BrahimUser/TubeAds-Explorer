import { Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
} from '@notifee/react-native';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

/**
 * Notifications service.
 *
 * - Notifee owns the local rendering: Android channel, icons, banner UI.
 * - FCM (`@react-native-firebase/messaging`) brings in remote pushes; we
 *   route every remote message through Notifee so the in-app banner is
 *   consistent regardless of source.
 * - Helpers (`notifyNewMessage`, `notifyNewOrder`, `sendTestNotification`)
 *   exist for app-driven local notifications.
 *
 * Background messages are handled by `src/services/fcmBackgroundHandler.ts`,
 * which must be imported from `index.js` *before* `App` is registered so the
 * native side can wake JS in headless mode.
 */

const CHANNEL_ID = 'marketplace-default';
const CHANNEL_NAME = 'Marketplace alerts';

/**
 * Drawable resource name resolved from `android/app/src/main/res/drawable/logo.png`.
 * Note: Android masks small icons to a single tint color (API 21+), so a
 * full-color logo will render as a white silhouette in the status bar.
 * That's the intentional trade-off for keeping a single source asset.
 */
const SMALL_ICON = 'logo';

/**
 * Same drawable, full-color, used as the 64dp thumbnail shown next to the
 * notification text inside the shade.
 */
const LARGE_ICON = 'logo';

let bootstrapped = false;

/**
 * Idempotent setup: call once at app start. Requests POST_NOTIFICATIONS
 * on Android 13+ and creates the default channel. Safe to call again on
 * subsequent launches; Notifee no-ops on existing channels.
 */
export async function bootstrapNotifications(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  // Android 13+ (API 33) requires a runtime grant for POST_NOTIFICATIONS.
  // Notifee handles iOS prompts here too, so this single call covers both.
  await notifee.requestPermission();

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
      vibration: true,
    });
  }

  if (Platform.OS === 'ios') {
    // iOS needs an explicit APNs registration before FCM tokens can be
    // issued. No-op on Android.
    try {
      await messaging().registerDeviceForRemoteMessages();
    } catch {
      // Simulator builds without push entitlements throw here. Safe to
      // ignore — `getFcmToken()` will surface the same error.
    }
  }
}

/**
 * Returns true when the user has granted permission. Useful for guarding
 * UI that depends on notifications being authorized (e.g. test button).
 */
export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

type DisplayOptions = {
  title: string;
  body: string;
  /** Optional payload echoed back when the user taps the notification. */
  data?: Record<string, string>;
};

async function display({ title, body, data }: DisplayOptions): Promise<void> {
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: CHANNEL_ID,
      smallIcon: SMALL_ICON,
      largeIcon: LARGE_ICON,
      pressAction: { id: 'default' },
      color: '#FF6600',
    },
    ios: {
      sound: 'default',
    },
  });
}

/**
 * Triggered when a new chat message arrives for the signed-in user.
 * Keep the body short — Android collapses long lines on the lock screen.
 */
export async function notifyNewMessage(opts?: { from?: string }): Promise<void> {
  await display({
    title: 'New message',
    body: opts?.from
      ? `${opts.from} just messaged you on Marketplace.`
      : 'You have a new message on Marketplace!',
    data: { kind: 'message', ...(opts?.from ? { from: opts.from } : {}) },
  });
}

/**
 * Triggered when a buyer places an order on one of the seller's listings.
 */
export async function notifyNewOrder(opts?: { itemTitle?: string }): Promise<void> {
  await display({
    title: 'New order received',
    body: opts?.itemTitle
      ? `New order received for "${opts.itemTitle}"!`
      : 'New order received for your item!',
    data: { kind: 'order', ...(opts?.itemTitle ? { itemTitle: opts.itemTitle } : {}) },
  });
}

/**
 * Quick smoke-test path used by the in-app "Test notification" button.
 * Ensures the channel + icons render correctly on the user's device.
 */
export async function sendTestNotification(): Promise<void> {
  await display({
    title: 'Marketplace',
    body: 'Notifications are working — you will see real alerts here.',
    data: { kind: 'test' },
  });
}

// ---------------------------------------------------------------------------
// Firebase Cloud Messaging (FCM)
// ---------------------------------------------------------------------------

/**
 * Reads the device's FCM registration token and logs it to the dev
 * console. Paste this token into the Firebase Console → Cloud Messaging
 * test composer to send a real push to your test device.
 *
 * Returns `null` on failure (e.g. simulator without push entitlements,
 * Google Play Services missing on Android).
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('================== FCM TOKEN ==================');
      // eslint-disable-next-line no-console
      console.log(token);
      // eslint-disable-next-line no-console
      console.log('===============================================');
    }
    return token;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[FCM] Failed to read token:', e);
    return null;
  }
}

/**
 * Renders an FCM `RemoteMessage` through Notifee. Used by both the
 * foreground listener and the background handler so the banner UI is
 * identical regardless of app state.
 *
 * Routing rules (in order of precedence):
 *   1. `notification.{title,body}` from the FCM payload (set when sending
 *      via the Firebase Console "Notification" composer).
 *   2. `data.kind` ∈ {'message', 'order'} — falls back to friendly copy.
 *   3. Generic Marketplace banner.
 */
export async function displayRemoteMessage(
  msg: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const data = (msg.data ?? {}) as Record<string, string>;
  const kind = data.kind;

  const title =
    msg.notification?.title ??
    data.title ??
    (kind === 'message'
      ? 'New message'
      : kind === 'order'
        ? 'New order received'
        : 'Marketplace');

  const body =
    msg.notification?.body ??
    data.body ??
    (kind === 'message'
      ? 'You have a new message on Marketplace!'
      : kind === 'order'
        ? 'New order received for your item!'
        : 'You have a new notification.');

  await display({ title, body, data });
}

/**
 * Subscribes to foreground FCM events. Returns an unsubscriber for use
 * in `useEffect` cleanup. Call this *after* `bootstrapNotifications()`.
 */
export function attachFcmForegroundListeners(): () => void {
  const unsubMessage = messaging().onMessage(async (remoteMessage) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[FCM] foreground message:', remoteMessage);
    }
    await displayRemoteMessage(remoteMessage);
  });

  const unsubToken = messaging().onTokenRefresh((token) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[FCM] token refreshed:', token);
    }
  });

  return () => {
    unsubMessage();
    unsubToken();
  };
}
