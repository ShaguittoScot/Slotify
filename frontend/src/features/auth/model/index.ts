import { create } from 'zustand';
import { storage } from '@/shared/lib/storage';
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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true by default until hydrate completes
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(credentials);
      
      await storage.secureSet('accessToken', data.accessToken);
      await storage.secureSet('refreshToken', data.refreshToken);
      await storage.set('user', data.user);

      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(data);
      
      await storage.secureSet('accessToken', res.accessToken);
      await storage.secureSet('refreshToken', res.refreshToken);
      await storage.set('user', res.user);

      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar el negocio';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await storage.secureRemove('accessToken');
    await storage.secureRemove('refreshToken');
    await storage.remove('user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  hydrate: async () => {
    try {
      const token = await storage.secureGet('accessToken');
      const user = await storage.get<AuthUser>('user');

      if (token && user) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
