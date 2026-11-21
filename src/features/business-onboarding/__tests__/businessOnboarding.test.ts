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

jest.mock('../api/businessOnboardingApi', () => ({
  businessOnboardingApi: {
    syncInitialBusiness: jest.fn(),
    completeBusinessOnboarding: jest.fn(),
  },
}));

jest.mock('@/features/auth/api', () => ({
  authApi: {
    exchangeToken: jest.fn(),
  },
}));

import {
  parseTimeTo24Hours,
  formatTimeToHHmm,
  getOnboardingErrorMessage,
  useBusinessOnboardingStore,
} from '../model/businessOnboardingStore';
import { businessOnboardingApi } from '../api/businessOnboardingApi';
import { authApi } from '@/features/auth/api';
import { storage } from '@/shared/lib/storage';
import { STORAGE_KEYS } from '@/shared/lib/constants';
import type { AuthUser } from '@/shared/types';

describe('Business Onboarding Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBusinessOnboardingStore.getState().reset();
  });

  describe('parseTimeTo24Hours', () => {
    it('converts 12-hour AM format correctly', () => {
      expect(parseTimeTo24Hours('09:30 AM')).toBe('09:30:00');
      expect(parseTimeTo24Hours('12:00 AM')).toBe('00:00:00');
    });

    it('converts 12-hour PM format correctly', () => {
      expect(parseTimeTo24Hours('06:00 PM')).toBe('18:00:00');
      expect(parseTimeTo24Hours('12:30 PM')).toBe('12:30:00');
      expect(parseTimeTo24Hours('01:15 PM')).toBe('13:15:00');
    });

    it('handles already-formatted 24h strings', () => {
      expect(parseTimeTo24Hours('14:30:00')).toBe('14:30:00');
      expect(parseTimeTo24Hours('14:30')).toBe('14:30:00');
    });

    it('returns fallback for empty or invalid format', () => {
      expect(parseTimeTo24Hours('', '09:00:00')).toBe('09:00:00');
      expect(parseTimeTo24Hours('invalid', '10:00:00')).toBe('10:00:00');
    });
  });

  describe('formatTimeToHHmm', () => {
    it('converts 12-hour AM format to HH:mm', () => {
      expect(formatTimeToHHmm('09:30 AM')).toBe('09:30');
      expect(formatTimeToHHmm('12:00 AM')).toBe('00:00');
    });

    it('converts 12-hour PM format to HH:mm', () => {
      expect(formatTimeToHHmm('06:00 PM')).toBe('18:00');
      expect(formatTimeToHHmm('12:30 PM')).toBe('12:30');
      expect(formatTimeToHHmm('01:15 PM')).toBe('13:15');
    });

    it('handles HH:mm:ss strings by trimming to HH:mm', () => {
      expect(formatTimeToHHmm('14:30:00')).toBe('14:30');
      expect(formatTimeToHHmm('09:00:00')).toBe('09:00');
    });

    it('handles already-formatted HH:mm strings', () => {
      expect(formatTimeToHHmm('09:00')).toBe('09:00');
      expect(formatTimeToHHmm('18:00')).toBe('18:00');
    });

    it('returns fallback for empty or invalid format', () => {
      expect(formatTimeToHHmm('', '09:00')).toBe('09:00');
      expect(formatTimeToHHmm('invalid', '09:00')).toBe('09:00');
    });
  });

  describe('getOnboardingErrorMessage', () => {
    it('maps HTTP 400 validation errors array correctly', () => {
      const err = {
        response: {
          status: 400,
          data: { errors: ['Debe configurar al menos un horario', 'El precio excede el máximo permitido'] },
        },
      };
      expect(getOnboardingErrorMessage(err)).toBe(
        'Debe configurar al menos un horario. El precio excede el máximo permitido'
      );
    });

    it('maps HTTP 401 unauthorized error', () => {
      const err = { response: { status: 401, data: {} } };
      expect(getOnboardingErrorMessage(err)).toContain('Sesión no autenticada');
    });

    it('maps HTTP 403 forbidden error', () => {
      const err = { response: { status: 403, data: {} } };
      expect(getOnboardingErrorMessage(err)).toContain('Acceso no autorizado');
    });

    it('maps HTTP 404 not found error', () => {
      const err = { response: { status: 404, data: {} } };
      expect(getOnboardingErrorMessage(err)).toContain('No se encontró el registro');
    });

    it('maps HTTP 409 conflict error (slug conflict)', () => {
      const err = {
        response: {
          status: 409,
          data: { message: 'El nombre del negocio genera un slug que ya está en uso.' },
        },
      };
      expect(getOnboardingErrorMessage(err)).toBe('El nombre del negocio genera un slug que ya está en uso.');
    });

    it('maps HTTP 500 server error', () => {
      const err = { response: { status: 500, data: {} } };
      expect(getOnboardingErrorMessage(err)).toContain('Ocurrió un inconveniente temporal en el servidor');
    });

    it('handles network error without response', () => {
      const err = { message: 'Network Error' };
      expect(getOnboardingErrorMessage(err)).toContain('No se pudo conectar con el servidor');
    });
  });

  describe('useBusinessOnboardingStore', () => {
    it('initializes with default values', () => {
      const state = useBusinessOnboardingStore.getState();
      expect(state.step).toBe(1);
      expect(state.businessName).toBe('');
      expect(state.selectedDays).toEqual(['L', 'M', 'X', 'J', 'V']);
      expect(state.isCompleted).toBe(false);
    });

    it('updates business name and auto-generates slug', () => {
      useBusinessOnboardingStore.getState().setBusinessName('Barbería La Imperial');
      const state = useBusinessOnboardingStore.getState();
      expect(state.businessName).toBe('Barbería La Imperial');
      expect(state.slug).toBe('barberia-la-imperial');
    });

    it('toggles working days', () => {
      useBusinessOnboardingStore.getState().toggleDay('L'); // removes 'L'
      expect(useBusinessOnboardingStore.getState().selectedDays).not.toContain('L');

      useBusinessOnboardingStore.getState().toggleDay('L'); // re-adds 'L'
      expect(useBusinessOnboardingStore.getState().selectedDays).toContain('L');
    });

    it('completes the full onboarding sequence successfully adhering to the secure contract', async () => {
      const mockUser: AuthUser = {
        id: '11111111-2222-3333-4444-555555555555',
        firstName: 'Juan',
        lastName: 'Pérez',
        fullName: 'Juan Pérez',
        email: 'juan@barberia.com',
        role: 'DUENO',
      };

      const updateGlobalUser = jest.fn();

      (businessOnboardingApi.syncInitialBusiness as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          businessId: 'biz-999',
        },
      });

      (businessOnboardingApi.completeBusinessOnboarding as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: '11111111-2222-3333-4444-555555555555',
          firstName: 'Juan',
          lastName: 'Pérez',
          fullName: 'Juan Pérez',
          email: 'juan@barberia.com',
          role: 'Owner',
          businessId: 'biz-999',
        },
      });

      useBusinessOnboardingStore.getState().setCategory('Belleza y Cuidado Personal', 2);
      useBusinessOnboardingStore.getState().setBusinessName('Barbería Imperial');
      useBusinessOnboardingStore.getState().setBusinessPhone('+525511223344');
      useBusinessOnboardingStore.getState().setServiceName('Corte Clásico');
      useBusinessOnboardingStore.getState().setServiceDuration('40');
      useBusinessOnboardingStore.getState().setServicePrice('200');

      await useBusinessOnboardingStore.getState().submitOnboarding(mockUser, updateGlobalUser);

      // Verificaciones
      expect(businessOnboardingApi.syncInitialBusiness).toHaveBeenCalledTimes(1);
      expect(businessOnboardingApi.completeBusinessOnboarding).toHaveBeenCalledTimes(1);

      const completePayload = (businessOnboardingApi.completeBusinessOnboarding as jest.Mock).mock.calls[0][0];

      // CRÍTICO: id y email NUNCA deben enviarse en el payload del endpoint seguro
      expect((completePayload as any).id).toBeUndefined();
      expect((completePayload as any).email).toBeUndefined();

      // Campos funcionales requeridos
      expect(completePayload.firstName).toBe('Juan');
      expect(completePayload.lastName).toBe('Pérez');
      expect(completePayload.fullName).toBe('Juan Pérez');
      expect(completePayload.business.name).toBe('Barbería Imperial');
      expect(completePayload.business.phone).toBe('+525511223344');
      expect(completePayload.business.sectorTemplateId).toBe(2);
      expect(completePayload.business.timeZone).toBeDefined();

      // Formato exacto de horarios HH:mm
      expect(completePayload.businessHours).toHaveLength(5);
      expect(completePayload.businessHours[0].startTime).toBe('09:00');
      expect(completePayload.businessHours[0].endTime).toBe('18:00');

      // Servicios con tipos correctos
      expect(completePayload.services[0].name).toBe('Corte Clásico');
      expect(completePayload.services[0].durationMinutes).toBe(40);
      expect(completePayload.services[0].price).toBe(200);

      expect(updateGlobalUser).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        businessId: 'biz-999',
        businessName: 'Barbería Imperial',
        firstName: 'Juan',
        lastName: 'Pérez',
        fullName: 'Juan Pérez',
        isOnboardingCompleted: true,
      });

      const finalState = useBusinessOnboardingStore.getState();
      expect(finalState.isCompleted).toBe(true);
      expect(finalState.step).toBe(5);
      expect(finalState.error).toBeNull();
    });

    it('avoids re-calling syncInitialBusiness if businessId already exists', async () => {
      const mockUserWithBiz: AuthUser = {
        id: '11111111-2222-3333-4444-555555555555',
        fullName: 'Juan Pérez',
        email: 'juan@barberia.com',
        role: 'DUENO',
        businessId: 'already-existing-biz-id',
      };

      const updateGlobalUser = jest.fn();

      (businessOnboardingApi.completeBusinessOnboarding as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          businessId: 'already-existing-biz-id',
        },
      });

      useBusinessOnboardingStore.getState().setBusinessName('Barbería Imperial');
      useBusinessOnboardingStore.getState().setServiceName('Corte');

      await useBusinessOnboardingStore.getState().submitOnboarding(mockUserWithBiz, updateGlobalUser);

      // syncInitialBusiness NO debe llamarse porque el negocio ya existía (idempotencia)
      expect(businessOnboardingApi.syncInitialBusiness).not.toHaveBeenCalled();
      expect(businessOnboardingApi.completeBusinessOnboarding).toHaveBeenCalledTimes(1);

      const completePayload = (businessOnboardingApi.completeBusinessOnboarding as jest.Mock).mock.calls[0][0];
      expect((completePayload as any).id).toBeUndefined();
      expect((completePayload as any).email).toBeUndefined();
    });

    it('validates opening and closing hours before sending to backend', async () => {
      const mockUser: AuthUser = {
        id: '11111111-2222-3333-4444-555555555555',
        fullName: 'Juan Pérez',
        email: 'juan@barberia.com',
        role: 'DUENO',
      };
      const updateGlobalUser = jest.fn();

      useBusinessOnboardingStore.getState().setBusinessName('Barbería Horarios');
      useBusinessOnboardingStore.getState().setStartTime('06:00 PM');
      useBusinessOnboardingStore.getState().setEndTime('09:00 AM'); // Fin menor que inicio

      await expect(
        useBusinessOnboardingStore.getState().submitOnboarding(mockUser, updateGlobalUser)
      ).rejects.toThrow('La hora de cierre debe ser posterior a la hora de apertura.');

      expect(businessOnboardingApi.completeBusinessOnboarding).not.toHaveBeenCalled();
      expect(useBusinessOnboardingStore.getState().error).toBe(
        'La hora de cierre debe ser posterior a la hora de apertura.'
      );
    });

    it('preserves form state and captures error message when backend returns 409 conflict', async () => {
      const mockUser: AuthUser = {
        id: '11111111-2222-3333-4444-555555555555',
        fullName: 'Juan Pérez',
        email: 'juan@barberia.com',
        role: 'DUENO',
      };
      const updateGlobalUser = jest.fn();

      (businessOnboardingApi.syncInitialBusiness as jest.Mock).mockResolvedValue({
        success: true,
        data: { businessId: 'biz-123' },
      });

      (businessOnboardingApi.completeBusinessOnboarding as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: {
            success: false,
            message: 'El nombre del negocio genera un slug que ya está en uso.',
          },
        },
      });

      useBusinessOnboardingStore.getState().setBusinessName('Barbería Repetida');
      useBusinessOnboardingStore.getState().setServiceName('Corte VIP');

      await expect(
        useBusinessOnboardingStore.getState().submitOnboarding(mockUser, updateGlobalUser)
      ).rejects.toThrow('El nombre del negocio genera un slug que ya está en uso.');

      const state = useBusinessOnboardingStore.getState();
      // Form state no se pierde
      expect(state.businessName).toBe('Barbería Repetida');
      expect(state.serviceName).toBe('Corte VIP');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('El nombre del negocio genera un slug que ya está en uso.');
      expect(state.isCompleted).toBe(false);
    });

    it('guarda JWT interno en almacenamiento seguro tras syncInitialBusiness', async () => {
      const mockUser: AuthUser = {
        id: 'user-jwt-1',
        fullName: 'Dueño JWT',
        email: 'jwt@slotify.com',
        role: 'DUENO',
      };
      const updateGlobalUser = jest.fn();
      const secureSetSpy = jest.spyOn(storage, 'secureSet');

      (businessOnboardingApi.syncInitialBusiness as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          businessId: 'biz-jwt-sync',
          accessToken: 'internal-slotify-jwt-sync-123',
          refreshToken: 'refresh-jwt-sync-123',
        },
      });

      (businessOnboardingApi.completeBusinessOnboarding as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          businessId: 'biz-jwt-sync',
        },
      });

      useBusinessOnboardingStore.getState().setBusinessName('Negocio JWT');
      useBusinessOnboardingStore.getState().setServiceName('Servicio Test');

      await useBusinessOnboardingStore.getState().submitOnboarding(mockUser, updateGlobalUser);

      expect(secureSetSpy).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        'internal-slotify-jwt-sync-123'
      );
      expect(secureSetSpy).toHaveBeenCalledWith(
        STORAGE_KEYS.REFRESH_TOKEN,
        'refresh-jwt-sync-123'
      );
    });

    it('recupera usuario existente mediante exchangeToken si syncInitialBusiness indica que ya está registrado', async () => {
      const mockUser: AuthUser = {
        id: 'user-recov-1',
        fullName: 'Dueño Existente',
        email: 'existente@slotify.com',
        role: 'DUENO',
      };
      const updateGlobalUser = jest.fn();
      const secureSetSpy = jest.spyOn(storage, 'secureSet');

      // syncInitialBusiness falla porque ya existe el email
      (businessOnboardingApi.syncInitialBusiness as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: 'El correo electrónico ya está registrado.',
          },
        },
      });

      // exchangeToken recupera el negocio y el JWT existente
      (authApi.exchangeToken as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          accessToken: 'recovered-jwt-token-456',
          refreshToken: 'recovered-refresh-456',
          user: {
            id: 'user-recov-1',
            email: 'existente@slotify.com',
            businessId: 'biz-recovered-789',
            isOnboardingCompleted: false,
          },
        },
      });

      (businessOnboardingApi.completeBusinessOnboarding as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          businessId: 'biz-recovered-789',
        },
      });

      useBusinessOnboardingStore.getState().setBusinessName('Negocio Existente');
      useBusinessOnboardingStore.getState().setServiceName('Servicio');

      await useBusinessOnboardingStore.getState().submitOnboarding(mockUser, updateGlobalUser);

      // Verificaciones
      expect(authApi.exchangeToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(secureSetSpy).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCESS_TOKEN,
        'recovered-jwt-token-456'
      );
      expect(businessOnboardingApi.completeBusinessOnboarding).toHaveBeenCalledTimes(1);
      expect(useBusinessOnboardingStore.getState().isCompleted).toBe(true);
    });

    it('detiene el flujo y reporta error si exchangeToken falla por discrepancia de identidad', async () => {
      const mockUser: AuthUser = {
        id: 'user-discrepancy-supabase',
        fullName: 'Dueño Conflicto',
        email: 'conflicto@slotify.com',
        role: 'DUENO',
      };
      const updateGlobalUser = jest.fn();

      (businessOnboardingApi.syncInitialBusiness as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: 'El correo electrónico ya está registrado.',
          },
        },
      });

      // exchangeToken falla por discrepancia entre Supabase y PostgreSQL
      (authApi.exchangeToken as jest.Mock).mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: 'Discrepancia de identidad: el ID del proveedor no coincide con el registrado en el sistema.',
          },
        },
      });

      useBusinessOnboardingStore.getState().setBusinessName('Negocio Discrepancia');
      useBusinessOnboardingStore.getState().setServiceName('Servicio');

      await expect(
        useBusinessOnboardingStore.getState().submitOnboarding(mockUser, updateGlobalUser)
      ).rejects.toThrow('Discrepancia de identidad');

      // NO debe haber intentado llamar a completeBusinessOnboarding
      expect(businessOnboardingApi.completeBusinessOnboarding).not.toHaveBeenCalled();
      expect(useBusinessOnboardingStore.getState().error).toContain('Discrepancia de identidad');
    });
  });
});
