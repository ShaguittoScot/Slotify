/**
 * Explore Feature — API Layer
 */

import { apiClient } from '@/shared/lib/api';
import type { BusinessDto } from '../types';

export const exploreApi = {
  /**
   * Obtiene la lista de negocios públicos disponibles para explorar y agendar.
   */
  getBusinesses: async (): Promise<BusinessDto[]> => {
    const res = await apiClient.get<BusinessDto[]>('/businesses');
    return Array.isArray(res.data) ? res.data : [];
  },

  /**
   * Obtiene el detalle público de un negocio específico mediante su slug.
   */
  getBusinessBySlug: async (slug: string): Promise<BusinessDto> => {
    const res = await apiClient.get<BusinessDto>(`/businesses/${slug}`);
    return res.data;
  },
};

