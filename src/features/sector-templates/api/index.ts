/**
 * US-006 / US-002: Sector Templates — API Layer
 *
 * Funciones para comunicarse con el endpoint /api/sector-templates.
 * Usa apiClient (Axios) configurado en shared/lib/api.ts.
 *
 * TODO: Implementar las llamadas al backend.
 */

import { apiClient } from '@/shared/lib';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, SectorTemplate } from '@/shared/types';

/**
 * Obtiene todas las plantillas de sector (giros comerciales).
 * Endpoint: GET /api/sector-templates
 * No requiere autenticación (datos de seed, onboarding).
 */
export async function fetchSectorTemplates(): Promise<SectorTemplate[]> {
  // TODO: Implementar llamada real
  // const response = await apiClient.get<ApiResponse<SectorTemplate[]>>(
  //   API_ENDPOINTS.SECTOR_TEMPLATES.GET_ALL
  // );
  // return response.data.data;
  throw new Error('US-006: fetchSectorTemplates no implementado');
}
