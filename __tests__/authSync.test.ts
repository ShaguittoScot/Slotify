jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/features/auth/api', () => ({
  authApi: {
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    exchangeToken: jest.fn(),
    register: jest.fn(),
    registerClient: jest.fn(),
    logout: jest.fn(),
    getSession: jest.fn(),
  },
}));

import { useAuthStore } from '../src/features/auth/model';
import { authApi } from '../src/features/auth/api';
import { storage } from '../src/shared/lib/storage';
import { STORAGE_KEYS } from '../src/shared/lib/constants';
import { apiClient } from '../src/shared/lib/api';

describe('Sincronización de Autenticación y Onboarding — Slotify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrating: false,
      error: null,
      formError: null,
      syncError: null,
      appMode: 'BUSINESS',
      isJustRegistered: false,
    });
  });

  // ─── 1. Login de propietario con onboarding completado ───
  it('1. Login de propietario con onboarding completado guarda JWT interno y marca isOnboardingCompleted', async () => {
    const mockSupabaseUser = {
      id: 'user-owner-1',
      email: 'owner@slotify.com',
      user_metadata: {
        first_name: 'Carlos',
        last_name: 'Dueño',
        role: 'DUENO',
      },
    };

    (authApi.login as jest.Mock).mockResolvedValue({
      user: mockSupabaseUser,
      session: { access_token: 'supabase-token-123' },
    });

    (authApi.exchangeToken as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        accessToken: 'slotify-internal-jwt-abc',
        refreshToken: 'slotify-refresh-token-xyz',
        expiresAt: '2026-11-18T15:00:00Z',
        user: {
          id: 'user-owner-1',
          firstName: 'Carlos',
          lastName: 'Dueño',
          fullName: 'Carlos Dueño',
          email: 'owner@slotify.com',
          role: 'Owner',
          businessId: 'biz-456',
          isOnboardingCompleted: true,
        },
      },
    });

    const secureSetSpy = jest.spyOn(storage, 'secureSet');
    const storageSetSpy = jest.spyOn(storage, 'set');

    await useAuthStore.getState().login({
      email: 'owner@slotify.com',
      password: 'Password123!',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.businessId).toBe('biz-456');
    expect(state.user?.isOnboardingCompleted).toBe(true);
    expect(state.syncError).toBeNull();

    // Debe guardar exclusivamente el JWT interno de Slotify, NUNCA el de Supabase
    expect(secureSetSpy).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      'slotify-internal-jwt-abc'
    );
    expect(secureSetSpy).not.toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      'supabase-token-123'
    );

    // Debe persistir ONBOARDING_COMPLETE como 'true'
    expect(storageSetSpy).toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  });

  // ─── 2. Login de propietario pendiente ───
  it('2. Login de propietario pendiente permite avanzar al wizard sin error de red', async () => {
    const mockSupabaseUser = {
      id: 'user-new-owner',
      email: 'nuevo@slotify.com',
      user_metadata: {
        first_name: 'Pedro',
        last_name: 'Nuevo',
        role: 'DUENO',
      },
    };

    (authApi.login as jest.Mock).mockResolvedValue({
      user: mockSupabaseUser,
      session: { access_token: 'supabase-token-new' },
    });

    const notSyncedError = {
      response: {
        status: 400,
        data: {
          success: false,
          message: 'El usuario aún no cuenta con un negocio sincronizado.',
        },
      },
    };
    (authApi.exchangeToken as jest.Mock).mockRejectedValue(notSyncedError);

    const storageSetSpy = jest.spyOn(storage, 'set');

    await useAuthStore.getState().login({
      email: 'nuevo@slotify.com',
      password: 'Password123!',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.businessId).toBe('');
    expect(state.user?.isOnboardingCompleted).toBe(false);
    expect(state.syncError).toBeNull();

    expect(storageSetSpy).toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_COMPLETE, 'false');
  });

  // ─── 3. Hidratación de propietario completado ───
  it('3. Hidratación recupera sesión de Supabase y refresca estado real desde backend', async () => {
    const mockSession = {
      user: {
        id: 'user-owner-1',
        email: 'owner@slotify.com',
        user_metadata: { role: 'DUENO' },
      },
      access_token: 'supabase-token-hydrated',
    };

    (authApi.getSession as jest.Mock).mockResolvedValue(mockSession);

    (authApi.exchangeToken as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        accessToken: 'slotify-jwt-hydrated',
        refreshToken: 'slotify-refresh-hydrated',
        expiresAt: '2026-11-18T16:00:00Z',
        user: {
          id: 'user-owner-1',
          firstName: 'Carlos',
          lastName: 'Dueño',
          fullName: 'Carlos Dueño',
          email: 'owner@slotify.com',
          role: 'Owner',
          businessId: 'biz-456',
          isOnboardingCompleted: true,
        },
      },
    });

    const secureSetSpy = jest.spyOn(storage, 'secureSet');
    const storageSetSpy = jest.spyOn(storage, 'set');

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.isOnboardingCompleted).toBe(true);
    expect(state.user?.businessId).toBe('biz-456');

    expect(secureSetSpy).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, 'slotify-jwt-hydrated');
    expect(storageSetSpy).toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  });

  // ─── 4. Hidratación de propietario pendiente ───
  it('4. Hidratación con usuario no sincronizado en backend mantiene estado pendiente sin error', async () => {
    const mockSession = {
      user: {
        id: 'user-pending',
        email: 'pending@slotify.com',
        user_metadata: { role: 'DUENO' },
      },
      access_token: 'supabase-token-pending',
    };

    (authApi.getSession as jest.Mock).mockResolvedValue(mockSession);

    (authApi.exchangeToken as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'El usuario aún no cuenta con un negocio sincronizado.' },
      },
    });

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.isOnboardingCompleted).toBe(false);
    expect(state.syncError).toBeNull();
  });

  // ─── 5. Error de red durante intercambio ───
  it('5. Error de red durante intercambio no se confunde con usuario pendiente de onboarding', async () => {
    (authApi.login as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'carlos@slotify.com', user_metadata: { role: 'DUENO' } },
      session: { access_token: 'supabase-token' },
    });

    const networkError = new Error('Network Error');
    (authApi.exchangeToken as jest.Mock).mockRejectedValue(networkError);

    await expect(
      useAuthStore.getState().login({ email: 'carlos@slotify.com', password: '123' })
    ).rejects.toBeDefined();

    const state = useAuthStore.getState();
    expect(state.syncError).toBeDefined();
    expect(state.syncError).not.toBeNull();
    // No debe haber entrado en estado autenticado ni marcado onboarding completado
    expect(state.isAuthenticated).toBe(false);
  });

  // ─── 6. Logout y nuevo login ───
  it('6. Logout elimina tokens internos y limpia el estado', async () => {
    const secureRemoveSpy = jest.spyOn(storage, 'secureRemove');
    const storageRemoveSpy = jest.spyOn(storage, 'remove');

    await useAuthStore.getState().logout();

    expect(authApi.logout).toHaveBeenCalled();
    expect(storageRemoveSpy).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA);
    expect(storageRemoveSpy).toHaveBeenCalledWith(STORAGE_KEYS.ONBOARDING_COMPLETE);
    expect(secureRemoveSpy).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    expect(secureRemoveSpy).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  // ─── 7. Token interno utilizado por Axios ───
  it('7. Interceptor de apiClient utiliza exclusivamente el JWT interno de Slotify', async () => {
    const secureGetSpy = jest.spyOn(storage, 'secureGet');
    secureGetSpy.mockResolvedValue('internal-slotify-token-999');

    // Simular llamada al interceptor de apiClient
    const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = await requestHandler({ headers: {} });

    expect(secureGetSpy).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    expect(config.headers.Authorization).toBe('Bearer internal-slotify-token-999');
  });

  // ─── 8. Registro nuevo de propietario ───
  it('8. Registro nuevo de propietario inicia con isOnboardingCompleted en false', async () => {
    (authApi.register as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-reg-1',
        email: 'nuevo@slotify.com',
        user_metadata: {
          first_name: 'Ana',
          last_name: 'López',
          role: 'DUENO',
        },
      },
      session: { access_token: 'supabase-token-reg' },
    });

    const secureSetSpy = jest.spyOn(storage, 'secureSet');

    await useAuthStore.getState().register({
      firstName: 'Ana',
      lastName: 'López',
      email: 'nuevo@slotify.com',
      password: 'Password123!',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.isOnboardingCompleted).toBe(false);
    expect(state.user?.businessId).toBe('');
    // NO debe guardar el token de Supabase en ACCESS_TOKEN
    expect(secureSetSpy).not.toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      'supabase-token-reg'
    );
  });

  // ─── 9. Registro de cliente sin negocio ───
  it('9. Registro de cliente asigna appMode CONSUMER y rol CLIENTE', async () => {
    (authApi.registerClient as jest.Mock).mockResolvedValue({
      user: {
        id: 'client-1',
        email: 'cliente@gmail.com',
        user_metadata: {
          first_name: 'María',
          last_name: 'Gómez',
          role: 'CLIENTE',
        },
      },
      session: { access_token: 'supabase-client-token' },
    });

    await useAuthStore.getState().registerClient({
      firstName: 'María',
      lastName: 'Gómez',
      email: 'cliente@gmail.com',
      password: 'Password123!',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.appMode).toBe('CONSUMER');
    expect(state.user?.role).toBe('CLIENTE');
  });

  // ─── 10. Discrepancia de UUID entre Supabase y PostgreSQL no provoca vinculación automática ───
  it('10. Discrepancia de UUID entre Supabase y PostgreSQL reporta error y no envía a onboarding', async () => {
    (authApi.login as jest.Mock).mockResolvedValue({
      user: {
        id: 'supabase-diff-uuid',
        email: 'discrepancia@slotify.com',
        user_metadata: { role: 'DUENO' },
      },
      session: { access_token: 'supabase-token' },
    });

    const discrepancyError = {
      response: {
        status: 409,
        data: {
          error:
            'Discrepancia de identidad: el ID del proveedor de autenticación no coincide con el registrado en el sistema para este correo.',
        },
      },
    };
    (authApi.exchangeToken as jest.Mock).mockRejectedValue(discrepancyError);

    await expect(
      useAuthStore.getState().login({
        email: 'discrepancia@slotify.com',
        password: 'Password123!',
      })
    ).rejects.toBeDefined();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.syncError).toContain('Discrepancia de identidad');
    // NO debe haber marcado onboarding pendiente (no debe dar paso al wizard)
    expect(state.user).toBeNull();
  });

  // ─── 11. Error 401/403 en exchangeToken no provoca falsa redirección a wizard en hydrate ───
  it('11. Error 401 o 403 en exchangeToken durante hydrate reporta error sin marcar onboarding pendiente', async () => {
    const mockSession = {
      user: {
        id: 'user-forbidden',
        email: 'forbidden@slotify.com',
        user_metadata: { role: 'DUENO' },
      },
      access_token: 'supabase-token-forbidden',
    };

    (authApi.getSession as jest.Mock).mockResolvedValue(mockSession);

    const forbiddenError = {
      response: {
        status: 403,
        data: {
          error: 'El correo electrónico no coincide con el usuario autenticado.',
        },
      },
    };
    (authApi.exchangeToken as jest.Mock).mockRejectedValue(forbiddenError);

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.syncError).toContain('El correo electrónico no coincide');
    // NO debe crear usuario pendiente
    expect(state.user).toBeNull();
  });
});
