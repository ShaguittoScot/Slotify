import { supabase } from '@/shared/lib/supabase';
import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { ApiResponse, AuthResponse } from '@/shared/types';
import type {
  LoginCredentials,
  RegisterAdminRequest,
  RegisterClientRequest,
  ExchangeTokenRequest,
} from '../types';

export const authApi = {
  /**
   * Intercambiar identidad autenticada de Supabase (userId + email) por JWT propio de Slotify
   * con claim businessId e información actualizada del negocio (OnboardingCompletedAt).
   */
  exchangeToken: async (request: ExchangeTokenRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      request
    );
    return response.data;
  },

  /**
   * Iniciar sesión con Supabase Auth usando email/password.
   */
  login: async (credentials: LoginCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password || '',
    });

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Iniciar sesión con Google usando Supabase OAuth.
   */
  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Registrar identidad en Supabase Auth.
   * La creación y configuración del negocio se realiza exclusivamente en business-onboarding.
   */
  register: async (request: RegisterAdminRequest) => {
    const calculatedFullName =
      request.fullName || `${request.firstName} ${request.lastName}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: request.email,
      password: request.password || '',
      options: {
        data: {
          first_name: request.firstName,
          last_name: request.lastName,
          full_name: calculatedFullName,
          role: 'DUENO',
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario.');
    return data;
  },

  /**
   * Registrar un cliente consumidor con Supabase Auth y sincronizar con la tabla clientes.
   */
  registerClient: async (request: RegisterClientRequest) => {
    const calculatedFullName =
      request.fullName || `${request.firstName} ${request.lastName}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        data: {
          first_name: request.firstName,
          last_name: request.lastName,
          full_name: calculatedFullName,
          phone: request.phone,
          role: 'CLIENTE',
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario en Supabase.');

    // Sincronizar en la tabla clientes de PostgreSQL vía .NET Backend
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.SYNC_CLIENT, {
        id: data.user.id,
        firstName: request.firstName,
        lastName: request.lastName,
        fullName: calculatedFullName,
        email: request.email,
        phone: request.phone,
      });
    } catch (syncErr: any) {
      console.warn('Advertencia al sincronizar cliente en PostgreSQL (continuando sesión):', syncErr.message);
    }

    return data;
  },

  /**
   * Cerrar sesión en Supabase Auth.
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /**
   * Obtener la sesión activa actual de Supabase.
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },
};
