import messaging from '@react-native-firebase/messaging';
import { displayRemoteMessage } from './notifications';

/**
 * FCM background / quit-state handler.
 *
 * IMPORTANT: this module must be imported from `index.js` BEFORE the app
 * component is registered. RN Firebase requires the handler to be set at
 * the JS entrypoint so the headless task spawned by Android's
 * `FirebaseMessagingService` can find it when the app is killed or
 * backgrounded.
 *
 * We intentionally avoid pulling React/Navigation here — the headless
 * context has no UI; we only need Notifee to render the system banner.
 */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // eslint-disable-next-line no-console
  if (__DEV__) console.log('[FCM] background message:', remoteMessage);
  await displayRemoteMessage(remoteMessage);
});
