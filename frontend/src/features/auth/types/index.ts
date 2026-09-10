import type { AuthUser } from '@/shared/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterAdminRequest {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  businessPhone: string;
  sectorTemplateId: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}
