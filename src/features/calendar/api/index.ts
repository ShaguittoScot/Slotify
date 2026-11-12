/**
 * US-003 / US-022: Calendar — API Layer
 *
 * Funciones para comunicarse con el endpoint protegido /api/calendar de Slotify_back.
 * El BusinessId nunca se envía por query ni body; el backend lo resuelve del token JWT (ICurrentUserService).
 */

import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, CalendarResponse, CalendarSlot } from '@/shared/types';
import { useAuthStore } from '@/features/auth/model';
import { DEFAULT_BUSINESS_TIME_ZONE, scheduleInstant, toBusinessClock } from '../model/businessTime';

export interface CreateCalendarAppointmentPayload {
  employeeId?: string;
  businessClientId?: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  agreedTotal?: number;
}

/** Generador de datos simulados realistas para visualización offline / preview */
export function generateMockCalendarSlots(startDate: Date, endDate: Date): CalendarSlot[] {
  const slots: CalendarSlot[] = [];
  const curr = toBusinessClock(startDate, DEFAULT_BUSINESS_TIME_ZONE);
  const endClock = toBusinessClock(endDate, DEFAULT_BUSINESS_TIME_ZONE);
  const at = (time: string) => scheduleInstant(curr, time, DEFAULT_BUSINESS_TIME_ZONE)!;

  while (curr < endClock) {
    const y = curr.getUTCFullYear();
    const m = curr.getUTCMonth();
    const d = curr.getUTCDate();
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Slot 1: Cita de Corte y Barba (10:00 a 11:00)
    const slot1Start = at('10:00');
    const slot1End = at('11:00');
    slots.push({
      type: 'appointment',
      resourceId: `apt-1-${dateKey}`,
      startTime: slot1Start.toISOString(),
      endTime: slot1End.toISOString(),
      title: 'Corte de Cabello y Barba',
      status: 'confirmed',
      clientName: 'Carlos Mendoza',
      clientPhone: '+52 55 1234 5678',
      servicePrice: '$280 MXN',
      employeeName: 'Ariel (Master Barber)',
    });

    // Slot 2: Cita de Tratamiento Capilar (11:30 a 13:00)
    const slot2Start = at('11:30');
    const slot2End = at('13:00');
    slots.push({
      type: 'appointment',
      resourceId: `apt-2-${dateKey}`,
      startTime: slot2Start.toISOString(),
      endTime: slot2End.toISOString(),
      title: 'Tratamiento Capilar',
      status: 'confirmed',
      clientName: 'Sofía Valenzuela',
      clientPhone: '+52 55 8765 4321',
      servicePrice: '$450 MXN',
      employeeName: 'Evan (Estilista)',
    });

    // Slot 3: Bloqueo de Almuerzo / Descanso de Equipo (14:00 a 15:00)
    const slot3Start = at('14:00');
    const slot3End = at('15:00');
    slots.push({
      type: 'block',
      resourceId: `blk-1-${dateKey}`,
      startTime: slot3Start.toISOString(),
      endTime: slot3End.toISOString(),
      title: 'Almuerzo / Descanso de Equipo',
      status: 'blocked',
      blockReason: 'Horario de comida',
      employeeName: 'Todo el personal',
    });

    // Slot 4: Cita de Perfilado y Afeitado Clásico (16:30 a 17:45)
    const slot4Start = at('16:30');
    const slot4End = at('17:45');
    slots.push({
      type: 'appointment',
      resourceId: `apt-3-${dateKey}`,
      startTime: slot4Start.toISOString(),
      endTime: slot4End.toISOString(),
      title: 'Perfilado y Afeitado Clásico',
      status: 'confirmed',
      clientName: 'Alejandro Rivera',
      clientPhone: '+52 55 9988 7766',
      servicePrice: '$220 MXN',
      employeeName: 'Ariel (Master Barber)',
    });
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return slots.filter((slot) => new Date(slot.startTime) < endDate && new Date(slot.endTime) > startDate);
}

/**
 * Obtiene los slots del calendario para un rango de fechas desde Slotify_back.
 * Endpoint protegido: GET /api/calendar/slots?startDate=...&endDate=...
 * El businessId se resuelve automáticamente en el backend a partir del JWT (US-022).
 */
const slotRequests = new Map<string, Promise<CalendarResponse>>();

export function fetchCalendarSlots(
  startDate: string, endDate: string, employeeId?: string, scope?: string,
): Promise<CalendarResponse> {
  const user = useAuthStore.getState().user;
  const key = JSON.stringify([scope ?? [user?.id, user?.businessId], startDate, endDate, employeeId]);
  const pending = slotRequests.get(key);
  if (pending) return pending;
  const request = loadCalendarSlots(startDate, endDate, employeeId);
  slotRequests.set(key, request);
  const clear = () => { if (slotRequests.get(key) === request) slotRequests.delete(key); };
  void request.then(clear, clear);
  return request;
}

async function loadCalendarSlots(
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<CalendarResponse> {
  const currentUser = useAuthStore.getState().user;
  const isDemo =
    currentUser?.email === 'demo@slotify.com' ||
    currentUser?.email === 'admin@slotify.com';

  if (isDemo) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return {
      rangeStart: startDate,
      rangeEnd: endDate,
      timeZone: DEFAULT_BUSINESS_TIME_ZONE,
      slots: generateMockCalendarSlots(start, end),
    };
  }

  try {
    const params: Record<string, string> = { startDate, endDate };
    if (employeeId) {
      params.employeeId = employeeId;
    }

    const response = await apiClient.get<CalendarResponse | ApiResponse<CalendarResponse>>(
      API_ENDPOINTS.CALENDAR.GET_SLOTS,
      { params, timeout: 10000 },
    );

    // Si la respuesta viene envuelta en ApiResponse<T>
    if (response.data && 'data' in response.data && (response.data as ApiResponse<CalendarResponse>).data) {
      return (response.data as ApiResponse<CalendarResponse>).data;
    }

    // Si la respuesta viene directa como CalendarResponse
    if (response.data && 'slots' in response.data) {
      return response.data as CalendarResponse;
    }

    if (Array.isArray(response.data)) {
      return {
        rangeStart: startDate,
        rangeEnd: endDate,
        slots: response.data,
      };
    }

    return {
      rangeStart: startDate,
      rangeEnd: endDate,
      slots: [],
    };
  } catch (error) {
    throw new Error(calendarError(error, 'No se pudo consultar la agenda.'));
  }
}

/**
 * Agenda una nueva cita en el negocio autenticado sin enviar businessId en el body (US-022).
 * Lanza error si el servidor rechaza la operación o no devuelve un ID válido.
 */
export async function createCalendarAppointment(
  payload: CreateCalendarAppointmentPayload,
): Promise<string> {
  const rawEmail = (payload.clientEmail ?? '').trim();
  const cleanEmail =
    rawEmail.toLowerCase() === 'cliente@ejemplo.com' ||
    rawEmail.toLowerCase().endsWith('@clientes.slotify.app')
      ? ''
      : rawEmail;

  const rawPhone = (payload.clientPhone ?? '').trim();
  const cleanPhone = rawPhone === '+52 55 1234 5678' ? '' : rawPhone;

  const cleanPayload: CreateCalendarAppointmentPayload = {
    ...payload,
    clientName: payload.clientName.trim(),
    clientEmail: cleanEmail,
    clientPhone: cleanPhone,
  };

  try {
    const response = await apiClient.post<{
      success?: boolean;
      id?: string;
      data?: string;
      error?: string;
      errors?: string[];
      message?: string;
    }>(API_ENDPOINTS.CALENDAR.CREATE_APPOINTMENT, cleanPayload);

    const body = response?.data ?? (response as any);
    if (body?.success === false) {
      throw new Error(
        body.error ||
          (Array.isArray(body.errors) ? body.errors[0] : undefined) ||
          body.message ||
          'El servidor rechazó la creación de la cita.',
      );
    }

    const realId = String(body?.id ?? body?.data ?? '').trim();
    if (!realId) {
      throw new Error('El servidor no devolvió un identificador válido para la cita.');
    }

    return realId;
  } catch (error) {
    throw new Error(calendarError(error, 'No se pudo agendar la cita en el servidor.'));
  }
}

export interface CalendarEmployee {
  id: string;
  name: string;
}

export async function fetchCalendarEmployees(): Promise<CalendarEmployee[]> {
  const { data } = await apiClient.get<ApiResponse<CalendarEmployee[]>>(API_ENDPOINTS.CALENDAR.EMPLOYEES);
  return data.data;
}

export async function updateCalendarAppointment(
  id: string,
  change: { status: 'completed' | 'cancelled' } | { startTime: string; endTime: string },
): Promise<void> {
  try {
    const { data } = await apiClient.patch<{ success: boolean }>(API_ENDPOINTS.CALENDAR.UPDATE_APPOINTMENT(id), change);
    if (data?.success !== true) throw new Error('El servidor no confirmó el cambio de la cita.');
  } catch (error) {
    throw new Error(calendarError(error, 'No se pudo actualizar la cita.'));
  }
}

export function calendarError(
  error: unknown,
  fallback: string,
): string {
  const response = (error as { response?: { data?: { error?: string; errors?: string[]; message?: string } } })?.response?.data;
  return response?.error || response?.errors?.[0] || response?.message ||
    (error instanceof Error ? error.message : fallback);
}
