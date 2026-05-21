import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Requests notification permissions and returns the native FCM device token
 * (Android) or APNs token (iOS) that the backend expects.
 *
 * Returns `null` when:
 * - Running on a simulator/emulator (FCM tokens require a physical device).
 * - The user denies the permission prompt.
 */
export async function getDeviceFcmToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] FCM tokens are only available on physical devices.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted — push notifications disabled.');
    return null;
  }

  // On Android, a notification channel is required for foreground alerts.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('price-alerts', {
      name: 'Price Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { data: token } = await Notifications.getDevicePushTokenAsync();
  return token;
}
