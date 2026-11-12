import type { CalendarSlot } from '@/shared/types';
import {
  calendarRange,
  DEFAULT_BUSINESS_TIME_ZONE,
  sameCalendarDay,
  toBusinessClock,
} from '@/features/calendar/model/businessTime';

export function dashboardCalendarRange(now: number) {
  const start = toBusinessClock(now, DEFAULT_BUSINESS_TIME_ZONE);
  const end = new Date(start);
  // La primera respuesta incluye la zona del negocio. El margen cubre el cambio de día
  // entre esa zona y la predeterminada, además de los próximos 30 días.
  start.setUTCDate(start.getUTCDate() - 1);
  end.setUTCDate(end.getUTCDate() + 32);
  return calendarRange(start, end, DEFAULT_BUSINESS_TIME_ZONE);
}

export function selectDashboardAppointments(slots: CalendarSlot[], now: number, timeZone: string) {
  const today = toBusinessClock(now, timeZone);
  const todayAppointments = [];
  const upcoming = [];

  for (const slot of slots) {
    if (slot.type !== 'appointment' || slot.status === 'cancelled') continue;
    if (sameCalendarDay(toBusinessClock(slot.startTime, timeZone), today)) {
      todayAppointments.push(slot);
    }
    if (slot.status === 'confirmed' && Date.parse(slot.startTime) > now) {
      upcoming.push(slot);
    }
  }

  upcoming.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  return { todayAppointments, upcoming: upcoming.slice(0, 5) };
}
