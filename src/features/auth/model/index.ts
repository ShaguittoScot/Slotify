import { supabase } from '@/shared/lib/supabase';
import { storage } from '@/shared/lib/storage';
import { STORAGE_KEYS } from '@/shared/lib/constants';
import { normalizeError, type NormalizedError } from '@/shared/lib/errorUtils';
import type { AuthUser } from '@/shared/types';
import { create } from 'zustand';
import { authApi } from '../api';
import type { LoginCredentials, RegisterAdminRequest, RegisterClientRequest } from '../types';

export type AppMode = 'BUSINESS' | 'CONSUMER';

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
  const isOnboardingCompleted = fallback?.isOnboardingCompleted ?? false;

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
      storage.set(STORAGE_KEYS.USER_DATA, updated).catch(() => {});
      return { user: updated };
    });
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null, formError: null, syncError: null });
    try {
      await authApi.loginWithGoogle();
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({ error: normalized.message, formError: normalized, isLoading: false });
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
      set({ user: demoUser, isAuthenticated: true, isLoading: false, formError: null, syncError: null });
      return;
    }

    try {
      // 1. Autenticar con Supabase Auth
      const data = await authApi.login(credentials);
      if (!data.user) {
        throw new Error('No se pudo verificar la sesión del usuario.');
      }

      // Si es un cliente consumidor, no requiere exchange de negocio
      const isClient = data.user.user_metadata?.role === 'CLIENTE';
      if (isClient) {
        const clientUser = buildAuthUser(data.user);
        await storage.set(STORAGE_KEYS.USER_DATA, clientUser);
        set({
          user: clientUser,
          isAuthenticated: true,
          appMode: 'CONSUMER',
          isLoading: false,
          error: null,
          formError: null,
          syncError: null,
        });
        return;
      }

      // 2. Intercambio de token con backend Slotify
      try {
        const exchangeRes = await authApi.exchangeToken({
          userId: data.user.id,
          email: data.user.email!,
        });

        if (exchangeRes.success && exchangeRes.data) {
          // Guardar exclusivamente el JWT interno de Slotify y el refresh token
          if (exchangeRes.data.accessToken) {
            await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, exchangeRes.data.accessToken);
          }
          if (exchangeRes.data.refreshToken) {
            await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, exchangeRes.data.refreshToken);
          }

          const bUser = exchangeRes.data.user;
          const authUser: AuthUser = {
            id: bUser.id,
            firstName: bUser.firstName,
            lastName: bUser.lastName,
            fullName: bUser.fullName,
            email: bUser.email,
            role: (bUser.role as string) === 'Owner' || bUser.role === 'DUENO' ? 'DUENO' : 'EMPLEADO',
            businessId: bUser.businessId,
            businessName: '',
            isOnboardingCompleted: Boolean(bUser.isOnboardingCompleted),
          };

          await storage.set(STORAGE_KEYS.USER_DATA, authUser);
          await storage.set(
            STORAGE_KEYS.ONBOARDING_COMPLETE,
            authUser.isOnboardingCompleted ? 'true' : 'false'
          );

          set({
            user: authUser,
            isAuthenticated: true,
            appMode: 'BUSINESS',
            isLoading: false,
            error: null,
            formError: null,
            syncError: null,
          });
          return;
        } else {
          throw new Error(exchangeRes.message || 'Error al validar la sesión con Slotify.');
        }
      } catch (exchangeErr: any) {
        const errData = exchangeErr.response?.data;
        const status = exchangeErr.response?.status;
        const rawMsg = (
          errData?.error ||
          errData?.errors?.[0] ||
          errData?.message ||
          exchangeErr.message ||
          ''
        ).trim();
        const msg = rawMsg.toLowerCase();

        // 401, 403, 409 (discrepancia) o >=500 NUNCA deben interpretarse como pendiente de sincronización
        const isNotSynced =
          status !== 401 &&
          status !== 403 &&
          status !== 409 &&
          (!status || status < 500) &&
          (msg.includes('aún no cuenta con un negocio sincronizado') ||
            msg.includes('no cuenta con un negocio sincronizado'));

        if (isNotSynced) {
          // El usuario está autenticado en Supabase pero aún no tiene negocio en backend.
          // Conservar estado de usuario autenticado con onboarding pendiente para permitir el wizard.
          const pendingUser = buildAuthUser(data.user, {
            businessId: '',
            isOnboardingCompleted: false,
          });
          await storage.set(STORAGE_KEYS.USER_DATA, pendingUser);
          await storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');

          set({
            user: pendingUser,
            isAuthenticated: true,
            appMode: 'BUSINESS',
            isLoading: false,
            error: null,
            formError: null,
            syncError: null,
          });
          return;
        }

        // Si fue un error de red o servidor real, mostrar el error sin confundir con onboarding pendiente
        const normalized = normalizeError(exchangeErr, { isAuthForm: true });
        set({
          error: normalized.message,
          formError: normalized,
          syncError: normalized.message,
          isLoading: false,
        });
        throw normalized;
      }
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({ error: normalized.message, formError: normalized, isLoading: false });
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
          isLoading: false,
          isJustRegistered: false,
          error: null,
          formError: null,
          syncError: null,
        });
      }
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({ error: normalized.message, formError: normalized, isLoading: false });
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
          isLoading: false,
          isJustRegistered: false,
          error: null,
          formError: null,
          syncError: null,
        });
      }
    } catch (error: any) {
      const normalized = normalizeError(error, { isAuthForm: true });
      set({ error: normalized.message, formError: normalized, isLoading: false });
      throw normalized;
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
    set({ user: null, isAuthenticated: false, isLoading: false, error: null, formError: null, syncError: null });
  },

  hydrate: async () => {
    try {
      const session = await authApi.getSession();

      if (session?.user) {
        const storedUser = await storage.get<AuthUser>(STORAGE_KEYS.USER_DATA);

        // Si es CLIENTE, no intercambia token con backend de negocio
        const isClient =
          session.user.user_metadata?.role === 'CLIENTE' || storedUser?.role === 'CLIENTE';
        if (isClient) {
          const authUser = buildAuthUser(session.user, storedUser || undefined);
          set({
            user: authUser,
            isAuthenticated: true,
            appMode: 'CONSUMER',
            isLoading: false,
            isHydrating: false,
            syncError: null,
          });
          return;
        }

        // Para dueños / negocio: ejecutar intercambio con backend para refrescar token y estado real
        try {
          const exchangeRes = await authApi.exchangeToken({
            userId: session.user.id,
            email: session.user.email!,
          });

          if (exchangeRes.success && exchangeRes.data) {
            if (exchangeRes.data.accessToken) {
              await storage.secureSet(STORAGE_KEYS.ACCESS_TOKEN, exchangeRes.data.accessToken);
            }
            if (exchangeRes.data.refreshToken) {
              await storage.secureSet(STORAGE_KEYS.REFRESH_TOKEN, exchangeRes.data.refreshToken);
            }

            const bUser = exchangeRes.data.user;
            const authUser: AuthUser = {
              id: bUser.id,
              firstName: bUser.firstName,
              lastName: bUser.lastName,
              fullName: bUser.fullName,
              email: bUser.email,
              role: (bUser.role as string) === 'Owner' || bUser.role === 'DUENO' ? 'DUENO' : 'EMPLEADO',
              businessId: bUser.businessId,
              businessName: storedUser?.businessName || '',
              isOnboardingCompleted: Boolean(bUser.isOnboardingCompleted),
            };

            await storage.set(STORAGE_KEYS.USER_DATA, authUser);
            await storage.set(
              STORAGE_KEYS.ONBOARDING_COMPLETE,
              authUser.isOnboardingCompleted ? 'true' : 'false'
            );

            set({
              user: authUser,
              isAuthenticated: true,
              appMode: 'BUSINESS',
              isLoading: false,
              isHydrating: false,
              syncError: null,
            });
            return;
          }
        } catch (exchangeErr: any) {
          const errData = exchangeErr.response?.data;
          const status = exchangeErr.response?.status;
          const rawMsg = (
            errData?.error ||
            errData?.errors?.[0] ||
            errData?.message ||
            exchangeErr.message ||
            ''
          ).trim();
          const msg = rawMsg.toLowerCase();

          // 401, 403, 409 o >=500 NUNCA deben interpretarse como pendiente de sincronización
          const isNotSynced =
            status !== 401 &&
            status !== 403 &&
            status !== 409 &&
            (!status || status < 500) &&
            (msg.includes('aún no cuenta con un negocio sincronizado') ||
              msg.includes('no cuenta con un negocio sincronizado'));

          if (isNotSynced) {
            const pendingUser = buildAuthUser(session.user, {
              ...storedUser,
              businessId: '',
              isOnboardingCompleted: false,
            });
            await storage.set(STORAGE_KEYS.USER_DATA, pendingUser);
            await storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');

            set({
              user: pendingUser,
              isAuthenticated: true,
              appMode: 'BUSINESS',
              isLoading: false,
              isHydrating: false,
              syncError: null,
            });
            return;
          }

          // Si es un error explícito de autenticación o discrepancia (401, 403, 409),
          // NO se mantiene la sesión offline porque las credenciales/identidad fueron rechazadas por el servidor.
          const isRejectedAuth = status === 401 || status === 403 || status === 409;

          console.warn('[Auth hydrate] Fallo al intercambiar token:', msg);
          if (storedUser && !isRejectedAuth) {
            set({
              user: storedUser,
              isAuthenticated: true,
              appMode: storedUser.role === 'CLIENTE' ? 'CONSUMER' : 'BUSINESS',
              isLoading: false,
              isHydrating: false,
              syncError: 'Error de sincronización con el servidor. Modo sin conexión.',
            });
            return;
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isHydrating: false,
            syncError: rawMsg || 'No se pudo sincronizar la sesión.',
          });
          return;
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, isHydrating: false, syncError: null });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false, isHydrating: false, syncError: null });
    }
  },

  clearError: () => set({ error: null, formError: null, syncError: null }),
}));

// Escuchar cambios de estado en Supabase Auth
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, isAuthenticated: false, syncError: null });
    await storage.secureRemove(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
  }
  // NOTA: En evento SIGNED_IN no se sobreescribe el token interno de Slotify
  // con el token de Supabase. El intercambio de token en login/hydrate se encarga
  // de almacenar exclusivamente el JWT interno.
});
