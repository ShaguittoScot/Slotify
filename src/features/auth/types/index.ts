import type { AuthUser } from '@/shared/types';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterAdminRequest {
  fullName: string;
  email: string;
  password?: string;
  businessName: string;
  businessPhone?: string;
  sectorTemplateId?: number;
}

export interface AuthResponse {
  user: any;
  session: any;
}

/**
 * Payload sent to the .NET backend after Supabase signup
 * to sync the user profile and create a business.
 */
export interface SyncProfileRequest {
  id: string;
  fullName: string;
  email: string;
  businessName: string;
  businessPhone?: string;
  sectorTemplateId?: number;
}

export interface SyncProfileResponse {
  success: boolean;
  data?: AuthUser;
  message?: string;
}
