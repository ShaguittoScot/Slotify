/**
 * US-006 / US-002: Sector Templates — API Layer
 *
 * Comunicación HTTP con el backend ASP.NET Core Web API.
 * Endpoint principal: GET /api/sector-templates
 * 
 * Formato de intercambio: JSON camelCase estándar.
 */

import { apiClient } from '@/shared/lib';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, SectorTemplate } from '@/shared/types';
import { CANONICAL_SECTOR_CATEGORIES } from '../constants';
import type { SectorTemplateDto, SaveSectorSelectionPayload } from '../types';

/**
 * Mapea las categorías canónicas predeterminadas al formato SectorTemplate
 */
export function getPresetSectorTemplates(): SectorTemplate[] {
  return CANONICAL_SECTOR_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    defaultModules: cat.defaultModules,
    suggestedServices: cat.suggestedServices,
  }));
}

/**
 * Obtiene todas las plantillas de sector (giros comerciales).
 * Endpoint: GET /api/sector-templates
 * No requiere autenticación previa (onboarding).
 *
 * Implementa estrategia offline-first con fallback a datos canónicos
 * para garantizar operatividad fluida ante desconexión del backend.
 */
export async function fetchSectorTemplates(): Promise<SectorTemplate[]> {
  try {
    const response = await apiClient.get<ApiResponse<SectorTemplateDto[]> | SectorTemplateDto[]>(
      API_ENDPOINTS.SECTOR_TEMPLATES.GET_ALL
    );

    // Si la respuesta viene envuelta en ApiResponse<T> (Result<T> de .NET)
    const rawData = (response.data as any)?.data ?? response.data;

    if (Array.isArray(rawData) && rawData.length > 0) {
      return rawData.map((item) => ({
        id: item.id,
        name: item.name,
        defaultModules: item.defaultModules ?? [],
        suggestedServices: (item.suggestedServices ?? []).map((s: any) => ({
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price ?? undefined,
        })),
      }));
    }

    return getPresetSectorTemplates();
  } catch (error) {
    // Si el backend aún no está encendido o no hay conexión de red,
    // usamos las plantillas canónicas de respaldo para no bloquear el onboarding
    console.warn(
      '[SectorTemplatesAPI] No se pudo conectar al endpoint remoto, usando catálogo canónico local:',
      error
    );
    return getPresetSectorTemplates();
  }
}

/**
 * Persiste la selección del giro comercial en el perfil del negocio
 */
export async function saveBusinessSectorSelection(
  payload: SaveSectorSelectionPayload
): Promise<boolean> {
  try {
    const response = await apiClient.patch<ApiResponse<{ success: boolean }>>(
      `/businesses/${payload.businessId}/sector`,
      payload
    );
    return response.data.success;
  } catch (error) {
    console.warn('[SectorTemplatesAPI] Error persistiendo giro comercial:', error);
    return false;
  }
}
