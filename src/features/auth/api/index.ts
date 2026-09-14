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
      password: credentials.password,
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
   * Register with Supabase Auth, then sync the profile
   * with the .NET backend to create the Business + User row.
   */
  register: async (request: RegisterAdminRequest) => {
    // 1. Create the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        data: {
          full_name: request.fullName,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario.');

    // 2. Sync with our .NET backend
    const syncPayload: SyncProfileRequest = {
      id: data.user.id,
      fullName: request.fullName,
      email: request.email,
      businessName: request.businessName,
      businessPhone: request.businessPhone,
    };

    try {
      await apiClient.post<SyncProfileResponse>(
        API_ENDPOINTS.AUTH.SYNC,
        syncPayload
      );
    } catch (syncError) {
      // If sync fails, we still have the Supabase user
      console.error('Error syncing profile with backend:', syncError);
    }

    return data;
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
