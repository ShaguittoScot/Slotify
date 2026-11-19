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
    let AndroidImportance = {
      UNKNOWN: 0,
      UNSPECIFIED: 1,
      NONE: 2,
      MIN: 3,
      LOW: 4,
      DEFAULT: 5,
      HIGH: 6,
      MAX: 7,
    };
    try {
      const channelTypes = require('expo-notifications/build/NotificationChannelManager.types');
      if (channelTypes?.AndroidImportance) {
        AndroidImportance = channelTypes.AndroidImportance;
      }
    } catch {
      // Usar fallback de enumeración si no se puede leer
    }

    const { SchedulableTriggerInputTypes } = require('expo-notifications/build/Notifications.types');
    const { setNotificationChannelAsync } = require('expo-notifications/build/setNotificationChannelAsync');
    const { setNotificationHandler } = require('expo-notifications/build/NotificationsHandler');
    const { getPermissionsAsync, requestPermissionsAsync } = require('expo-notifications/build/NotificationPermissions');
    const { getAllScheduledNotificationsAsync } = require('expo-notifications/build/getAllScheduledNotificationsAsync');
    const { scheduleNotificationAsync } = require('expo-notifications/build/scheduleNotificationAsync');
    const { cancelScheduledNotificationAsync } = require('expo-notifications/build/cancelScheduledNotificationAsync');
    return {
      AndroidImportance: AndroidImportance as any,
      SchedulableTriggerInputTypes,
      setNotificationChannelAsync,
      setNotificationHandler,
      getPermissionsAsync,
      requestPermissionsAsync,
      getAllScheduledNotificationsAsync,
      scheduleNotificationAsync,
      cancelScheduledNotificationAsync,
    };
  } catch (cause) {
    throw new LocalNotificationsUnavailable(cause);
  }
}
