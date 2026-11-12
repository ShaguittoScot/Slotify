import { AppState, Platform } from 'react-native';
import { useEffect } from 'react';
import { fetchCalendarSlots } from '@/features/calendar/api';
import { dashboardCalendarRange } from '@/features/dashboard/model/appointments';
import type { CalendarSlot } from '@/shared/types';
import { loadLocalNotificationDevice } from './localNotifications';
import { settingsScope, useSettingsPreferences } from './preferences';

const CHANNEL = 'slotify-appointments';
const REMINDER_OFFSET = 30 * 60_000;
const snapshots = new Map<string, Map<string, CalendarSlot>>();
let queue = Promise.resolve();
let notificationModule: Promise<ReturnType<typeof loadLocalNotificationDevice>> | undefined;

function notifications() {
  return notificationModule ??= Promise.resolve().then(async () => {
    const device = loadLocalNotificationDevice();
    if (Platform.OS === 'android') {
      await device.setNotificationChannelAsync(CHANNEL, {
        name: 'Citas de Slotify', importance: device.AndroidImportance.DEFAULT,
      });
    }
    device.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
      }),
    });
    return device;
  }).catch((error) => {
    notificationModule = undefined;
    throw error;
  });
}

export async function requestAppointmentNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const device = await notifications();
  const current = await device.getPermissionsAsync();
  return current.granted || (current.canAskAgain && (await device.requestPermissionsAsync()).granted);
}

function isEnabled(scope: string) {
  const preferences = useSettingsPreferences.getState();
  return preferences.scope === scope && preferences.ready && preferences.notifications;
}

function enqueue(work: () => Promise<void>): Promise<void> {
  const operation = queue.then(work);
  queue = operation.catch(() => {});
  return operation;
}

export function refreshAppointmentNotifications(scope: string): Promise<void> {
  if (Platform.OS === 'web' || !isEnabled(scope)) return Promise.resolve();
  return enqueue(async () => {
    if (!isEnabled(scope)) return;
    const device = await notifications();
    if (!(await device.getPermissionsAsync()).granted) return;

    const now = Date.now();
    const { startDate, endDate } = dashboardCalendarRange(now);
    const response = await fetchCalendarSlots(startDate, endDate);
    if (!isEnabled(scope)) return;

    const future = response.slots.filter((slot) =>
      slot.type === 'appointment' && Date.parse(slot.startTime) > now);
    const reminderSlots = future
      .filter((slot) => slot.status === 'confirmed' && Date.parse(slot.startTime) - REMINDER_OFFSET > now)
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
      .slice(0, 48);
    const desired = new Map(reminderSlots.map((slot) => [slot.resourceId, Date.parse(slot.startTime) - REMINDER_OFFSET]));
    const scheduled = await device.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      const { scope: owner, appointmentId, at } = request.content.data ?? {};
      if (owner !== scope || typeof appointmentId !== 'string') continue;
      if (typeof at === 'number' && desired.get(appointmentId) === at) desired.delete(appointmentId);
      else await device.cancelScheduledNotificationAsync(request.identifier);
    }
    for (const [appointmentId, at] of desired) {
      if (!isEnabled(scope)) break;
      if (at <= Date.now()) continue;
      await device.scheduleNotificationAsync({
        identifier: `slotify-${scope}-${appointmentId}`,
        content: { title: 'Próxima cita', body: 'Tienes una cita en 30 minutos.', data: { scope, appointmentId, at } },
        trigger: { type: device.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
      });
    }

    if (!isEnabled(scope)) return;
    const previous = snapshots.get(scope);
    snapshots.set(scope, new Map(future.map((slot) => [slot.resourceId, slot])));
    if (!previous) return;
    const newlyBooked = future.some((slot) => slot.status === 'confirmed' && !previous.has(slot.resourceId)
      && Date.parse(slot.startTime) < Date.parse(endDate) - 86_400_000);
    const cancelled = future.some((slot) => slot.status === 'cancelled'
      && previous.get(slot.resourceId)?.status === 'confirmed');
    for (const [show, title] of [[newlyBooked, 'Nueva reserva en Agenda'], [cancelled, 'Se canceló una cita']] as const) {
      if (show && isEnabled(scope)) {
        await device.scheduleNotificationAsync({
          content: { title, body: 'Abre Slotify para consultar tu agenda.', data: { scope } },
          trigger: Platform.OS === 'android' ? { channelId: CHANNEL } : null,
        });
      }
    }
  });
}

export function useAppointmentNotifications(user: { id: string; businessId?: string } | null) {
  const scope = settingsScope(user);
  const liveBusiness = Boolean(user?.businessId && !user.businessId.startsWith('demo'));
  const { load, scope: loadedScope, ready, notifications: enabled } = useSettingsPreferences();
  useEffect(() => { void load(scope); }, [load, scope]);

  useEffect(() => {
    if (Platform.OS === 'web' || !scope || !liveBusiness || !ready || loadedScope !== scope || !enabled) return;
    const refresh = () => {
      if (AppState.currentState === 'active') void refreshAppointmentNotifications(scope).catch(() => {});
    };
    refresh();
    const subscription = AppState.addEventListener('change', refresh);
    const timer = setInterval(refresh, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
      snapshots.delete(scope);
      void enqueue(async () => {
        const device = await notifications();
        const scheduled = await device.getAllScheduledNotificationsAsync();
        await Promise.all(scheduled.filter((item) => item.content.data?.scope === scope)
          .map((item) => device.cancelScheduledNotificationAsync(item.identifier)));
      }).catch(() => {});
    };
  }, [scope, liveBusiness, loadedScope, ready, enabled]);
}
