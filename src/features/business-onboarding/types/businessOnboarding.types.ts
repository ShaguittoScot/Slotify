import type { AuthUser } from '@/shared/types';

/**
 * Payload para POST /api/auth/sync
 * Sincroniza la identidad del usuario y genera la fila inicial de Negocio + Usuario en backend.
 */
export interface SyncProfileRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  businessName: string;
  businessPhone?: string;
  sectorTemplateId?: number;
}

export interface SyncProfileResponse {
  success: boolean;
  data?: AuthUser & {
    accessToken?: string | null;
    refreshToken?: string | null;
  };
  message?: string;
  errors?: string[];
  error?: string | null;
}

/**
 * DTO para la información general del negocio en POST /api/onboarding/complete-business-onboarding
 */
export interface OnboardingBusinessDto {
  name: string;
  phone?: string | null;
  sectorTemplateId: number;
  timeZone: string;
}

/**
 * DTO para el horario comercial en POST /api/onboarding/complete-business-onboarding
 * dayOfWeek: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
 * startTime y endTime: formato 'HH:mm' (ej. '09:00', '18:00')
 */
export interface OnboardingBusinessHourDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * DTO para un servicio inicial en POST /api/onboarding/complete-business-onboarding
 */
export interface OnboardingServiceDto {
  name: string;
  durationMinutes: number;
  price: number;
}

/**
 * Payload completo para POST /api/onboarding/complete-business-onboarding
 * La identidad y pertenencia del negocio se resuelven exclusivamente mediante los claims del JWT autenticado.
 * Por motivos de seguridad y aislamiento multi-inquilino, NO debe incluir 'id' ni 'email'.
 */
export interface CompleteBusinessOnboardingRequest {
  firstName: string;
  lastName?: string;
  fullName?: string;
  business: OnboardingBusinessDto;
  businessHours: OnboardingBusinessHourDto[];
  services: OnboardingServiceDto[];
}

export interface CompleteBusinessOnboardingResponse {
  success: boolean;
  data?: AuthUser & {
    accessToken?: string | null;
    refreshToken?: string | null;
  };
  message?: string | null;
  errors?: string[];
  error?: string | null;
}

/**
 * Estado del formulario y progreso del onboarding de negocio
 */
export interface BusinessOnboardingFormData {
  category: string;
  sectorTemplateId: number;
  businessName: string;
  businessPhone: string;
  timeZone: string;
  selectedDays: string[]; // e.g. ['L', 'M', 'X', 'J', 'V']
  startTime: string;      // e.g. '09:00 AM' o '09:00:00'
  endTime: string;        // e.g. '06:00 PM' o '18:00:00'
  serviceName: string;
  serviceDuration: string;
  servicePrice: string;
}
