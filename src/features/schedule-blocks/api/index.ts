/**
 * US-008: Schedule Blocks — API Layer
 *
 * Funciones para comunicarse con el endpoint /api/schedule-blocks.
 *
 * TODO: Implementar las llamadas al backend.
 */

import { apiClient } from '@/shared/lib';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, CreateScheduleBlockPayload, ScheduleBlock } from '@/shared/types';

/**
 * Crea un nuevo bloqueo manual en la agenda.
 * Endpoint: POST /api/schedule-blocks
 * Requiere autenticación JWT.
 */
export async function createScheduleBlock(
  payload: CreateScheduleBlockPayload,
): Promise<number> {
  // TODO: Implementar llamada real
  // const response = await apiClient.post<ApiResponse<number>>(
  //   API_ENDPOINTS.SCHEDULE_BLOCKS.CREATE,
  //   payload
  // );
  // return response.data.data; // retorna el ID del bloqueo creado
  throw new Error('US-008: createScheduleBlock no implementado');
}

/**
 * Elimina un bloqueo existente (desbloquear horario).
 * Endpoint: DELETE /api/schedule-blocks/{id}
 * Requiere autenticación JWT.
 */
export async function deleteScheduleBlock(blockId: number): Promise<void> {
  // TODO: Implementar llamada real
  // await apiClient.delete(API_ENDPOINTS.SCHEDULE_BLOCKS.DELETE(blockId));
  throw new Error('US-008: deleteScheduleBlock no implementado');
}
