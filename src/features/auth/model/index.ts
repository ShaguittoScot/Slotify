import { STORAGE_KEYS } from '@/shared/lib/constants';
import { normalizeError, type NormalizedError } from '@/shared/lib/errorUtils';
import { storage } from '@/shared/lib/storage';
import { supabase } from '@/shared/lib/supabase';
import type { AuthUser } from '@/shared/types';
import { create } from 'zustand';
import { authApi, authRequestMessage } from '../api';
import type {
  LoginCredentials,
  RegisterAdminRequest,
  RegisterClientRequest,
  SyncProfileRequest,
} from '../types';

export type AppMode = 'BUSINESS' | 'CONSUMER';
export type BusinessProfileStatus = 'unknown' | 'needs-setup' | 'ready' | 'unavailable';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Estado exclusivo para la verificación inicial de sesión al arrancar la app */
  isHydrating: boolean;
  error: string | null;
  formError: NormalizedError | null;
  /** Error explícito al intercambiar o validar credenciales contra el backend */
  syncError: string | null;
  appMode: AppMode;
  isJustRegistered: boolean;
  businessProfileStatus: BusinessProfileStatus;

  // Actions
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;
  setJustRegistered: (val: boolean) => void;
  setSyncError: (error: string | null) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterAdminRequest) => Promise<void>;
  registerClient: (data: RegisterClientRequest) => Promise<void>;
  completeOnboarding: (data: SyncProfileRequest) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

const buildAuthUser = (user: any, fallback?: Partial<AuthUser>): AuthUser => {
  const meta = user.user_metadata || {};
  const firstName = fallback?.firstName || meta.first_name || '';
  const lastName = fallback?.lastName || meta.last_name || '';
  const fullName =
    fallback?.fullName ||
    meta.full_name ||
    (firstName ? `${firstName} ${lastName}`.trim() : user.email || 'Usuario');

  let role: 'DUENO' | 'EMPLEADO' | 'CLIENTE' = 'DUENO';
  const rawRole = fallback?.role || meta.role;
  if (rawRole === 'Owner' || rawRole === 'DUENO') role = 'DUENO';
  else if (rawRole === 'Employee' || rawRole === 'EMPLEADO') role = 'EMPLEADO';
  else if (rawRole === 'CLIENTE') role = 'CLIENTE';

  const businessId = fallback?.businessId || meta.business_id || '';
  const businessName = fallback?.businessName || meta.business_name || '';
  const isOnboardingCompleted = fallback?.isOnboardingCompleted ?? Boolean(meta.is_onboarding_completed || fallback?.businessId);

  return {
    id: user.id,
    firstName,
    lastName,
    fullName,
    email: user.email || '',
    role,
    businessId,
    businessName,
    isOnboardingCompleted,
  };
};

const getAuthRequestMessage = (err: unknown, fallback: string): string => {
  return typeof authRequestMessage === 'function'
    ? authRequestMessage(err, fallback)
    : ((err as any)?.response?.data?.error || (err as any)?.response?.data?.message || (err as any)?.message || fallback);
};

