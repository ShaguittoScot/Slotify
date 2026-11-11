import { supabase } from '@/shared/lib/supabase';
import { isAxiosError } from 'axios';
import type { Session } from '@supabase/supabase-js';
import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/shared/lib/constants';
import { storage } from '@/shared/lib/storage';
import type {
  ExchangeTokenResponse,
  LoginCredentials,
  RegisterAdminRequest,
  RegisterClientRequest,
  SyncProfileRequest,
  SyncProfileResponse,
} from '../types';

export function authRequestMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<{ error?: string }>(error)) {
    return error instanceof Error ? error.message : fallback;
  }
  if (!error.response) {
    return 'No se pudo conectar con Slotify. Revisa tu conexión e inténtalo de nuevo.';
  }
  return error.response.data?.error || fallback;
}

export const authApi = {
  /**
   * Sign in with Supabase Auth using email/password.
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
   * Intercambia la identidad autenticada de Supabase por el JWT propio de Slotify (.NET JwtService)
   * que contiene el claim `businessId` requerido por los endpoints protegidos (US-022).
   */
  exchangeBackendToken: async (supabaseToken: string, userId: string) => {
    let tokenData: ExchangeTokenResponse['data'];
    try {
      const response = await apiClient.post<ExchangeTokenResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        undefined,
        { headers: { Authorization: `Bearer ${supabaseToken}` } },
      );
      tokenData = response.data?.data;
    } catch (error) {
      if (isAxiosError<{ code?: string }>(error) && error.response?.status === 404 &&
          error.response.data?.code === 'business_profile_missing') {
        return null;
      }
      throw error;
    }

    if (tokenData?.accessToken && tokenData.user?.id === userId &&
        (await authApi.getSession())?.user.id === userId) {
      await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken);
      if (tokenData.refreshToken) {
        await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
      }
      return tokenData;
    }

    throw new Error('Slotify no pudo confirmar el perfil de esta sesión.');
  },

  /**
   * Sign in with Google using Supabase OAuth.
   */
  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Register with Supabase Auth.
   * Syncing with .NET backend is done separately in onboarding.
   */
  register: async (request: RegisterAdminRequest) => {
    const calculatedFullName = request.fullName || `${request.firstName} ${request.lastName}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: request.email,
      password: request.password || '',
      options: {
        data: {
          first_name: request.firstName,
          last_name: request.lastName,
          full_name: calculatedFullName,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario.');
    return data;
  },

  /**
   * Register a consumer client with Supabase Auth and synchronize with PostgreSQL clientes table.
   */
  registerClient: async (request: RegisterClientRequest) => {
    const calculatedFullName = request.fullName || `${request.firstName} ${request.lastName}`.trim();
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

    if (data.session) {
      await authApi.syncClient(data.session);
    }

    return data;
  },

  syncClient: async (session: Session) => {
    const { user, access_token } = session;
    const meta = user.user_metadata;
    await apiClient.post(API_ENDPOINTS.AUTH.SYNC_CLIENT, {
      id: user.id,
      firstName: meta.first_name,
      lastName: meta.last_name,
      fullName: meta.full_name,
      email: user.email,
      phone: meta.phone,
    }, { headers: { Authorization: `Bearer ${access_token}` } });
  },

  /**
   * Sync profile with .NET backend to create Business + User row and store the issued JwtService token.
   * Called at the end of onboarding.
   */
  syncProfile: async (syncPayload: SyncProfileRequest) => {
    const session = await authApi.getSession();
    if (!session || session.user.id !== syncPayload.id) {
      throw new Error('Inicia sesión para guardar el perfil del negocio.');
    }
    const calculatedFullName = syncPayload.fullName || `${syncPayload.firstName || ''} ${syncPayload.lastName || ''}`.trim();
    const response = await apiClient.post<SyncProfileResponse>(
      API_ENDPOINTS.AUTH.SYNC,
      {
        ...syncPayload,
        fullName: calculatedFullName,
      },
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );

    const syncedData = response.data?.data;
    if (response.data?.success !== true || !syncedData?.accessToken || !syncedData.businessId ||
        syncedData.id !== syncPayload.id || (await authApi.getSession())?.user.id !== syncPayload.id) {
      throw new Error('Slotify no pudo confirmar el registro del negocio para esta sesión.');
    }

    await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, syncedData.accessToken);
    if (syncedData.refreshToken) {
      await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, syncedData.refreshToken);
    }

    return response.data;
  },

  /**
   * Sign out from Supabase Auth and clear Slotify JWT tokens.
   */
  logout: async () => {
    await storage.secureRemove(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /**
   * Get the current session from Supabase.
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },
};
