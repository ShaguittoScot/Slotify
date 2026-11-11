export const DEFAULT_BUSINESS_TIME_ZONE = 'America/Mexico_City';

const DAY_MS = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function clockFormatter(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone, calendar: 'gregory', numberingSystem: 'latn',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function resolveBusinessTimeZone(timeZone?: string | null): string {
  if (!timeZone) return DEFAULT_BUSINESS_TIME_ZONE;
  try {
    clockFormatter(timeZone);
    return timeZone;
  } catch (error) {
    if (error instanceof RangeError) return DEFAULT_BUSINESS_TIME_ZONE;
    throw error;
  }
}

// Los componentes leen los campos UTC de este Date como fecha/hora de pared del negocio.
// Sus milisegundos no representan el instante original.
export function toBusinessClock(value: Date | string | number, timeZone: string): Date {
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return instant;
  const fields = Object.fromEntries(clockFormatter(timeZone).formatToParts(instant)
    .map(({ type, value: part }) => [type, Number(part)]));
  return new Date(Date.UTC(
    fields.year, fields.month - 1, fields.day, fields.hour % 24, fields.minute, fields.second,
    instant.getUTCMilliseconds(),
  ));
}

export function sameCalendarDay(first: Date, second: Date): boolean {
  return first.getUTCFullYear() === second.getUTCFullYear() &&
    first.getUTCMonth() === second.getUTCMonth() && first.getUTCDate() === second.getUTCDate();
}

function fromBusinessClock(clock: Date, timeZone: string, allowSkippedTime: boolean): Date | null {
  const wallTime = clock.getTime();
  const offsets = new Set([-DAY_MS, 0, DAY_MS].map((delta) => {
    const sample = wallTime + delta;
    return toBusinessClock(sample, timeZone).getTime() - sample;
  }));
  const candidates = [...offsets].map((offset) => new Date(wallTime - offset));
  const matching = candidates.filter((candidate) => toBusinessClock(candidate, timeZone).getTime() === wallTime);
  if (matching.length > 0) {
    // En una hora repetida se elige la primera ocurrencia.
    return matching.reduce((earliest, candidate) => candidate < earliest ? candidate : earliest);
  }
  if (!allowSkippedTime) return null;
  // Los límites del calendario avanzan al primer tramo válido cuando se omite la medianoche.
  return candidates.reduce((latest, candidate) => candidate > latest ? candidate : latest);
}

export function scheduleInstant(day: Date, time: string, timeZone: string): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const clock = new Date(day);
  clock.setUTCHours(hours, minutes, 0, 0);
  return Number.isFinite(clock.getTime()) ? fromBusinessClock(clock, timeZone, false) : null;
}

export function calendarRange(firstDay: Date, endDay: Date, timeZone: string) {
  const start = new Date(firstDay);
  const end = new Date(endDay);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  return {
    startDate: fromBusinessClock(start, timeZone, true)!.toISOString(),
    endDate: fromBusinessClock(end, timeZone, true)!.toISOString(),
  };
}

export function formatBusinessHour(value: Date | string, timeZone: string): string {
  return new Date(value).toLocaleTimeString('es-MX', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
}
