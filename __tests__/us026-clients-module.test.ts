const mockGetItem = jest.fn().mockResolvedValue(null);
const mockSetItem = jest.fn().mockResolvedValue(undefined);
const mockSecureGet = jest.fn().mockResolvedValue('jwt-token-us026');

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/shared/lib/storage', () => ({
  storage: {
    get: (...args: unknown[]) => mockGetItem(...args),
    set: (...args: unknown[]) => mockSetItem(...args),
    secureGet: (...args: unknown[]) => mockSecureGet(...args),
    secureRemove: jest.fn().mockResolvedValue(undefined),
    secureSet: jest.fn().mockResolvedValue(undefined),
  },
}));

import { AxiosError, AxiosHeaders } from 'axios';
import { apiClient } from '@/shared/lib/api';
import {
  fetchBusinessClients,
  upsertBusinessClient,
} from '@/features/clients/api';
import {
  buildUnifiedBusinessClients,
  filterBusinessClients,
  normalizeClientKey,
  useClientsStore,
} from '@/features/clients/model';
import { createCalendarAppointment } from '@/features/calendar/api';
import { useCalendarStore } from '@/features/calendar/model';
import type { CalendarSlot } from '@/shared/types';
import type { BusinessClient } from '@/features/clients/types';

describe('US-026 | Módulo de Cartera de Clientes, Integración con Agenda y Seguridad Multi-Negocio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useClientsStore.getState().resetClientsState();
    useCalendarStore.getState().resetCalendarState();
  });

  test('1. Cero Datos Fantasmas: negocio sin citas ni registros devuelve lista vacía', () => {
    const unified = buildUnifiedBusinessClients([], [], [], {});
    expect(unified).toEqual([]);
    expect(unified).toHaveLength(0);
  });

  test('una nota borrada en el servidor tiene prioridad sobre las dos cachés', () => {
    const slot: CalendarSlot = {
      type: 'appointment', resourceId: 'apt-legacy-note', title: 'Cita Agendada', status: 'confirmed',
      clientName: 'Cliente de prueba', startTime: '2026-11-10T12:00:00Z', endTime: '2026-11-10T13:00:00Z',
    };
    const [historic] = buildUnifiedBusinessClients([], [], [slot], {});
    const server = { ...historic, isRegistered: true, notes: '' };
    const [client] = buildUnifiedBusinessClients(
      [server], [{ ...server, notes: 'Nota anterior' }], [slot], { [server.id]: 'Nota anterior' },
    );
    expect(client.notes).toBe('');
  });

  test('comparte la solicitud de cartera y vuelve a consultar después de cambiar una cita', async () => {
    let requests = 0;
    apiClient.defaults.adapter = async (config) => {
      requests += 1;
      return { data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config };
    };
    const { loadClients, invalidateClients } = useClientsStore.getState();
    await Promise.all([loadClients('user:business'), loadClients('user:business')]);
    await loadClients('user:business');
    expect(requests).toBe(1);
    invalidateClients();
    await loadClients('user:business');
    expect(requests).toBe(2);
  });

  test('El importe numérico de Agenda conserva los centavos frente al precio formateado', () => {
    const slot: CalendarSlot = {
      type: 'appointment', resourceId: 'apt-with-cents', title: 'Servicio de prueba',
      status: 'completed', clientName: 'Cliente de prueba',
      startTime: '2026-11-10T12:00:00Z', endTime: '2026-11-10T13:00:00Z',
      agreedTotal: 199.5, servicePrice: '$200 MXN',
    };
    const [client] = buildUnifiedBusinessClients([], [], [slot], {});
    expect(client.totalSpent).toBe(199.5);
  });

  test('2. Métricas, Citas a la misma hora y Prioridad de Servidor: totalSpent suma citas completadas, conserva citas simultáneas y la caché no sobrescribe al servidor', () => {
    const pastIso = new Date(Date.now() - 86400000 * 5).toISOString();
    const sameFutureTimeIso = new Date(Date.now() + 86400000 * 2).toISOString();

    const apiClients: BusinessClient[] = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        clientId: '11111111-2222-3333-4444-555555555555',
        fullName: 'Carlos Mendoza Confirmado',
        firstName: 'Carlos',
        lastName: 'Mendoza Confirmado',
        email: 'carlos.nuevo@correo.com',
        phone: '+52 442 111 2233',
        notes: 'Nota oficial del servidor',
        totalVisits: 2,
        completedVisits: 1,
        cancelledVisits: 0,
        totalSpent: 250,
        lastVisitAt: pastIso,
        nextVisitAt: sameFutureTimeIso,
        createdAt: pastIso,
        appointments: [
          {
            id: 'apt-completed-1',
            startTime: pastIso,
            endTime: pastIso,
            status: 'completed',
            agreedTotal: 250,
            title: 'Corte Clásico',
          },
          {
            id: 'apt-simultaneous-A',
            startTime: sameFutureTimeIso,
            endTime: sameFutureTimeIso,
            status: 'confirmed',
            agreedTotal: 300,
            title: 'Barba Express (Empleado 1)',
          },
        ],
      },
    ];

    // Copia local antigua con datos desactualizados (no debe sobrescribir lo confirmado por el servidor)
    const staleManualClients: BusinessClient[] = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        clientId: '11111111-2222-3333-4444-555555555555',
        fullName: 'Carlos Nombre Antiguo',
        firstName: 'Carlos',
        lastName: 'Nombre Antiguo',
        email: 'carlos.viejo@correo.com',
        phone: '+52 442 000 0000',
        notes: 'Nota vieja en caché',
        totalVisits: 0,
        completedVisits: 0,
        cancelledVisits: 0,
        totalSpent: 0,
        lastVisitAt: null,
        nextVisitAt: null,
        createdAt: pastIso,
        appointments: [],
      },
    ];

    // Segunda cita distinta exactamente a la misma hora (ej. segundo servicio / otro empleado)
    const calendarSlots: CalendarSlot[] = [
      {
        type: 'appointment',
        resourceId: 'apt-simultaneous-B',
        title: 'Facial Hidratante (Empleado 2)',
        status: 'confirmed',
        clientName: 'Carlos Mendoza Confirmado',
        clientPhone: '+52 442 111 2233',
        servicePrice: '$350',
        startTime: sameFutureTimeIso,
        endTime: sameFutureTimeIso,
      },
    ];

    const unified = buildUnifiedBusinessClients(
      apiClients,
      staleManualClients,
      calendarSlots,
      {}
    );

    expect(unified).toHaveLength(1);
    const carlos = unified[0];

    // El servidor manda sobre la caché local
    expect(carlos.fullName).toBe('Carlos Mendoza Confirmado');
    expect(carlos.email).toBe('carlos.nuevo@correo.com');
    expect(carlos.phone).toBe('+52 442 111 2233');
    expect(carlos.notes).toBe('Nota oficial del servidor');

    // Las dos citas a la misma hora con distinto ID se conservan sin sobrescribirse
    expect(carlos.appointments).toHaveLength(3);
    expect(carlos.appointments.map((a) => a.id)).toEqual(
      expect.arrayContaining([
        'apt-completed-1',
        'apt-simultaneous-A',
        'apt-simultaneous-B',
      ])
    );

    // TotalSpent suma únicamente la cita 'completed' ($250), sin confundir las 2 'confirmed' ($300 + $350) con pagos
    expect(carlos.totalVisits).toBe(3);
    expect(carlos.completedVisits).toBe(1);
    expect(carlos.totalSpent).toBe(250);
  });

  test('3. Identidad: no fusiona homónimos (mismo nombre, distinto teléfono/correo) ni familiares con teléfono compartido', () => {
    const nowIso = new Date().toISOString();

    const apiClients: BusinessClient[] = [
      {
        id: 'aaaa1111-1111-1111-1111-111111111111',
        clientId: 'aaaa1111-1111-1111-1111-111111111111',
        fullName: 'Juan Pérez',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan1@correo.com',
        phone: '4421110001',
        totalVisits: 1,
        completedVisits: 1,
        cancelledVisits: 0,
        totalSpent: 200,
        lastVisitAt: nowIso,
        nextVisitAt: null,
        createdAt: nowIso,
        appointments: [],
      },
      {
        id: 'bbbb2222-2222-2222-2222-222222222222',
        clientId: 'bbbb2222-2222-2222-2222-222222222222',
        fullName: 'Juan Pérez',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan2@correo.com',
        phone: '4422220002',
        totalVisits: 1,
        completedVisits: 1,
        cancelledVisits: 0,
        totalSpent: 350,
        lastVisitAt: nowIso,
        nextVisitAt: null,
        createdAt: nowIso,
        appointments: [],
      },
    ];

    // Cita en agenda de un familiar ("Ana Pérez") que comparte el teléfono de Juan #1
    const calendarSlots: CalendarSlot[] = [
      {
        type: 'appointment',
        resourceId: 'apt-ana-shared-phone',
        title: 'Corte Dama',
        status: 'completed',
        clientName: 'Ana Pérez',
        clientPhone: '4421110001',
        servicePrice: '$400',
        startTime: nowIso,
        endTime: nowIso,
      },
    ];

    const unified = buildUnifiedBusinessClients(
      apiClients,
      [],
      calendarSlots,
      {}
    );

    // Deben permanecer como 3 clientes separados
    expect(unified).toHaveLength(3);
    expect(
      unified.filter((c) => c.fullName === 'Juan Pérez')
    ).toHaveLength(2);
    expect(
      unified.find((c) => c.fullName === 'Ana Pérez')?.phone
    ).toBe('4421110001');
  });

  test('4. Rechazos del Servidor: saveClient y createCalendarAppointment propagan el error y no crean registros fantasma', async () => {
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError(
        'Request failed with status code 403',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            success: false,
            error: 'No tienes permisos para modificar este cliente.',
          },
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );
    };

    await expect(
      useClientsStore.getState().saveClient(
        {
          clientId: '99999999-9999-9999-9999-999999999999',
          firstName: 'Intruso',
          lastName: 'Rechazado',
          email: 'intruso@correo.com',
          phone: '4421234567',
        },
        'biz-a'
      )
    ).rejects.toThrow('No tienes permisos para modificar este cliente.');

    // Ningún cliente fantasma debe haberse agregado al store ni a la caché
    expect(useClientsStore.getState().apiClients).toHaveLength(0);
    expect(useClientsStore.getState().manualClients).toHaveLength(0);
    expect(mockSetItem).not.toHaveBeenCalled();

    // Rechazo al crear cita en agenda
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError(
        'Request failed with status code 400',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            success: false,
            errors: ['El horario seleccionado ya está ocupado.'],
          },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );
    };

    await expect(
      createCalendarAppointment({
        clientName: 'Cliente Cita Rechazada',
        clientPhone: '4421112233',
        agreedTotal: 200,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      })
    ).rejects.toThrow('El horario seleccionado ya está ocupado.');
  });

  test.each(['ficha', 'nota'])('Reemplaza el ID histórico después de guardar %s', async (edit) => {
    const scopeKey = 'user-a:biz-a';
    const globalId = '11111111-2222-3333-4444-555555555555';
    const cardId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const historicalClient: BusinessClient = {
      id: globalId,
      clientId: globalId,
      fullName: 'María López',
      firstName: 'María',
      lastName: 'López',
      email: edit === 'nota' ? '' : 'maria@correo.com',
      phone: edit === 'nota' ? '' : '4421234567',
      totalVisits: 1,
      completedVisits: 1,
      cancelledVisits: 0,
      totalSpent: 250,
      lastVisitAt: '2026-11-08T10:00:00Z',
      nextVisitAt: null,
      createdAt: '2026-11-08T10:00:00Z',
      appointments: [{
        id: 'history-appointment',
        startTime: '2026-11-08T10:00:00Z',
        endTime: '2026-11-08T11:00:00Z',
        status: 'completed',
        agreedTotal: 250,
      }],
    };
    useClientsStore.setState({
      currentScopeKey: scopeKey,
      apiClients: [historicalClient],
      manualClients: [historicalClient],
    });
    const note = 'Prefiere horario matutino';
    apiClient.defaults.adapter = async (config) => {
      if (edit === 'nota') {
        expect(config.method).toBe('patch');
        expect(config.url).toBe('/clients/note');
        expect(JSON.parse(config.data)).toEqual({ clientId: null, appointmentId: 'history-appointment', note });
      }
      return {
        data: {
          success: true,
          data: { ...historicalClient, id: cardId, clientId: cardId, isRegistered: true, notes: note },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const store = useClientsStore.getState();
    const saved = edit === 'nota'
      ? await store.updateClientNote(historicalClient, note, scopeKey)
      : await store.saveClient({
        clientId: globalId,
        firstName: historicalClient.firstName,
        lastName: historicalClient.lastName,
        email: historicalClient.email,
        phone: historicalClient.phone,
      }, scopeKey);

    expect(saved?.clientId).toBe(cardId);
    const { apiClients, manualClients } = useClientsStore.getState();
    expect(apiClients.map(({ clientId }) => clientId)).toEqual([cardId]);
    expect(manualClients.map(({ clientId }) => clientId)).toEqual([cardId]);
  });

  test('5. Integración con Agenda: createCalendarAppointment devuelve el ID real del servidor y no envía datos ficticios', async () => {
    let capturedBody: any;

    apiClient.defaults.adapter = async (config) => {
      capturedBody =
        typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return {
        data: {
          success: true,
          id: 'real-server-uuid-9876',
          data: 'real-server-uuid-9876',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const realId = await createCalendarAppointment({
      clientName: 'Sofía Vargas',
      clientPhone: '',
      agreedTotal: 300,
      startTime: '2026-11-12T16:00:00.000Z',
      endTime: '2026-11-12T17:00:00.000Z',
    });

    expect(realId).toBe('real-server-uuid-9876');
    expect(capturedBody.clientEmail).toBe('');
    expect(capturedBody.clientPhone).toBe('');
  });

  test('6. Cambio de Cuenta y Respuestas Tardías: ignora respuestas en vuelo de la sesión anterior en clientes y agenda', async () => {
    let resolveBizAClients!: (value: any) => void;
    let resolveBizASlots!: (value: any) => void;

    apiClient.defaults.adapter = (config) => {
      if (config.url?.includes('/clients')) {
        return new Promise((resolve) => {
          resolveBizAClients = resolve;
        });
      }
      return new Promise((resolve) => {
        resolveBizASlots = resolve;
      });
    };

    // Iniciar carga lenta para Negocio A y esperar a que la petición HTTP esté en vuelo
    const pendingClientsA = useClientsStore
      .getState()
      .loadClients('user-a:biz-a', false);
    const pendingSlotsA = useCalendarStore
      .getState()
      .loadSlots('user-a:biz-a');

    await new Promise((r) => setTimeout(r, 15));

    // El usuario cambia de cuenta a Negocio B antes de que respondan las peticiones de Negocio A
    apiClient.defaults.adapter = async (config) => {
      if (config.url?.includes('/clients')) {
        return {
          data: {
            success: true,
            data: [
              {
                id: 'client-biz-b',
                clientId: 'client-biz-b',
                fullName: 'Cliente Exclusivo Negocio B',
                firstName: 'Cliente',
                lastName: 'Negocio B',
                email: 'b@negociob.com',
                phone: '4428889999',
                totalVisits: 1,
                completedVisits: 1,
                cancelledVisits: 0,
                totalSpent: 500,
                createdAt: '2026-11-10T10:00:00Z',
                appointments: [],
              },
            ],
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
      return {
        data: {
          rangeStart: '2026-11-01T00:00:00Z',
          rangeEnd: '2026-11-30T23:59:59Z',
          slots: [
            {
              type: 'appointment',
              resourceId: 'slot-biz-b',
              title: 'Cita Negocio B',
              clientName: 'Cliente Exclusivo Negocio B',
              startTime: '2026-11-10T12:00:00Z',
              endTime: '2026-11-10T13:00:00Z',
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await useClientsStore.getState().loadClients('user-b:biz-b', false);
    await useCalendarStore.getState().loadSlots('user-b:biz-b');

    // Ahora llegan tardíamente las respuestas de Negocio A
    resolveBizAClients({
      data: {
        success: true,
        data: [
          {
            id: 'client-biz-a',
            fullName: 'Cliente Intruso Negocio A',
            email: 'a@negocioa.com',
            phone: '4420001111',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    resolveBizASlots({
      data: {
        slots: [
          {
            type: 'appointment',
            resourceId: 'slot-biz-a',
            title: 'Cita Intrusa Negocio A',
            clientName: 'Cliente Intruso Negocio A',
            startTime: '2026-11-10T09:00:00Z',
            endTime: '2026-11-10T10:00:00Z',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });

    await Promise.all([pendingClientsA, pendingSlotsA]);

    // Los stores deben conservar únicamente los datos de Negocio B e ignorar las respuestas tardías de Negocio A
    expect(useClientsStore.getState().currentScopeKey).toBe('user-b:biz-b');
    expect(useClientsStore.getState().apiClients).toHaveLength(1);
    expect(useClientsStore.getState().apiClients[0].fullName).toBe(
      'Cliente Exclusivo Negocio B'
    );

    expect(useCalendarStore.getState().currentScopeKey).toBe('user-b:biz-b');
    expect(useCalendarStore.getState().slots).toHaveLength(1);
    expect(useCalendarStore.getState().slots[0].resourceId).toBe('slot-biz-b');
  });

  test('Archivar un cliente histórico impide que la agenda lo recree en Activos', async () => {
    const scope = 'user-a:biz-a';
    const slot: CalendarSlot = {
      type: 'appointment',
      resourceId: 'appointment-for-archiving',
      title: 'Cita histórica',
      clientName: 'Cliente de prueba',
      status: 'completed',
      startTime: '2026-11-09T15:00:00Z',
      endTime: '2026-11-09T16:00:00Z',
    };
    const [historical] = buildUnifiedBusinessClients([], [], [slot], {});
    const archived = {
      ...historical,
      id: 'saved-archive-card',
      clientId: 'saved-archive-card',
      isRegistered: true,
      archivedAt: '2026-11-10T15:00:00Z',
    };
    useClientsStore.setState({ currentScopeKey: scope, apiClients: [historical], manualClients: [historical] });
    apiClient.defaults.adapter = async (config) => {
      expect(config.url).toBe('/clients/archive');
      expect(JSON.parse(config.data)).toEqual({ clientId: null, appointmentId: slot.resourceId });
      return { data: { success: true, data: archived }, status: 200, statusText: 'OK', headers: {}, config };
    };

    await useClientsStore.getState().manageClient(historical, 'archive', scope);

    const { apiClients, manualClients } = useClientsStore.getState();
    expect(buildUnifiedBusinessClients(apiClients, manualClients, [slot], {})).toEqual([]);
    const portfolio = buildUnifiedBusinessClients(apiClients, manualClients, [slot], {}, true);
    const archive = filterBusinessClients(portfolio, '', 'archived');
    expect(archive).toHaveLength(1);
    expect(archive[0].appointments.map(({ id }) => id)).toEqual([slot.resourceId]);
  });

  test('7. Búsqueda, Segmentos y Persistencia de Notas sin Correos Ficticios', async () => {
    let capturedPostBody: any;

    apiClient.defaults.adapter = async (config) => {
      capturedPostBody =
        typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      return {
        data: {
          success: true,
          data: {
            id: 'ffffffff-1111-2222-3333-444444444444',
            clientId: 'ffffffff-1111-2222-3333-444444444444',
            fullName: 'Luis Torres',
            firstName: 'Luis',
            lastName: 'Torres',
            email: 'luis-123@clientes.slotify.app', // Aunque llegue sintético, el cliente API lo limpia
            phone: '4421239876',
            notes: 'Cliente puntual sin correo',
            totalVisits: 0,
            completedVisits: 0,
            cancelledVisits: 0,
            totalSpent: 0,
            createdAt: '2026-11-10T12:00:00Z',
            appointments: [],
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const saved = await useClientsStore.getState().saveClient(
      {
        firstName: 'Luis',
        lastName: 'Torres',
        email: '',
        phone: '4421239876',
        notes: 'Cliente puntual sin correo',
      },
      'biz-test-1'
    );

    expect(capturedPostBody.notes).toBe('Cliente puntual sin correo');
    expect(saved.email).toBe(''); // Cero correos ficticios @clientes.slotify.app
    expect(saved.notes).toBe('Cliente puntual sin correo');
    expect(filterBusinessClients([saved], 'puntual', 'new')).toHaveLength(1);
  });
});
