/**
 * US-003: Calendar — API Layer
 *
 * Funciones para comunicarse con el endpoint /api/calendar.
 *
 * TODO: Implementar las llamadas al backend.
 */

import { apiClient } from '@/shared/lib';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, CalendarResponse } from '@/shared/types';

/**
 * Obtiene los slots del calendario para un rango de fechas.
 * Endpoint: GET /api/calendar/slots?startDate=...&endDate=...
 * Requiere autenticación JWT (el BusinessId se extrae del token).
 */
export async function fetchCalendarSlots(
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<CalendarResponse> {
  // TODO: Implementar llamada real
  // const params = { startDate, endDate, employeeId };
  // const response = await apiClient.get<ApiResponse<CalendarResponse>>(
  //   API_ENDPOINTS.CALENDAR.GET_SLOTS,
  //   { params }
  // );
  // return response.data.data;
  throw new Error('US-003: fetchCalendarSlots no implementado');
}
