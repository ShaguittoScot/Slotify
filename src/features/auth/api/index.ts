import { supabase } from '@/shared/lib/supabase';
import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import type { LoginCredentials, RegisterAdminRequest, SyncProfileRequest, SyncProfileResponse } from '../types';

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
    const { data, error } = await supabase.auth.signUp({
      email: request.email,
      password: request.password || '',
      options: {
        data: {
          full_name: request.fullName,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario.');
    return data;
  },

  /**
   * Sync profile with .NET backend to create Business + User row.
   * Called at the end of onboarding.
   */
  syncProfile: async (syncPayload: SyncProfileRequest) => {
    const response = await apiClient.post<SyncProfileResponse>(
      API_ENDPOINTS.AUTH.SYNC,
      syncPayload
    );
    return response.data;
  },

  /**
   * Sign out from Supabase Auth.
   */
  logout: async () => {
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
