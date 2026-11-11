import { refreshAppointmentNotifications, requestAppointmentNotificationPermission } from '@/features/settings/model/appointmentNotifications';
import { useSettingsPreferences } from '@/features/settings/model/preferences';
import type { CalendarSlot } from '@/shared/types';

const mockSlots = jest.fn();
const mockScheduled = jest.fn();
const mockSchedule = jest.fn();
const mockCancel = jest.fn();
const mockPermission = jest.fn().mockResolvedValue({ granted: true });
const mockRequestPermission = jest.fn();

jest.mock('@/features/calendar/api', () => ({
  fetchCalendarSlots: () => mockSlots(),
}));
jest.mock('@/shared/lib/storage', () => ({ storage: { set: jest.fn(), get: jest.fn() } }));
jest.mock('@/features/settings/model/localNotifications', () => ({ loadLocalNotificationDevice: () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: () => mockPermission(),
  requestPermissionsAsync: () => mockRequestPermission(),
  getAllScheduledNotificationsAsync: () => mockScheduled(),
  scheduleNotificationAsync: (request: unknown) => mockSchedule(request),
  cancelScheduledNotificationAsync: (id: string) => mockCancel(id),
}) }));

test('solicita permiso al dispositivo cuando el permiso todavía se puede pedir', async () => {
  mockPermission.mockResolvedValueOnce({ granted: false, canAskAgain: true });
  mockRequestPermission.mockResolvedValueOnce({ granted: true });
  await expect(requestAppointmentNotificationPermission()).resolves.toBe(true);
  expect(mockRequestPermission).toHaveBeenCalledTimes(1);
});

test('agenda un recordatorio, evita duplicados y lo cancela cuando la cita se cancela', async () => {
  const scope = 'user_business';
  useSettingsPreferences.setState({ scope, ready: true, notifications: true });
  const start = Date.now() + 60 * 60_000;
  const slot: CalendarSlot = {
    type: 'appointment', status: 'confirmed', resourceId: 'appointment-1', title: 'Servicio',
    startTime: new Date(start).toISOString(), endTime: new Date(start + 30 * 60_000).toISOString(),
  };
  mockSlots.mockResolvedValue({ slots: [slot] });
  mockScheduled.mockResolvedValue([]);

  await refreshAppointmentNotifications(scope);
  expect(mockSchedule).toHaveBeenCalledTimes(1);
  const reminder = mockSchedule.mock.calls[0][0];
  expect(reminder.trigger.date).toBe(start - 30 * 60_000);
  mockScheduled.mockResolvedValue([reminder]);

  await refreshAppointmentNotifications(scope);
  expect(mockSchedule).toHaveBeenCalledTimes(1);
  mockSlots.mockResolvedValue({ slots: [{ ...slot, status: 'cancelled' }] });
  await refreshAppointmentNotifications(scope);
  expect(mockCancel).toHaveBeenCalledWith(reminder.identifier);
  expect(mockSchedule).toHaveBeenLastCalledWith(expect.objectContaining({
    content: expect.objectContaining({ title: 'Se canceló una cita' }),
  }));
});
