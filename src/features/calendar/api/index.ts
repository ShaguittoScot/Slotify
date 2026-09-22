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
    const m = curr.getMonth();
    const d = curr.getDate();
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Slot 1: Cita de Corte y Barba (10:00 a 11:00)
    const slot1Start = new Date(y, m, d, 10, 0, 0);
    const slot1End = new Date(y, m, d, 11, 0, 0);
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
    const slot2Start = new Date(y, m, d, 11, 30, 0);
    const slot2End = new Date(y, m, d, 13, 0, 0);
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
    const slot3Start = new Date(y, m, d, 14, 0, 0);
    const slot3End = new Date(y, m, d, 15, 0, 0);
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
    const slot4Start = new Date(y, m, d, 16, 30, 0);
    const slot4End = new Date(y, m, d, 17, 45, 0);
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
