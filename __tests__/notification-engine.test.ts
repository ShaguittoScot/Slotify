const mockStore = new Map<string, any>();

jest.mock('@/shared/lib/storage', () => ({
  storage: {
    get: jest.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
    set: jest.fn((key: string, val: any) => {
      mockStore.set(key, val);
      return Promise.resolve();
    }),
    remove: jest.fn((key: string) => {
      mockStore.delete(key);
      return Promise.resolve();
    }),
  },
}));

import {
  detectCancellations,
  detectNewBookings,
  detectReschedules,
  selectUpcomingConfirmed,
  useNotificationsStore,
} from '@/features/notifications/model';
import type { UpcomingAppointment } from '@/features/notifications/types';

describe('Motor de Notificaciones - Detección de Cambios y Lógica de Snapshot', () => {
  beforeEach(() => {
    mockStore.clear();
    useNotificationsStore.setState({
      snapshot: null,
      previousHash: null,
      isRefreshing: false,
    });
  });

  const now = Date.now();
  const futureDate1 = new Date(now + 60 * 60_000).toISOString(); // en 1 hora
  const futureDate2 = new Date(now + 120 * 60_000).toISOString(); // en 2 horas
  const futureDate3 = new Date(now + 180 * 60_000).toISOString(); // en 3 horas
  const pastDate = new Date(now - 30 * 60_000).toISOString();     // hace 30 min

  const sampleAppointment1: UpcomingAppointment = {
    id: 'apt-001',
    startTime: futureDate1,
    endTime: futureDate2,
    clientName: 'Juan Pérez',
    status: 'confirmed',
    businessName: 'Barbería Slotify',
    agreedTotal: 250,
  };

  const sampleAppointment2: UpcomingAppointment = {
    id: 'apt-002',
    startTime: futureDate2,
    endTime: futureDate3,
    clientName: 'María García',
    status: 'confirmed',
    businessName: 'Barbería Slotify',
    agreedTotal: 350,
  };

  test('selectUpcomingConfirmed filtra citas pasadas y no confirmadas, ordenando cronológicamente', () => {
    const list: UpcomingAppointment[] = [
      { ...sampleAppointment2 },
      { ...sampleAppointment1, id: 'apt-past', startTime: pastDate },
      { ...sampleAppointment1, id: 'apt-cancelled', status: 'cancelled' },
      { ...sampleAppointment1 },
    ];

    const result = selectUpcomingConfirmed(list, now);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('apt-001'); // La más cercana primero
    expect(result[1].id).toBe('apt-002');
  });

  test('detectNewBookings identifica citas nuevas que no existían en el snapshot previo', () => {
    const previous: UpcomingAppointment[] = [sampleAppointment1];
    const current: UpcomingAppointment[] = [sampleAppointment1, sampleAppointment2];

    const newBookings = detectNewBookings(previous, current);
    expect(newBookings).toHaveLength(1);
    expect(newBookings[0].id).toBe('apt-002');
    expect(newBookings[0].clientName).toBe('María García');
  });

  test('detectCancellations identifica citas que pasaron de confirmed a cancelled', () => {
    const previous: UpcomingAppointment[] = [sampleAppointment1, sampleAppointment2];
    const current: UpcomingAppointment[] = [
      sampleAppointment1,
      { ...sampleAppointment2, status: 'cancelled' },
    ];

    const cancellations = detectCancellations(previous, current);
    expect(cancellations).toHaveLength(1);
    expect(cancellations[0].id).toBe('apt-002');
    expect(cancellations[0].status).toBe('cancelled');
  });

  test('detectReschedules identifica citas cuyo startTime cambió manteniendo confirmed', () => {
    const previous: UpcomingAppointment[] = [sampleAppointment1];
    const rescheduledTime = new Date(now + 240 * 60_000).toISOString();
    const current: UpcomingAppointment[] = [
      { ...sampleAppointment1, startTime: rescheduledTime },
    ];

    const reschedules = detectReschedules(previous, current);
    expect(reschedules).toHaveLength(1);
    expect(reschedules[0].id).toBe('apt-001');
    expect(reschedules[0].startTime).toBe(rescheduledTime);
  });

  test('useNotificationsStore almacena y recupera el snapshot localmente', async () => {
    const scope = 'user_123_biz_456';
    const snapshot = {
      snapshotHash: 'hash-abc-123',
      appointments: [sampleAppointment1],
      savedAt: Date.now(),
    };

    await useNotificationsStore.getState().saveSnapshot(scope, snapshot);
    expect(useNotificationsStore.getState().snapshot).toEqual(snapshot);

    await useNotificationsStore.getState().clearSnapshot(scope);
    expect(useNotificationsStore.getState().snapshot).toBeNull();
  });
});
