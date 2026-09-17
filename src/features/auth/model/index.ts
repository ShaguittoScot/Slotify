import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import type { AuthUser } from '@/shared/types';
import { authApi } from '../api';
import type { LoginCredentials, RegisterAdminRequest, SyncProfileRequest } from '../types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isJustRegistered: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterAdminRequest) => Promise<void>;
  completeOnboarding: (data: Omit<SyncProfileRequest, 'id' | 'email'>) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
  setJustRegistered: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isJustRegistered: false,

  setJustRegistered: (val) => set({ isJustRegistered: val }),

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.loginWithGoogle();
      // The redirect will handle hydration when it comes back
    } catch (error: any) {
      set({ error: error.message || 'Error al iniciar con Google', isLoading: false });
    }
  },

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
          businessId: '', // Empty until they finish onboarding
        };
        set({ user: authUser, isAuthenticated: true, isLoading: false, isJustRegistered: true });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error al registrar el usuario', isLoading: false });
      throw error;
    }
  },

  completeOnboarding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = get();
      if (!user) throw new Error('No hay usuario autenticado');

      const payload = {
        id: user.id,
        email: user.email,
        ...data
      };
      
      await authApi.syncProfile(payload);
      
      // Update business state so it marks them as complete
      set({ 
        user: { ...user, businessId: 'synced-backend' }, 
        isJustRegistered: false,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Error al guardar la configuración', isLoading: false });
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
