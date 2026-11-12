import { calendarRange, scheduleInstant, toBusinessClock } from '@/features/calendar/model/businessTime';

test('usa el día y la hora del negocio al consultar y agendar', () => {
  const zone = 'America/Mexico_City';
  const day = toBusinessClock('2026-11-11T02:00:00.000Z', zone);
  expect(day.toISOString()).toBe('2026-11-10T20:00:00.000Z');
  expect(scheduleInstant(day, '10:30', zone)?.toISOString()).toBe('2026-11-10T16:30:00.000Z');
  expect(calendarRange(day, new Date(Date.UTC(2026, 10, 11)), zone)).toEqual({
    startDate: '2026-11-10T06:00:00.000Z', endDate: '2026-11-11T06:00:00.000Z',
  });
});

test('rechaza la hora omitida y conserva un día real de 23 horas', () => {
  const zone = 'America/New_York';
  const day = new Date(Date.UTC(2026, 2, 8));
  expect(scheduleInstant(day, '02:30', zone)).toBeNull();
  expect(calendarRange(day, new Date(Date.UTC(2026, 2, 9)), zone)).toEqual({
    startDate: '2026-03-08T05:00:00.000Z', endDate: '2026-03-09T04:00:00.000Z',
  });
});

test('elige la primera ocurrencia de una hora repetida', () => {
  const day = new Date(Date.UTC(2026, 10, 1));
  expect(scheduleInstant(day, '01:30', 'America/New_York')?.toISOString()).toBe('2026-11-01T05:30:00.000Z');
});
