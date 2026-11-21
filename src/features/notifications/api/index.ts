/**
 * US-Notifications: API Layer — capa de comunicación con el backend.
 * Feature-Based Architecture (FBA) — feature `notifications`.
 *
 * Llama al endpoint protegido GET /api/notifications/upcoming
 * que devuelve citas próximas + hash de snapshot para el motor local.
 */

import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import { useAuthStore } from '@/features/auth/model';
import { generateMockCalendarSlots } from '@/features/calendar/api';
import type { ApiResponse } from '@/shared/types';
import type { UpcomingAppointment, UpcomingNotificationsResponse } from '../types';

/**
 * Obtiene las citas próximas del usuario autenticado (negocio o cliente)
 * junto con un hash del snapshot actual para detección de cambios.
 *
 * @param horizonDays Días hacia adelante a consultar (1–90, default 30).
 */
export async function fetchUpcomingNotifications(
  horizonDays = 30,
): Promise<UpcomingNotificationsResponse> {
  const currentUser = useAuthStore.getState().user;
  const isDemo =
    currentUser?.email === 'demo@slotify.com' ||
    currentUser?.email === 'admin@slotify.com';

  if (isDemo) {
    const now = new Date();
    const future = new Date(now.getTime() + horizonDays * 86_400_000);
    const mockSlots = generateMockCalendarSlots(now, future);
    const mockAppointments: UpcomingAppointment[] = mockSlots
      .filter((s) => s.type === 'appointment')
      .map((s) => ({
        id: s.resourceId,
        startTime: s.startTime,
        endTime: s.endTime,
        clientName: s.clientName,
        status: s.status as any,
        employeeName: s.employeeName,
        businessName: 'Barbería Slotify Demo',
      }));
    return {
      appointments: mockAppointments,
      snapshotHash: `demo-hash-${mockAppointments.length}`,
      generatedAt: now.toISOString(),
      horizonDays,
    };
  }

  const response = await apiClient.get<
    ApiResponse<UpcomingNotificationsResponse> | UpcomingNotificationsResponse
  >(API_ENDPOINTS.NOTIFICATIONS.UPCOMING, {
    params: { horizonDays },
    timeout: 10_000,
  });

  const data = response.data;

  // Soporta respuesta directa o envuelta en ApiResponse<T>
  if (data && 'data' in data && (data as ApiResponse<UpcomingNotificationsResponse>).data) {
    return (data as ApiResponse<UpcomingNotificationsResponse>).data;
  }

  return data as UpcomingNotificationsResponse;
}
