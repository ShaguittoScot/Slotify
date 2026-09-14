import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import type { AuthUser } from '@/shared/types';
import { authApi } from '../api';
import type { LoginCredentials, RegisterAdminRequest } from '../types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterAdminRequest) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(credentials);

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          fullName: data.user.user_metadata?.full_name || '',
          email: data.user.email || '',
          role: 'DUENO',
          businessId: data.user.user_metadata?.business_id || '',
        };
        set({ user: authUser, isAuthenticated: true, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error al iniciar sesión', isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(data);

      if (res.user) {
        const authUser: AuthUser = {
          id: res.user.id,
          fullName: res.user.user_metadata?.full_name || data.fullName,
          email: res.user.email || data.email,
          role: 'DUENO',
          businessId: '',
        };
        set({ user: authUser, isAuthenticated: true, isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error al registrar el negocio', isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  hydrate: async () => {
    try {
      const session = await authApi.getSession();

      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          fullName: session.user.user_metadata?.full_name || '',
          email: session.user.email || '',
          role: 'DUENO',
          businessId: session.user.user_metadata?.business_id || '',
        };
        set({ user: authUser, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// Listen for Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  } else if (event === 'SIGNED_IN' && session?.user) {
    const authUser: AuthUser = {
      id: session.user.id,
      fullName: session.user.user_metadata?.full_name || '',
      email: session.user.email || '',
      role: 'DUENO',
      businessId: session.user.user_metadata?.business_id || '',
    };
    useAuthStore.setState({ user: authUser, isAuthenticated: true });
  }
});
