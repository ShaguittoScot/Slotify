/**
 * US-003: Calendar — API Layer
 *
 * Funciones para comunicarse con el endpoint /api/calendar de Slotify_back.
 * Soporta consulta en tiempo real y fallback de slots simulados para desarrollo.
 */

import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, CalendarResponse, CalendarSlot } from '@/shared/types';

/** Generador de datos simulados realistas para visualización offline / preview */
export function generateMockCalendarSlots(startDate: Date, endDate: Date): CalendarSlot[] {
  const slots: CalendarSlot[] = [];
  const curr = new Date(startDate);

  while (curr <= endDate) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // Slot 1: Cita de Corte y Peinado
    slots.push({
      type: 'appointment',
      resourceId: `apt-1-${dateStr}`,
      startTime: `${dateStr}T09:00:00.000Z`,
      endTime: `${dateStr}T10:00:00.000Z`,
      title: 'Corte de Cabello y Barba',
      status: 'confirmed',
      clientName: 'Carlos Mendoza',
    });

    // Slot 2: Cita de Colorimetría
    slots.push({
      type: 'appointment',
      resourceId: `apt-2-${dateStr}`,
      startTime: `${dateStr}T11:30:00.000Z`,
      endTime: `${dateStr}T13:00:00.000Z`,
      title: 'Tratamiento Capilar',
      status: 'confirmed',
      clientName: 'Sofía Valenzuela',
    });

    // Slot 3: Bloqueo de Almuerzo / Descanso
    slots.push({
      type: 'block',
      resourceId: `blk-1-${dateStr}`,
      startTime: `${dateStr}T14:00:00.000Z`,
      endTime: `${dateStr}T15:00:00.000Z`,
      title: 'Almuerzo / Bloqueo de Personal',
      status: 'blocked',
      blockReason: 'Horario de comida',
    });

    // Slot 4: Cita de la tarde
    slots.push({
      type: 'appointment',
      resourceId: `apt-3-${dateStr}`,
      startTime: `${dateStr}T16:00:00.000Z`,
      endTime: `${dateStr}T17:15:00.000Z`,
      title: 'Perfilado y Afeitado Clásico',
      status: 'confirmed',
      clientName: 'Alejandro Rivera',
    });

    curr.setDate(curr.getDate() + 1);
  }

  return slots;
}

/**
 * Obtiene los slots del calendario para un rango de fechas desde Slotify_back.
 * Endpoint: GET /api/calendar/slots?startDate=...&endDate=...
 */
export async function fetchCalendarSlots(
  startDate: string,
  endDate: string,
  employeeId?: string
): Promise<CalendarResponse> {
  try {
    const params: Record<string, string> = { startDate, endDate };
    if (employeeId) params.employeeId = employeeId;

    const response = await apiClient.get<CalendarResponse | ApiResponse<CalendarResponse>>(
      API_ENDPOINTS.CALENDAR.GET_SLOTS,
      { params }
    );

    // Si la respuesta viene envuelta en ApiResponse<T>
    if (response.data && 'data' in response.data && (response.data as ApiResponse<CalendarResponse>).data) {
      return (response.data as ApiResponse<CalendarResponse>).data;
    }

    // Si la respuesta viene directa como CalendarResponse
    if (response.data && 'slots' in response.data) {
      return response.data as CalendarResponse;
    }

    throw new Error('Formato de respuesta de calendario no válido');
  } catch (error) {
    // Si el backend local no está corriendo en este momento, devolvemos fallback simulado
    const start = new Date(startDate);
    const end = new Date(endDate);
    const mockSlots = generateMockCalendarSlots(start, end);

    return {
      rangeStart: startDate,
      rangeEnd: endDate,
      slots: mockSlots,
    };
  }
}
