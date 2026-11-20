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
