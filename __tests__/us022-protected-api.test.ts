import { AxiosError, AxiosHeaders } from 'axios';

const mockReplace = jest.fn();
const mockLogout = jest.fn().mockResolvedValue(undefined);
const mockSecureGet = jest.fn();
const mockSecureRemove = jest.fn().mockResolvedValue(undefined);
const mockGetSession = jest.fn();

jest.mock('@/shared/lib/supabase', () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('@/shared/lib/storage', () => ({
  storage: {
    secureGet: (...args: unknown[]) => mockSecureGet(...args),
    secureRemove: (...args: unknown[]) => mockSecureRemove(...args),
    secureSet: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/features/auth/model', () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: 'user-owner-1',
        email: 'barbero@negocioa.com',
        fullName: 'Barbero Negocio A',
        role: 'DUENO',
        businessId: '11111111-1111-1111-1111-111111111111',
      },
      isAuthenticated: true,
      logout: mockLogout,
    }),
  },
}));

import { apiClient } from '@/shared/lib/api';
import { fetchCalendarSlots } from '@/features/calendar/api';

describe('US-022 | Frontend API Client & Calendar Auth Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  test('adjunta el header Authorization Bearer con el accessToken de JwtService y no envía businessId en query', async () => {
    // ARRANGE
    mockSecureGet.mockResolvedValue('jwt-service-token-negocio-a');
    let capturedAuthHeader: unknown;
    let capturedParams: Record<string, unknown> | undefined;

    apiClient.defaults.adapter = async (config) => {
      capturedAuthHeader = config.headers?.Authorization;
      capturedParams = config.params;
      return {
        data: {
          rangeStart: '2026-10-01T00:00:00.000Z',
          rangeEnd: '2026-10-31T23:59:59.000Z',
          slots: [],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    // ACT
    await fetchCalendarSlots('2026-10-01T00:00:00.000Z', '2026-10-31T23:59:59.000Z');

    // ASSERT
    expect(capturedAuthHeader).toBe('Bearer jwt-service-token-negocio-a');
    expect(capturedParams).toEqual({
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T23:59:59.000Z',
    });
    expect(capturedParams).not.toHaveProperty('businessId');
  });

  test('ante un 401 por sesión expirada limpia tokens, ejecuta logout() y redirige a /(auth)', async () => {
    // ARRANGE
    mockSecureGet.mockResolvedValue('expired-jwt-token');

    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError(
        'Request failed with status code 401',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: { error: 'Unauthorized' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );
    };

    // ACT
    await expect(apiClient.get('/calendar/slots')).rejects.toThrow();

    // ASSERT
    expect(mockSecureRemove).toHaveBeenCalledWith('accessToken');
    expect(mockSecureRemove).toHaveBeenCalledWith('refreshToken');
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)');
  });

  test('renueva el JWT de Slotify con el bearer de Supabase y reintenta la operación', async () => {
    mockSecureGet.mockResolvedValue('jwt-slotify-expirado');
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-owner-1' }, access_token: 'jwt-supabase' } },
      error: null,
    });
    const sent: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      const auth = String(config.headers.get('Authorization'));
      sent.push(auth);
      if (config.url === '/auth/login') {
        expect(config.data).not.toBeDefined();
        return {
          data: { data: { accessToken: 'jwt-slotify-nuevo', user: { id: 'user-owner-1' } } },
          status: 200, statusText: 'OK', headers: {}, config,
        };
      }
      if (auth === 'Bearer jwt-slotify-nuevo') {
        return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
      }
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, {
        data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config,
      });
    };

    await expect(apiClient.patch('/calendar/appointments/appointment-id', { status: 'completed' }))
      .resolves.toMatchObject({ status: 200 });
    expect(sent).toEqual(['Bearer jwt-slotify-expirado', 'Bearer jwt-supabase', 'Bearer jwt-slotify-nuevo']);
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

