/**
 * Business Detail Feature — API Layer
 */

import { apiClient } from '@/shared/lib/api';
import type { BusinessDetailDto } from '../types';

export const businessDetailApi = {
  /**
   * Obtiene el detalle público y catálogo de servicios de un negocio específico mediante su slug.
   * Endpoint backend: GET /api/businesses/{slug}
   */
  getBusinessBySlug: async (slug: string): Promise<BusinessDetailDto> => {
    const res = await apiClient.get<BusinessDetailDto>(
      `/businesses/${encodeURIComponent(slug.trim())}`
    );
    return res.data;
  },
};
