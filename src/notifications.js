// The day-14 reminder, on-device.
//
// functions/index.js already has sendReminders — a daily 09:00 UTC job that
// emails anyone 14 days past their last session. This schedules the same nudge
// as a local notification, which does not need a server, a push token, or the
// user to open their email.
//
// The two can double up. Deliberate for now: email is the reliable channel for
// PROFILE participants, and a local notification is the one they will act on.
// If that gets annoying, gate the email on expoPushToken being absent.
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { T } from './i18n';

const REMINDER_ID = 'session-due';
const FOURTEEN_DAYS_SECONDS = 14 * 24 * 60 * 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermission() {
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    // Channels must exist before a token is requested, and Android 13+ prompts
    // for POST_NOTIFICATIONS on its own.
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Session reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#1f355a',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

/**
 * Re-arm the 14-day reminder. Call after every completed session — it cancels
 * the previous one first, so finishing early always resets the clock rather
 * than stacking notifications.
 */
export async function scheduleSessionReminder() {
  const granted = await requestPermission();
  if (!granted) return false;

  await cancelSessionReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: T('notif.title'),
      body: T('notif.body'),
      data: { kind: REMINDER_ID },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: FOURTEEN_DAYS_SECONDS,
      repeats: false,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });
  return true;
}

export async function cancelSessionReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch (_) {
    // Nothing scheduled — fine.
  }
}

/** Expo push token, so the backend can reach the device too. Null if unavailable. */
export async function getPushToken() {
  try {
    if (!Device.isDevice) return null;
    if (!(await requestPermission())) return null;
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data ?? null;
  } catch (_) {
    return null;
  }
}
