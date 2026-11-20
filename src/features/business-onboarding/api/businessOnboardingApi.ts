import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type {
  SyncProfileRequest,
  SyncProfileResponse,
  CompleteBusinessOnboardingRequest,
  CompleteBusinessOnboardingResponse,
} from '../types';

export const businessOnboardingApi = {
  /**
   * Sincronización inicial con el backend:
   * Registra al usuario y crea la asociación inicial con el negocio en la BD relacional.
   */
  syncInitialBusiness: async (payload: SyncProfileRequest): Promise<SyncProfileResponse> => {
    const calculatedFullName =
      payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim();

    const response = await apiClient.post<SyncProfileResponse>(
      API_ENDPOINTS.AUTH.SYNC,
      {
        ...payload,
        fullName: calculatedFullName,
      }
    );
    return response.data;
  },

  /**
   * Finalización del onboarding del negocio:
   * Guarda horarios comerciales, servicios iniciales y marca OnboardingCompletedAt.
   */
  completeBusinessOnboarding: async (
    payload: CompleteBusinessOnboardingRequest
  ): Promise<CompleteBusinessOnboardingResponse> => {
    const response = await apiClient.post<CompleteBusinessOnboardingResponse>(
      API_ENDPOINTS.ONBOARDING.COMPLETE_BUSINESS,
      payload
    );
    return response.data;
  },
};