async function resolveBusinessProfile(
  user: AuthUser,
  supabaseToken: string
): Promise<Pick<AuthState, 'user' | 'businessProfileStatus' | 'error' | 'syncError'> & { isRejectedAuth?: boolean; status?: number }> {
  if (user.role === 'CLIENTE') {
    return { user, businessProfileStatus: 'unknown', error: null, syncError: null };
  }

  try {
    let tokenData: ExchangeTokenResponse['data'] | null = null;
    if (typeof authApi.exchangeBackendToken === 'function') {
      tokenData = await authApi.exchangeBackendToken(supabaseToken, user.id);
    } else if (typeof authApi.exchangeToken === 'function') {
      try {
        const res = await authApi.exchangeToken({ userId: user.id, email: user.email });
        tokenData = res?.data ?? null;
      } catch (err: any) {
        const msg = String(err?.response?.data?.error || err?.response?.data?.message || err?.message || '').toLowerCase();
        if (msg.includes('no cuenta con un negocio') || msg.includes('aún no cuenta')) {
          tokenData = null;
        } else {
          throw err;
        }
      }
    }

    if (tokenData === null) {
      return {
        user: { ...user, businessId: '', isOnboardingCompleted: false },
        businessProfileStatus: 'needs-setup',
        error: null,
        syncError: null,
      };
    }

    if (tokenData?.accessToken && typeof storage.secureSet === 'function') {
      await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken);
      if (tokenData.refreshToken) {
        await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
      }
    }

    if (tokenData?.user?.businessId) {
      return {
        user: {
          ...user,
          firstName: tokenData.user.firstName || user.firstName,
          lastName: tokenData.user.lastName ?? user.lastName,
          fullName: tokenData.user.fullName || user.fullName,
          businessId: tokenData.user.businessId,
          isOnboardingCompleted: Boolean(tokenData.user.isOnboardingCompleted),
          role: ['employee', 'empleado'].includes(
            String(tokenData.user.role).toLowerCase()
          )
            ? 'EMPLEADO'
            : user.role,
        },
        businessProfileStatus: 'ready',
        error: null,
        syncError: null,
      };
    }
    throw new Error('Slotify no pudo confirmar el negocio de esta cuenta.');
  } catch (error: any) {
    const status = error?.response?.status;
    const isRejectedAuth = status === 401 || status === 403 || status === 409;
    const errMessage = getAuthRequestMessage(
      error,
      'No se pudo verificar el negocio de esta cuenta. Inténtalo de nuevo.'
    );
    return {
      user: isRejectedAuth ? null : user,
      businessProfileStatus: 'unavailable',
      error: errMessage,
      syncError: errMessage,
      isRejectedAuth,
      status,
    };
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrating: true,
  error: null,
  formError: null,
  syncError: null,
  appMode: 'BUSINESS',
  isJustRegistered: false,
  businessProfileStatus: 'unknown',

  setAppMode: (mode) => set({ appMode: mode }),
  toggleAppMode: () =>
    set((state) => ({
      appMode: state.appMode === 'BUSINESS' ? 'CONSUMER' : 'BUSINESS',
    })),
  setJustRegistered: (val) => set({ isJustRegistered: val }),
  setSyncError: (error) => set({ syncError: error }),
  updateUser: (partial) => {
    set((state) => {
      const updated = state.user ? { ...state.user, ...partial } : ({ ...partial } as AuthUser);
      storage.set(STORAGE_KEYS.USER_DATA, updated).catch(() => { });
      return { user: updated };
    });
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null, formError: null, syncError: null });
    try {
      await authApi.loginWithGoogle();
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({ error: normalized.message, formError: normalized });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null, formError: null, syncError: null });

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
        businessName: 'Negocio Demo',
        isOnboardingCompleted: true,
      };
      await storage.set(STORAGE_KEYS.USER_DATA, demoUser);
      await storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      set({
        user: demoUser,
        isAuthenticated: true,
        businessProfileStatus: 'ready',
        isLoading: false,
        formError: null,
        syncError: null,
      });
      return;
    }

    try {
      // 1. Autenticar con Supabase Auth
      const data = await authApi.login(credentials);
      const rawUser = data?.user || data?.session?.user;
      if (!rawUser) {
        throw new Error('No se pudo verificar la sesión del usuario.');
      }

      // Si es un cliente consumidor, no requiere exchange de negocio
      const isClient = rawUser.user_metadata?.role === 'CLIENTE';
      if (isClient) {
        const clientUser = buildAuthUser(rawUser);
        if (data.session) {
          try {
            await authApi.syncClient(data.session);
          } catch {
            // Continúa si el backend de sincronización no responde
          }
        }
        if (typeof storage.set === 'function') {
          await storage.set(STORAGE_KEYS.USER_DATA, clientUser);
        }
        set({
          user: clientUser,
          isAuthenticated: true,
          appMode: 'CONSUMER',
          businessProfileStatus: 'unknown',
          isLoading: false,
          error: null,
          formError: null,
          syncError: null,
        });
        return;
      }

      // 2. Resolver perfil del negocio (US-022)
      const user = buildAuthUser(rawUser);
      const supabaseToken = data.session?.access_token || '';
      const profile = await resolveBusinessProfile(user, supabaseToken);

      if (profile.isRejectedAuth) {
        set({
          user: null,
          isAuthenticated: false,
          businessProfileStatus: 'unavailable',
          error: profile.error,
          syncError: profile.syncError,
          isLoading: false,
        });
        throw new Error(profile.syncError || profile.error || 'Error de autenticación.');
      }

      if (profile.user && typeof storage.set === 'function') {
        await storage.set(STORAGE_KEYS.USER_DATA, profile.user);
      }
      if (typeof storage.set === 'function') {
        await storage.set(
          STORAGE_KEYS.ONBOARDING_COMPLETE,
          profile.user?.isOnboardingCompleted ? 'true' : 'false'
        );
      }

      set({
        ...profile,
        isAuthenticated: true,
        appMode: 'BUSINESS',
        isLoading: false,
      });
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({
        error: normalized.message,
        formError: normalized,
        syncError: normalized.message,
        isLoading: false,
      });
      throw normalized;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null, formError: null, syncError: null });
    try {
      const res = await authApi.register(data);

      if (res.user) {
        const authUser = buildAuthUser(res.user, {
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
          role: 'DUENO',
          businessId: '',
          isOnboardingCompleted: false,
        });
        await storage.set(STORAGE_KEYS.USER_DATA, authUser);
        await storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');
        set({
          user: authUser,
          isAuthenticated: true,
          appMode: 'BUSINESS',
          businessProfileStatus: 'needs-setup',
          isLoading: false,
          isJustRegistered: false,
          error: null,
          formError: null,
          syncError: null,
        });
      }
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({
        error: normalized.message,
        formError: normalized,
        syncError: normalized.message,
        isLoading: false,
      });
      throw normalized;
    }
  },

  registerClient: async (data) => {
    set({ isLoading: true, error: null, formError: null, syncError: null });
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
        await storage.set(STORAGE_KEYS.USER_DATA, authUser);
        set({
          user: authUser,
          isAuthenticated: true,
          appMode: 'CONSUMER',
          businessProfileStatus: 'unknown',
          isLoading: false,
          isJustRegistered: false,
          error: null,
          formError: null,
          syncError: null,
        });
      }
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({
        error: normalized.message,
        formError: normalized,
        syncError: normalized.message,
        isLoading: false,
      });
      throw normalized;
    }
  },

  completeOnboarding: async (data) => {
    set({ error: null });
    try {
      const { user } = get();
      if (!user) {
        throw new Error('No hay usuario autenticado.');
      }

      const payload: SyncProfileRequest = {
        id: user.id,
        email: user.email,
        firstName:
          data.firstName ||
          user.firstName ||
          user.fullName.split(' ')[0] ||
          'Usuario',
        lastName:
          data.lastName ||
          user.lastName ||
          user.fullName.split(' ').slice(1).join(' '),
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
        user: {
          ...user,
          businessId: syncedBusinessId,
          businessName: data.businessName || user.businessName,
          isOnboardingCompleted: true,
        },
        businessProfileStatus: 'ready',
        isJustRegistered: false,
      });
    } catch (error) {
      set({
        error: authRequestMessage(
          error,
          'No se pudo guardar la configuración del negocio. Inténtalo de nuevo.'
        ),
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
      await storage.remove(STORAGE_KEYS.USER_DATA);
      await storage.remove(STORAGE_KEYS.ONBOARDING_COMPLETE);
      await storage.secureRemove(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error during logout:', error);
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrating: false,
      error: null,
      formError: null,
      syncError: null,
      businessProfileStatus: 'unknown',
    });
  },

  hydrate: async () => {
    set({ isLoading: true, isHydrating: true, error: null, syncError: null });
    try {
      const session = await authApi.getSession();

      if (session?.user) {
        let storedUser: AuthUser | null = null;
        if (typeof storage.get === 'function') {
          try {
            storedUser = await storage.get<AuthUser>(STORAGE_KEYS.USER_DATA);
          } catch {
            storedUser = null;
          }
        }

        const isClient =
          session.user.user_metadata?.role === 'CLIENTE' || storedUser?.role === 'CLIENTE';
        if (isClient) {
          const authUser = buildAuthUser(session.user, storedUser || undefined);
          set({
            user: authUser,
            isAuthenticated: true,
            appMode: 'CONSUMER',
            businessProfileStatus: 'unknown',
            isLoading: false,
            isHydrating: false,
            syncError: null,
          });
          return;
        }

        const user = buildAuthUser(session.user, storedUser || undefined);
        const profile = await resolveBusinessProfile(
          user,
          session.access_token
        );
        if (profile.user && typeof storage.set === 'function') {
          try {
            await storage.set(STORAGE_KEYS.USER_DATA, profile.user);
          } catch {}
        }
        if (typeof storage.set === 'function') {
          try {
            await storage.set(
              STORAGE_KEYS.ONBOARDING_COMPLETE,
              profile.user?.isOnboardingCompleted ? 'true' : 'false'
            );
          } catch {}
        }

        const isAuthRejected = profile.user === null;
        set({
          ...profile,
          isAuthenticated: !isAuthRejected,
          appMode: 'BUSINESS',
          isLoading: false,
          isHydrating: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isHydrating: false,
          businessProfileStatus: 'unknown',
          syncError: null,
        });
      }
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrating: false,
        businessProfileStatus: 'unknown',
        syncError: error?.message || null,
      });
    }
  },

  clearError: () => set({ error: null, formError: null, syncError: null }),
}));

// Escuchar cambios de estado en Supabase Auth
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      syncError: null,
      businessProfileStatus: 'unknown',
    });
    await storage.secureRemove(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
  } else if (event === 'SIGNED_IN' && session?.user) {
    setTimeout(() => {
      const { isAuthenticated, isLoading, isHydrating, hydrate } = useAuthStore.getState();
      if (!isAuthenticated && !isLoading && !isHydrating) void hydrate();
    }, 0);
  }
});
