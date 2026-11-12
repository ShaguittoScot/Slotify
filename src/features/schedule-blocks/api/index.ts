/**
 * US-008 / US-023: Schedule Blocks — API Layer
 *
 * Funciones para comunicarse con el endpoint /api/schedule-blocks en el backend .NET.
 * Maneja el flujo de creación, consulta y eliminación de bloqueos manuales de agenda.
 */

import { apiClient } from '@/shared/lib';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, CreateScheduleBlockPayload, ScheduleBlock } from '@/shared/types';

/**
 * Crea un nuevo bloqueo manual en la agenda del negocio autenticado.
 * Endpoint: POST /api/schedule-blocks
 * Requiere autenticación JWT (el BusinessId es resuelto en el backend a través de ICurrentUserService).
 */
export async function createScheduleBlock(
  payload: CreateScheduleBlockPayload,
): Promise<number> {
  const response = await apiClient.post<ApiResponse<number> | { id: number; data?: number } | number>(
    API_ENDPOINTS.SCHEDULE_BLOCKS.CREATE,
    payload,
  );

  if (response.data && typeof response.data === 'object') {
    if ('data' in response.data && typeof (response.data as any).data === 'number') {
      return (response.data as any).data;
    }
    if ('id' in response.data && typeof (response.data as any).id === 'number') {
      return (response.data as any).id;
    }
  }

  if (typeof response.data === 'number') {
    return response.data;
  }

  return 0;
}

/**
 * Elimina un bloqueo existente (desbloquear horario).
 * Endpoint: DELETE /api/schedule-blocks/{id}
 * Requiere autenticación JWT y valida pertenencia al negocio.
 */
export async function deleteScheduleBlock(blockId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.SCHEDULE_BLOCKS.DELETE(blockId));
}

/**
 * Obtiene la lista de bloqueos manuales para el negocio autenticado en un rango de fechas.
 * Endpoint: GET /api/schedule-blocks
 */
export async function fetchScheduleBlocks(
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<ScheduleBlock[]> {
  const params: Record<string, string> = { startDate, endDate };
  if (employeeId) {
    params.employeeId = employeeId;
  }

  const response = await apiClient.get<ApiResponse<ScheduleBlock[]> | ScheduleBlock[]>(
    API_ENDPOINTS.SCHEDULE_BLOCKS.CREATE,
    { params },
  );

  if (response.data && 'data' in response.data && Array.isArray((response.data as ApiResponse<ScheduleBlock[]>).data)) {
    return (response.data as ApiResponse<ScheduleBlock[]>).data;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}
