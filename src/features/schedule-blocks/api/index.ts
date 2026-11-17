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
 * Requiere autenticación JWT.
 */
export async function createScheduleBlock(
  payload: CreateScheduleBlockPayload,
): Promise<string> {
  const { data } = await apiClient.post<
    ApiResponse<number | string> | { id: number | string; data?: number | string } | number
  >(API_ENDPOINTS.SCHEDULE_BLOCKS.CREATE, payload);

  if (data && typeof data === 'object') {
    if ('data' in data && (data as any).data !== undefined && (data as any).data !== null) {
      return String((data as any).data);
    }
    if ('id' in data && (data as any).id !== undefined && (data as any).id !== null) {
      return String((data as any).id);
    }
  }

  if (typeof data === 'number' || typeof data === 'string') {
    return String(data);
  }

  throw new Error('El servidor no confirmó el bloqueo.');
}

/**
 * Elimina un bloqueo existente (desbloquear horario).
 * Endpoint: DELETE /api/schedule-blocks/{id}
 * Requiere autenticación JWT.
 */
export async function deleteScheduleBlock(blockId: string | number): Promise<void> {
  const { data } = await apiClient.delete<{ success?: boolean }>(
    API_ENDPOINTS.SCHEDULE_BLOCKS.DELETE(String(blockId)),
  );
  if (data && typeof data === 'object' && 'success' in data && data.success === false) {
    throw new Error('El servidor no confirmó el desbloqueo.');
  }
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

  if (
    response.data &&
    typeof response.data === 'object' &&
    'data' in response.data &&
    Array.isArray((response.data as ApiResponse<ScheduleBlock[]>).data)
  ) {
    return (response.data as ApiResponse<ScheduleBlock[]>).data;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}
