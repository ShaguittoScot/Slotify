import { AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/model';
import { apiClient } from '@/shared/lib/api';

const mockGetSession = jest.fn();
const mockSignIn = jest.fn();

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signInWithPassword: () => mockSignIn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/shared/lib/storage', () => ({
  storage: {
    secureGet: jest.fn().mockResolvedValue(null),
    secureSet: jest.fn().mockResolvedValue(undefined),
  },
}));

const session = { user: { id: 'user-1', email: 'dueño@example.invalid' }, access_token: 'supabase-token' };
const credentials = { email: session.user.email, password: 'password' };
const initialState = useAuthStore.getState();
const defaultAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  useAuthStore.setState(initialState);
  mockGetSession.mockResolvedValue({ data: { session }, error: null });
  mockSignIn.mockResolvedValue({ data: { session }, error: null });
});

afterEach(() => {
  apiClient.defaults.adapter = defaultAdapter;
});

function respond(status: number, data: object) {
  apiClient.defaults.adapter = async (config) => {
    const response = { status, data, headers: {}, statusText: '', config };
    if (status >= 400) throw new AxiosError('HTTP error', AxiosError.ERR_BAD_REQUEST, config, {}, response);
    return response;
  };
}

test('un error de red mantiene la sesión y al reintentar recupera el negocio existente', async () => {
  apiClient.defaults.adapter = async () => { throw new AxiosError('Network Error', AxiosError.ERR_NETWORK); };
  await useAuthStore.getState().login(credentials);
  expect(useAuthStore.getState()).toMatchObject({
    isAuthenticated: true,
    businessProfileStatus: 'unavailable',
    error: expect.stringContaining('No se pudo conectar'),
  });

  respond(200, { success: true, data: {
    accessToken: 'slotify-token', user: { id: session.user.id, businessId: 'business-1' },
  } });
  await useAuthStore.getState().hydrate();
  expect(useAuthStore.getState()).toMatchObject({
    businessProfileStatus: 'ready', error: null, user: { businessId: 'business-1' },
  });
});

test.each([401, 403, 404, 503])('un HTTP %s sin confirmación de perfil ausente evita el asistente', async (status) => {
  respond(status, { success: false, error: 'No disponible' });
  await useAuthStore.getState().hydrate();
  expect(useAuthStore.getState().businessProfileStatus).toBe('unavailable');
});

test('una cuenta sin negocio puede reintentar el guardado sin activar la carga global', async () => {
  respond(404, { success: false, code: 'business_profile_missing' });
  await useAuthStore.getState().hydrate();
  expect(useAuthStore.getState().businessProfileStatus).toBe('needs-setup');

  const setup = { businessName: 'Barbería', sectorTemplateId: 2 };
  apiClient.defaults.adapter = async () => { throw new AxiosError('Network Error', AxiosError.ERR_NETWORK); };
  await expect(useAuthStore.getState().completeOnboarding(setup)).rejects.toThrow('Network Error');
  expect(useAuthStore.getState()).toMatchObject({
    isLoading: false, businessProfileStatus: 'needs-setup', error: expect.stringContaining('No se pudo conectar'),
  });

  respond(200, { success: true, data: {
    id: session.user.id, businessId: 'business-2', accessToken: 'slotify-token',
  } });
  await useAuthStore.getState().completeOnboarding(setup);
  expect(useAuthStore.getState()).toMatchObject({
    isLoading: false, businessProfileStatus: 'ready', error: null, user: { businessId: 'business-2' },
  });
});
