import { apiClient } from '@/shared/lib/api';
import {
  createScheduleBlock,
  deleteScheduleBlock,
  fetchScheduleBlocks,
} from '@/features/schedule-blocks/api';
import { useCalendarStore } from '@/features/calendar/model';
import { useAuthStore } from '@/features/auth/model';

const mockSecureGet = jest.fn();
const mockSecureRemove = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
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
    getState: jest.fn(() => ({
      user: {
        id: 'user-admin-1',
        email: 'admin@negocio.com',
        businessId: '11111111-1111-1111-1111-111111111111',
      },
      isDemoMode: false,
    })),
  },
}));

describe('US-023 | Schedule Blocks Functional & API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCalendarStore.setState({ slots: [] });
  });

  test('createScheduleBlock envía POST /api/schedule-blocks y retorna ID del bloqueo', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    apiClient.defaults.adapter = async (config) => {
      capturedUrl = config.url || '';
      capturedMethod = (config.method || '').toUpperCase();
      capturedBody = JSON.parse(config.data);
      return {
        data: {
          success: true,
          data: 42,
          message: 'Bloqueo de horario creado exitosamente.',
          errors: [],
        },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    };

    const payload = {
      startDateTime: '2026-11-10T14:00:00.000Z',
      endDateTime: '2026-11-10T15:00:00.000Z',
      reason: 'Horario de Comida',
    };

    const blockId = await createScheduleBlock(payload);

    expect(capturedUrl).toContain('/schedule-blocks');
    expect(capturedMethod).toBe('POST');
    expect(capturedBody).toEqual(payload);
    expect(blockId).toBe(42);
  });

  test('deleteScheduleBlock envía DELETE /api/schedule-blocks/{id}', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    apiClient.defaults.adapter = async (config) => {
      capturedUrl = config.url || '';
      capturedMethod = (config.method || '').toUpperCase();
      return {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await deleteScheduleBlock(42);

    expect(capturedUrl).toContain('/schedule-blocks/42');
    expect(capturedMethod).toBe('DELETE');
  });

  test('fetchScheduleBlocks envía GET /api/schedule-blocks con parámetros de rango de fecha', async () => {
    let capturedParams: any = null;

    apiClient.defaults.adapter = async (config) => {
      capturedParams = config.params;
      return {
        data: {
          success: true,
          data: [
            {
              id: 42,
              businessId: '11111111-1111-1111-1111-111111111111',
              startDateTime: '2026-11-10T14:00:00.000Z',
              endDateTime: '2026-11-10T15:00:00.000Z',
              reason: 'Horario de Comida',
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const blocks = await fetchScheduleBlocks('2026-11-10T00:00:00.000Z', '2026-11-10T23:59:59.000Z');

    expect(capturedParams).toEqual({
      startDate: '2026-11-10T00:00:00.000Z',
      endDate: '2026-11-10T23:59:59.000Z',
    });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe(42);
  });

  test('useCalendarStore.createBlock persiste en API y actualiza el estado de slots', async () => {
    apiClient.defaults.adapter = async (config) => ({
      data: { success: true, data: 99 },
      status: 201,
      statusText: 'Created',
      headers: {},
      config,
    });

    await useCalendarStore.getState().createBlock({
      title: 'Bloqueo: Almuerzo',
      reason: 'Almuerzo',
      startTime: '2026-11-10T14:00:00.000Z',
      endTime: '2026-11-10T15:00:00.000Z',
    });

    const slots = useCalendarStore.getState().slots;
    expect(slots).toHaveLength(1);
    expect(slots[0].type).toBe('block');
    expect(slots[0].resourceId).toBe('99');
    expect(slots[0].status).toBe('blocked');
    expect(slots[0].blockReason).toBe('Almuerzo');
  });

  test('useCalendarStore.deleteBlock elimina en API y remueve el slot de memoria', async () => {
    let deletedId = 0;
    apiClient.defaults.adapter = async (config) => {
      const match = (config.url || '').match(/\/schedule-blocks\/(\d+)/);
      if (match) deletedId = parseInt(match[1], 10);
      return {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    useCalendarStore.setState({
      slots: [
        {
          type: 'block',
          resourceId: '99',
          title: 'Bloqueo: Almuerzo',
          status: 'blocked',
          startTime: '2026-11-10T14:00:00.000Z',
          endTime: '2026-11-10T15:00:00.000Z',
        },
      ],
    });

    await useCalendarStore.getState().deleteBlock('99');

    expect(deletedId).toBe(99);
    expect(useCalendarStore.getState().slots).toHaveLength(0);
  });
});
