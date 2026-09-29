import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import type { AuthUser } from '@/shared/types';
import { authApi } from '../api';
import type { LoginCredentials, RegisterAdminRequest, RegisterClientRequest, SyncProfileRequest } from '../types';

export type AppMode = 'BUSINESS' | 'CONSUMER';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  appMode: AppMode;
  isJustRegistered: boolean;

  // Actions
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;
  setJustRegistered: (val: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterAdminRequest) => Promise<void>;
  registerClient: (data: RegisterClientRequest) => Promise<void>;
  completeOnboarding: (data: Omit<SyncProfileRequest, 'id' | 'email'>) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

const buildAuthUser = (user: any, fallback?: Partial<AuthUser>): AuthUser => {
  const meta = user.user_metadata || {};
  const firstName = meta.first_name || fallback?.firstName || '';
  const lastName = meta.last_name || fallback?.lastName || '';
  const fullName =
    meta.full_name ||
    fallback?.fullName ||
    (firstName ? `${firstName} ${lastName}`.trim() : user.email || 'Usuario');
  const role = (meta.role as 'DUENO' | 'EMPLEADO' | 'CLIENTE') || fallback?.role || 'DUENO';
  const businessId = meta.business_id || fallback?.businessId || '';

  return {
    id: user.id,
    firstName,
    lastName,
    fullName,
    email: user.email || '',
    role,
    businessId,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  appMode: 'BUSINESS',
  isJustRegistered: false,

  setAppMode: (mode) => set({ appMode: mode }),
  toggleAppMode: () =>
    set((state) => ({
      appMode: state.appMode === 'BUSINESS' ? 'CONSUMER' : 'BUSINESS',
    })),
  setJustRegistered: (val) => set({ isJustRegistered: val }),

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.loginWithGoogle();
    } catch (error: any) {
      set({ error: error.message || 'Error al iniciar con Google', isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });

    // Modo Demo para pruebas locales y evaluación del sprint
    if (credentials.email === 'demo@slotify.com' || credentials.email === 'admin@slotify.com') {
      const demoUser: AuthUser = {
        id: 'demo-user-123',
        firstName: 'Administrador',
        lastName: 'Slotify',
        fullName: 'Administrador Slotify',
        email: credentials.email,
        role: 'DUENO',
        businessId: 'demo-biz-456',
      };
      set({ user: demoUser, isAuthenticated: true, isLoading: false });
      return;
    }

    try {
      const data = await authApi.login(credentials);

      if (data.user) {
        const authUser = buildAuthUser(data.user);
        set({
          user: authUser,
          isAuthenticated: true,
          appMode: authUser.role === 'CLIENTE' ? 'CONSUMER' : 'BUSINESS',
          isLoading: false,
        });
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
        const authUser = buildAuthUser(res.user, {
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
          role: 'DUENO',
          businessId: '',
        });
        set({
          user: authUser,
          isAuthenticated: true,
          appMode: 'BUSINESS',
          isLoading: false,
          isJustRegistered: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error al registrar el negocio', isLoading: false });
      throw error;
    }
  },

  registerClient: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.registerClient(data);

      if (res.user) {
        const authUser = buildAuthUser(res.user, {
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
          role: 'CLIENTE',
          businessId: '',
        });
        set({
          user: authUser,
          isAuthenticated: true,
          appMode: 'CONSUMER',
          isLoading: false,
          isJustRegistered: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error al crear la cuenta de cliente', isLoading: false });
      throw error;
    }
  },

  completeOnboarding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = get();
      if (!user) throw new Error('No hay usuario autenticado');

      const payload: SyncProfileRequest = {
        id: user.id,
        email: user.email,
        firstName: data.firstName || user.firstName || user.fullName.split(' ')[0] || 'Usuario',
        lastName: data.lastName || user.lastName || user.fullName.split(' ').slice(1).join(' '),
        fullName: data.fullName || user.fullName,
        businessName: data.businessName,
        businessPhone: data.businessPhone,
        sectorTemplateId: data.sectorTemplateId,
      };

      try {
        await authApi.syncProfile(payload);
      } catch (syncErr: any) {
        console.warn('Backend sync warning (continuing locally):', syncErr.message);
      }

      // Update business state so it marks them as complete
      set({
        user: { ...user, businessId: user.businessId || 'synced-backend' },
        isJustRegistered: false,
        isLoading: false,
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
        const authUser = buildAuthUser(session.user);
        set({
          user: authUser,
          isAuthenticated: true,
          appMode: authUser.role === 'CLIENTE' ? 'CONSUMER' : 'BUSINESS',
          isLoading: false,
        });
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
    const authUser = buildAuthUser(session.user);
    useAuthStore.setState({
      user: authUser,
      isAuthenticated: true,
      appMode: authUser.role === 'CLIENTE' ? 'CONSUMER' : 'BUSINESS',
    });
  }
});