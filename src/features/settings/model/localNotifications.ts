type LocalNotificationDevice = Pick<typeof import('expo-notifications'),
  | 'AndroidImportance'
  | 'SchedulableTriggerInputTypes'
  | 'setNotificationChannelAsync'
  | 'setNotificationHandler'
  | 'getPermissionsAsync'
  | 'requestPermissionsAsync'
  | 'getAllScheduledNotificationsAsync'
  | 'scheduleNotificationAsync'
  | 'cancelScheduledNotificationAsync'
>;

export class LocalNotificationsUnavailable extends Error {
  constructor(cause: unknown) {
    super('No se pudieron cargar los módulos de notificaciones locales.', { cause });
  }
}

export function loadLocalNotificationDevice(): LocalNotificationDevice {
  try {
    // El índice del paquete también carga módulos de push. La app solo usa avisos locales.
    const { AndroidImportance } = require('expo-notifications/build/NotificationChannelManager.types');
    const { SchedulableTriggerInputTypes } = require('expo-notifications/build/Notifications.types');
    const { setNotificationChannelAsync } = require('expo-notifications/build/setNotificationChannelAsync');
    const { setNotificationHandler } = require('expo-notifications/build/NotificationsHandler');
    const { getPermissionsAsync, requestPermissionsAsync } = require('expo-notifications/build/NotificationPermissions');
    const { getAllScheduledNotificationsAsync } = require('expo-notifications/build/getAllScheduledNotificationsAsync');
    const { scheduleNotificationAsync } = require('expo-notifications/build/scheduleNotificationAsync');
    const { cancelScheduledNotificationAsync } = require('expo-notifications/build/cancelScheduledNotificationAsync');
    return {
      AndroidImportance, SchedulableTriggerInputTypes, setNotificationChannelAsync, setNotificationHandler,
      getPermissionsAsync, requestPermissionsAsync, getAllScheduledNotificationsAsync,
      scheduleNotificationAsync, cancelScheduledNotificationAsync,
    };
  } catch (cause) {
    throw new LocalNotificationsUnavailable(cause);
  }
}
