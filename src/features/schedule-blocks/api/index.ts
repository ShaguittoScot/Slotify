/**
 * US-008: Schedule Blocks — API Layer
 *
 * Funciones para comunicarse con el endpoint /api/schedule-blocks.
 *
 */

import { apiClient } from '@/shared/lib';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse } from '@/shared/types';

/**
 * Crea un nuevo bloqueo manual en la agenda.
 * Endpoint: POST /api/schedule-blocks
 * Requiere autenticación JWT.
 */
export async function createScheduleBlock(
  payload: { startDateTime: string; endDateTime: string; reason: string },
): Promise<string> {
  const { data } = await apiClient.post<ApiResponse<number | string>>(API_ENDPOINTS.SCHEDULE_BLOCKS.CREATE, payload);
  if (data.success !== true || !data.data) {
    throw new Error('El servidor no confirmó el bloqueo.');
  }
  return String(data.data);
}

/**
 * Elimina un bloqueo existente (desbloquear horario).
 * Endpoint: DELETE /api/schedule-blocks/{id}
 * Requiere autenticación JWT.
 */
export async function deleteScheduleBlock(blockId: string): Promise<void> {
  const { data } = await apiClient.delete<{ success: boolean }>(API_ENDPOINTS.SCHEDULE_BLOCKS.DELETE(blockId));
  if (data?.success !== true) {
    throw new Error('El servidor no confirmó el desbloqueo.');
  }
}
