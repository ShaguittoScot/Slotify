import { dashboardCalendarRange, selectDashboardAppointments } from '@/features/dashboard/model/appointments';
import type { CalendarSlot } from '@/shared/types';

function appointment(resourceId: string, startTime: string, status: CalendarSlot['status'] = 'confirmed'): CalendarSlot {
  return { type: 'appointment', resourceId, startTime, endTime: startTime, status, title: 'Servicio' };
}

test('calcula hoy en la zona del negocio y lista solo citas confirmadas futuras en orden', () => {
  const now = Date.parse('2026-12-01T02:00:00Z');
  const slots = [
    appointment('next-day', '2026-12-01T17:00:00Z'),
    appointment('future', '2026-12-01T03:00:00Z'),
    appointment('completed', '2026-11-30T20:00:00Z', 'completed'),
    appointment('cancelled', '2026-12-01T04:00:00Z', 'cancelled'),
    appointment('no-show', '2026-12-01T05:00:00Z', 'no_show'),
    appointment('past', '2026-11-30T19:00:00Z'),
    appointment('started', '2026-12-01T02:00:00Z'),
  ];
  const { todayAppointments, upcoming } = selectDashboardAppointments(slots, now, 'America/Mexico_City');
  expect(todayAppointments.map(({ resourceId }) => resourceId)).toEqual(['future', 'completed', 'no-show', 'past', 'started']);
  expect(upcoming.map(({ resourceId }) => resourceId)).toEqual(['future', 'next-day']);
});

test('incluye hoy aunque el negocio ya haya cambiado de mes en otra zona', () => {
  const now = Date.parse('2026-11-30T18:00:00Z');
  const { startDate, endDate } = dashboardCalendarRange(now);
  const midnightTokyo = Date.parse('2026-11-30T15:00:00Z');
  expect(Date.parse(startDate)).toBeLessThanOrEqual(midnightTokyo);
  expect(Date.parse(endDate)).toBeGreaterThan(midnightTokyo + 30 * 86_400_000);
});
