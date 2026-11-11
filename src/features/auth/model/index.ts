import { create } from 'zustand';
import { supabase } from '@/shared/lib/supabase';
import type { AuthUser } from '@/shared/types';
import { authApi, authRequestMessage } from '../api';
import type { LoginCredentials, RegisterAdminRequest, RegisterClientRequest, SyncProfileRequest } from '../types';

export type AppMode = 'BUSINESS' | 'CONSUMER';
type BusinessProfileStatus = 'unknown' | 'needs-setup' | 'ready' | 'unavailable';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  appMode: AppMode;
  isJustRegistered: boolean;
  businessProfileStatus: BusinessProfileStatus;

  // Actions
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;
  setJustRegistered: (val: boolean) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
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
  const businessId = fallback?.businessId || '';

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

async function resolveBusinessProfile(
  user: AuthUser,
  supabaseToken: string,
): Promise<Pick<AuthState, 'user' | 'businessProfileStatus' | 'error'>> {
  if (user.role === 'CLIENTE') {
    return { user, businessProfileStatus: 'unknown', error: null };
  }

  try {
    const tokenData = await authApi.exchangeBackendToken(supabaseToken, user.id);
    if (tokenData === null) {
      return { user, businessProfileStatus: 'needs-setup', error: null };
    }
    if (tokenData.user.businessId) {
      return {
        user: {
          ...user,
          firstName: tokenData.user.firstName || user.firstName,
          lastName: tokenData.user.lastName ?? user.lastName,
          fullName: tokenData.user.fullName || user.fullName,
          businessId: tokenData.user.businessId,
          role: ['employee', 'empleado'].includes(String(tokenData.user.role).toLowerCase()) ? 'EMPLEADO' : user.role,
        },
        businessProfileStatus: 'ready',
        error: null,
      };
    }
    throw new Error('Slotify no pudo confirmar el negocio de esta cuenta.');
  } catch (error) {
    return {
      user,
      businessProfileStatus: 'unavailable',
      error: authRequestMessage(error, 'No se pudo verificar el negocio de esta cuenta. Inténtalo de nuevo.'),
    };
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  appMode: 'BUSINESS',
  isJustRegistered: false,
  businessProfileStatus: 'unknown',

  setAppMode: (mode) => set({ appMode: mode }),
  toggleAppMode: () =>
    set((state) => ({
      appMode: state.appMode === 'BUSINESS' ? 'CONSUMER' : 'BUSINESS',
    })),
  setJustRegistered: (val) => set({ isJustRegistered: val }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : ({ ...partial } as AuthUser),
    })),

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.loginWithGoogle();
    } catch (error: any) {
      set({ error: error.message || 'Error al iniciar con Google' });
    } finally {
      set({ isLoading: false });
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
      set({ user: demoUser, isAuthenticated: true, isLoading: false, appMode: 'BUSINESS', businessProfileStatus: 'ready' });
      return;
    }

    try {
      const data = await authApi.login(credentials);

      if (!data.session) throw new Error('No se pudo iniciar la sesión.');
      const user = buildAuthUser(data.session.user);
      if (user.role === 'CLIENTE') await authApi.syncClient(data.session);
      const profile = await resolveBusinessProfile(user, data.session.access_token);
      set({
        ...profile,
        isAuthenticated: true,
        appMode: user.role === 'CLIENTE' ? 'CONSUMER' : 'BUSINESS',
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Error al iniciar sesión', isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(data);
      if (!res.session) throw new Error('Confirma tu correo y después inicia sesión.');

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
          businessProfileStatus: 'needs-setup',
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
      if (!res.session) throw new Error('Confirma tu correo y después inicia sesión.');

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
          businessProfileStatus: 'unknown',
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
    set({ error: null });
    try {
      const { user, businessProfileStatus } = get();
      if (!user || businessProfileStatus !== 'needs-setup') {
        throw new Error('La configuración inicial solo está disponible para cuentas sin negocio.');
      }

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

      const syncResponse = await authApi.syncProfile(payload);
      const syncedBusinessId = syncResponse?.data?.businessId;
      if (!syncedBusinessId || get().user?.id !== user.id) {
        throw new Error('El servidor no confirmó el registro del negocio.');
      }

      set({
        user: { ...user, businessId: syncedBusinessId },
        businessProfileStatus: 'ready',
        isJustRegistered: false,
      });
    } catch (error) {
      set({ error: authRequestMessage(error, 'No se pudo guardar la configuración del negocio. Inténtalo de nuevo.') });
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
    set({ user: null, isAuthenticated: false, isLoading: false, error: null, businessProfileStatus: 'unknown' });
  },

  hydrate: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = await authApi.getSession();

      if (session?.user) {
        const user = buildAuthUser(session.user);
        const profile = await resolveBusinessProfile(user, session.access_token);
        set({
          ...profile,
          isAuthenticated: true,
          appMode: user.role === 'CLIENTE' ? 'CONSUMER' : 'BUSINESS',
          isLoading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, businessProfileStatus: 'unknown' });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false, businessProfileStatus: 'unknown' });
    }
  },

  clearError: () => set({ error: null }),
}));

// Listen for Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false, businessProfileStatus: 'unknown' });
  } else if (event === 'SIGNED_IN' && session?.user) {
    // Supabase mantiene un bloqueo de sesión durante el callback.
    setTimeout(() => {
      const { isAuthenticated, isLoading, hydrate } = useAuthStore.getState();
      if (!isAuthenticated && !isLoading) void hydrate();
    }, 0);
  }
});
