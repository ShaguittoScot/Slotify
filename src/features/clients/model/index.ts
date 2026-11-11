/**
 * US-026: Construcción de módulo de clientes — Store & Lógica de Sincronización
 *
 * Responsabilidades:
 * 1. Consultar la cartera de clientes desde el backend (GET /api/clients) aislado por BusinessId.
 * 2. Sincronizar con las citas confirmadas de la agenda sin fusionar homónimos, teléfonos compartidos
 *    ni citas con horarios cercanos.
 * 3. Confirmar guardados únicamente cuando el servidor responde con éxito (cero registros fantasma en rechazos)
 *    y evitar que la caché local sobrescriba datos confirmados por el servidor.
 * 4. Aislar estrictamente por sesión/negocio e ignorar respuestas tardías al cambiar de cuenta.
 */

import { create } from 'zustand';
import { storage } from '@/shared/lib';
import type { CalendarSlot } from '@/shared/types';
import { useAuthStore } from '@/features/auth/model';
import { getCalendarAmount, resolveSessionScopeKey } from '@/features/calendar/model';
import {
  fetchBusinessClients,
  manageBusinessClient,
  saveBusinessClientNote,
  upsertBusinessClient,
  sanitizeClientEmail,
  sanitizeClientPhone,
} from '../api';
import type {
  BusinessClient,
  ClientAppointmentItem,
  ClientFilterSegment,
  ClientManagementAction,
  UpsertClientPayload,
} from '../types';

const MANUAL_CLIENTS_STORAGE_PREFIX = 'slotify_clients_manual_';
const CLIENT_NOTES_STORAGE_PREFIX = 'slotify_clients_notes_';
const CLIENTS_FRESH_FOR = 20_000;
let clientsRequest: { scope: string; id: number; task: Promise<void> } | undefined;

interface ClientsState {
  /** Clientes confirmados provenientes del servidor (GET / POST / PUT /api/clients) */
  apiClients: BusinessClient[];
  /** Caché auxiliar por alcance de negocio (jamás sobrescribe datos confirmados por el servidor) */
  manualClients: BusinessClient[];
  /** Notas internas indexadas por clave del cliente para el negocio activo */
  clientNotes: Record<string, string>;
  /** Estado de carga inicial */
  isLoading: boolean;
  /** Estado de pull-to-refresh */
  isRefreshing: boolean;
  /** Estado de guardado de formulario */
  isSaving: boolean;
  /** Error al consultar la cartera */
  error: string | null;
  /** Término de búsqueda actual */
  searchQuery: string;
  /** Segmento de filtro activo */
  activeSegment: ClientFilterSegment;
  /** Alcance actual de sesión y negocio */
  currentScopeKey: string;
  /** Identificador monotónico de solicitud para descartar respuestas tardías tras cambio de cuenta */
  requestId: number;
  lastLoadedAt: number;

  // ── Acciones ──────────────────────────────────────────
  loadClients: (scopeKey?: string, isRefresh?: boolean) => Promise<void>;
  invalidateClients: () => void;
  setSearchQuery: (query: string) => void;
  setActiveSegment: (segment: ClientFilterSegment) => void;
  saveClient: (payload: UpsertClientPayload, scopeKey?: string) => Promise<BusinessClient>;
  manageClient: (client: BusinessClient, action: ClientManagementAction, scopeKey: string) => Promise<void>;
  updateClientNote: (
    client: BusinessClient,
    note: string,
    scopeKey?: string
  ) => Promise<BusinessClient | undefined>;
  resetClientsState: () => void;
}

function normalizeName(rawName?: string | null): string {
  if (!rawName) return '';
  return rawName.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizePhoneDigits(rawPhone?: string | null): string {
  const clean = sanitizeClientPhone(rawPhone);
  if (!clean) return '';
  const digits = clean.replace(/\D+/g, '');
  return digits.length >= 7 && digits !== '525512345678' ? digits : '';
}

export function normalizeClientKey(input: {
  id?: string | null;
  clientId?: string | null;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
}): string {
  if (input.clientId && input.clientId.trim().length > 0) {
    return `id:${input.clientId.trim().toLowerCase()}`;
  }

  const cleanName = normalizeName(input.fullName) || 'cliente';
  const cleanEmail = sanitizeClientEmail(input.email).toLowerCase();
  const cleanPhone = normalizePhoneDigits(input.phone);

  if (cleanEmail || cleanPhone) {
    return `unlinked:name:${cleanName}|email:${cleanEmail}|phone:${cleanPhone}`;
  }

  if (input.id && input.id.trim().length > 0) {
    return `id:${input.id.trim().toLowerCase()}`;
  }

  return `name:${cleanName}`;
}

function isUnambiguousContactMatch(
  candidate: {
    clientId?: string | null;
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
  },
  existing: BusinessClient
): boolean {
  // Si ambos tienen clientId, solo son el mismo si el clientId es idéntico
  if (candidate.clientId && existing.clientId) {
    return candidate.clientId.trim().toLowerCase() === existing.clientId.trim().toLowerCase();
  }

  const candName = normalizeName(candidate.fullName);
  const existName = normalizeName(existing.fullName);

  // Nunca fusionar clientes con distinto nombre (ej. familiares que comparten teléfono o correo)
  if (!candName || !existName || candName !== existName) {
    return false;
  }

  const candEmail = sanitizeClientEmail(candidate.email).toLowerCase();
  const existEmail = sanitizeClientEmail(existing.email).toLowerCase();

  const candPhone = normalizePhoneDigits(candidate.phone);
  const existPhone = normalizePhoneDigits(existing.phone);

  // Si ambos tienen correo y difieren → homónimos distintos
  if (candEmail && existEmail && candEmail !== existEmail) {
    return false;
  }

  // Si ambos tienen teléfono y difieren → homónimos distintos
  if (candPhone && existPhone && candPhone !== existPhone) {
    return false;
  }

  const emailMatches = Boolean(candEmail && existEmail && candEmail === existEmail);
  const phoneMatches = Boolean(candPhone && existPhone && candPhone === existPhone);

  // Nunca fusionar únicamente por nombre: debe coincidir también correo o teléfono
  return emailMatches || phoneMatches;
}

/**
 * Combina de forma determinista:
 * - Clientes confirmados por el backend (GET /api/clients) -> Fuente de verdad prioritaria
 * - Caché local auxiliar (solo si aún no está en apiClients, jamás sobrescribe a apiClients)
 * - Citas reales presentes en useCalendarStore (emparejadas por ID exacto de cita, nunca por ventana de horario)
 * - Notas internas del negocio
 */
export function buildUnifiedBusinessClients(
  apiClients: BusinessClient[],
  manualClients: BusinessClient[],
  calendarSlots: CalendarSlot[],
  clientNotes: Record<string, string>,
  includeArchived = false,
): BusinessClient[] {
  const map = new Map<string, BusinessClient>();

  const findExistingKey = (candidate: {
    id?: string;
    clientId?: string | null;
    email?: string;
    phone?: string;
    fullName?: string;
  }): string => {
    // 1. Si trae clientId explícito, buscar solo por clientId exacto
    if (candidate.clientId && candidate.clientId.trim().length > 0) {
      const idKey = `id:${candidate.clientId.trim().toLowerCase()}`;
      if (map.has(idKey)) return idKey;

      for (const [key, existing] of map.entries()) {
        if (
          existing.clientId &&
          existing.clientId.trim().toLowerCase() === candidate.clientId.trim().toLowerCase()
        ) {
          return key;
        }
      }
      return idKey;
    }

    const primaryKey = normalizeClientKey(candidate);
    if (map.has(primaryKey)) return primaryKey;

    // 2. Para registros sin clientId (ej. slots del calendario), buscar coincidencia única e inequívoca
    //    (mismo nombre completo + mismo teléfono/correo y sin conflicto de contacto)
    const matchingKeys: string[] = [];
    for (const [key, existing] of map.entries()) {
      if (isUnambiguousContactMatch(candidate, existing)) {
        matchingKeys.push(key);
      }
    }

    if (matchingKeys.length === 1) {
      return matchingKeys[0];
    }

    return primaryKey;
  };

  // 1. Insertar clientes confirmados por el servidor (fuente de verdad)
  for (const client of apiClients) {
    const key = normalizeClientKey(client);
    map.set(key, {
      ...client,
      email: sanitizeClientEmail(client.email),
      phone: sanitizeClientPhone(client.phone),
      appointments: [...(client.appointments ?? [])],
    });
  }

  // 2. Incorporar caché local SIN sobrescribir jamás los datos confirmados por el servidor (apiClients)
  for (const manual of manualClients) {
    const key = findExistingKey(manual);
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        clientId: existing.clientId ?? manual.clientId ?? null,
        fullName: existing.fullName || manual.fullName,
        firstName: existing.firstName || manual.firstName,
        lastName: existing.lastName || manual.lastName,
        email: sanitizeClientEmail(existing.email) || sanitizeClientEmail(manual.email),
        phone: sanitizeClientPhone(existing.phone) || sanitizeClientPhone(manual.phone),
        notes: existing.notes ?? manual.notes,
      });
    } else {
      map.set(key, {
        ...manual,
        email: sanitizeClientEmail(manual.email),
        phone: sanitizeClientPhone(manual.phone),
        appointments: [...(manual.appointments ?? [])],
      });
    }
  }

  // 3. Sincronizar citas reales de la agenda (useCalendarStore)
  const appointmentSlots = calendarSlots.filter((s) => s.type === 'appointment');

  for (const slot of appointmentSlots) {
    const fullName = (slot.clientName ?? 'Cliente').trim();
    const phone = sanitizeClientPhone(slot.clientPhone);

    // Si la cita ya existe por ID exacto en algún cliente de map, actualizarla ahí mismo
    let keyByExactAppointmentId: string | null = null;
    for (const [k, existingClient] of map.entries()) {
      if (existingClient.appointments.some((a) => a.id === slot.resourceId)) {
        keyByExactAppointmentId = k;
        break;
      }
    }

    const key =
      keyByExactAppointmentId ??
      findExistingKey({
        id: `slot:${slot.resourceId}`,
        clientId: slot.businessClientId,
        fullName,
        phone,
      });

    const agreedTotal = getCalendarAmount(slot);
    const slotStatus = (slot.status ?? 'confirmed') as ClientAppointmentItem['status'];

    const apptItem: ClientAppointmentItem = {
      id: slot.resourceId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slotStatus,
      agreedTotal: agreedTotal ?? 0,
      title: slot.title === 'Cita Agendada' || slot.title?.startsWith('Cita - ') ? undefined : slot.title,
      employeeName: slot.employeeName,
    };

    const existing = map.get(key);
    if (!existing) {
      const parts = fullName.split(/\s+/);
      map.set(key, {
        id: key,
        clientId: slot.businessClientId ?? null,
        fullName,
        firstName: parts[0] || 'Cliente',
        lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
        email: '',
        phone,
        totalVisits: 0,
        completedVisits: 0,
        cancelledVisits: 0,
        totalSpent: 0,
        lastVisitAt: null,
        nextVisitAt: null,
        createdAt: slot.startTime,
        appointments: [apptItem],
      });
    } else {
      // Emparejar citas EXCLUSIVAMENTE por ID exacto (nunca por cercanía de horario)
      const sameApptIndex = existing.appointments.findIndex((a) => a.id === apptItem.id);

      const updatedAppointments = [...existing.appointments];
      if (sameApptIndex >= 0) {
        updatedAppointments[sameApptIndex] = {
          ...updatedAppointments[sameApptIndex],
          status: apptItem.status,
          agreedTotal: agreedTotal ?? updatedAppointments[sameApptIndex].agreedTotal,
          title: updatedAppointments[sameApptIndex].title ?? apptItem.title,
          employeeName: apptItem.employeeName || updatedAppointments[sameApptIndex].employeeName,
          startTime: apptItem.startTime,
          endTime: apptItem.endTime,
        };
      } else {
        updatedAppointments.push(apptItem);
      }

      map.set(key, {
        ...existing,
        phone: existing.phone || phone,
        appointments: updatedAppointments,
      });
    }
  }

  // 4. Recalcular métricas alineadas con el backend y adjuntar notas
  const nowMs = Date.now();
  const unified: BusinessClient[] = [];

  for (const [key, client] of map.entries()) {
    if (client.archivedAt && !includeArchived) continue;

    const sortedAppointments = [...client.appointments].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Visitas válidas: solo 'confirmed' y 'completed' (alineado con GetBusinessClientsHandler)
    const validAppointments = sortedAppointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'completed'
    );
    const completedAppointments = sortedAppointments.filter((a) => a.status === 'completed');
    const cancelledVisits = sortedAppointments.filter(
      (a) => a.status === 'cancelled' || a.status === 'no_show'
    ).length;

    // TotalSpent suma el importe pactado de las citas completadas.
    const totalSpent = completedAppointments.reduce(
      (sum, a) => sum + (a.agreedTotal || 0),
      0
    );

    const pastValid = validAppointments.filter(
      (a) => new Date(a.startTime).getTime() <= nowMs
    );
    const upcomingValid = validAppointments
      .filter((a) => new Date(a.startTime).getTime() > nowMs && a.status === 'confirmed')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Una nota vacía del servidor representa un borrado; el respaldo solo aplica si nunca se guardó.
    const noteFromMap =
      client.notes?.trim() ??
      clientNotes[key] ??
      clientNotes[client.id] ??
      (client.clientId ? clientNotes[`id:${client.clientId.toLowerCase()}`] : undefined) ??
      client.notes;

    unified.push({
      ...client,
      id: client.id || key,
      email: sanitizeClientEmail(client.email),
      phone: sanitizeClientPhone(client.phone),
      totalVisits: validAppointments.length,
      completedVisits: completedAppointments.length,
      cancelledVisits,
      totalSpent,
      lastVisitAt: pastValid.length > 0 ? pastValid[0].startTime : client.lastVisitAt ?? null,
      nextVisitAt:
        upcomingValid.length > 0 ? upcomingValid[0].startTime : client.nextVisitAt ?? null,
      notes: noteFromMap,
      appointments: sortedAppointments,
    });
  }

  return unified.sort((a, b) => {
    if (a.nextVisitAt && !b.nextVisitAt) return -1;
    if (!a.nextVisitAt && b.nextVisitAt) return 1;
    const dateA = new Date(a.lastVisitAt ?? a.nextVisitAt ?? a.createdAt).getTime();
    const dateB = new Date(b.lastVisitAt ?? b.nextVisitAt ?? b.createdAt).getTime();
    if (dateA !== dateB) return dateB - dateA;
    return a.fullName.localeCompare(b.fullName, 'es');
  });
}

/**
 * Filtra la lista unificada de clientes por texto de búsqueda y segmento activo.
 */
export function filterBusinessClients(
  clients: BusinessClient[],
  searchQuery: string,
  segment: ClientFilterSegment
): BusinessClient[] {
  let result = clients;

  if (segment === 'archived') {
    result = result.filter((c) => Boolean(c.archivedAt));
  } else {
    result = result.filter((c) => !c.archivedAt);
  }

  if (segment === 'upcoming') {
    result = result.filter((c) => Boolean(c.nextVisitAt));
  } else if (segment === 'frequent') {
    result = result.filter((c) => c.totalVisits >= 2);
  } else if (segment === 'new') {
    result = result.filter((c) => c.totalVisits <= 1);
  }

  const term = searchQuery.trim().toLowerCase();
  if (!term) return result;

  return result.filter(
    (c) =>
      c.fullName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.notes ?? '').toLowerCase().includes(term)
  );
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  apiClients: [],
  manualClients: [],
  clientNotes: {},
  isLoading: false,
  isRefreshing: false,
  isSaving: false,
  error: null,
  searchQuery: '',
  activeSegment: 'all',
  currentScopeKey: 'default',
  requestId: 0,
  lastLoadedAt: 0,

  loadClients: (scopeKey = 'default', isRefresh = false) => {
    const cleanScope = scopeKey || 'default';
    const scopeChanged = get().currentScopeKey !== cleanScope;
    if (!scopeChanged && clientsRequest?.scope === cleanScope && clientsRequest.id === get().requestId) {
      return clientsRequest.task;
    }
    if (!scopeChanged && !isRefresh && Date.now() - get().lastLoadedAt < CLIENTS_FRESH_FOR) {
      return Promise.resolve();
    }
    const nextRequestId = get().requestId + 1;

    if (scopeChanged) {
      set({
        currentScopeKey: cleanScope,
        requestId: nextRequestId,
        apiClients: [],
        manualClients: [],
        lastLoadedAt: 0,
        clientNotes: {},
        searchQuery: '',
        activeSegment: 'all',
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
      });
    } else {
      set({
        currentScopeKey: cleanScope,
        requestId: nextRequestId,
        isLoading: !isRefresh && get().apiClients.length === 0 && get().manualClients.length === 0,
        isRefreshing: isRefresh,
        error: null,
      });
    }

    const task = (async () => {
      // 1. Cargar notas locales aisladas por scopeKey
      try {
        const [parsedManual, parsedNotes] = await Promise.all([
          storage.get<BusinessClient[]>(`${MANUAL_CLIENTS_STORAGE_PREFIX}${cleanScope}`),
          storage.get<Record<string, string>>(`${CLIENT_NOTES_STORAGE_PREFIX}${cleanScope}`),
        ]);

        // Ignorar si cambió la cuenta o hubo otra solicitud posterior
        if (get().currentScopeKey !== cleanScope || get().requestId !== nextRequestId) {
          return;
        }

        set({
          manualClients: get().apiClients.length > 0
            ? get().manualClients
            : Array.isArray(parsedManual) ? parsedManual : [],
          clientNotes: parsedNotes && typeof parsedNotes === 'object' ? parsedNotes : {},
        });
      } catch {
        if (get().currentScopeKey !== cleanScope || get().requestId !== nextRequestId) {
          return;
        }
      }

      // 2. Consultar cartera desde GET /api/clients
      try {
        const remoteClients = await fetchBusinessClients(undefined, true);

        // Descartar respuesta tardía si la sesión/negocio cambió mientras estaba en vuelo
        if (get().currentScopeKey !== cleanScope || get().requestId !== nextRequestId) {
          return;
        }

        set({
          apiClients: remoteClients,
          manualClients: remoteClients,
          lastLoadedAt: Date.now(),
          isLoading: false,
          isRefreshing: false,
          error: null,
        });
        await storage.set(`${MANUAL_CLIENTS_STORAGE_PREFIX}${cleanScope}`, remoteClients).catch(() => {});
      } catch (err: any) {
        if (get().currentScopeKey !== cleanScope || get().requestId !== nextRequestId) {
          return;
        }

        set({
          isLoading: false,
          isRefreshing: false,
          error: err?.message || 'Error al sincronizar clientes',
        });
      }
    })();
    clientsRequest = { scope: cleanScope, id: nextRequestId, task };
    const clear = () => { if (clientsRequest?.task === task) clientsRequest = undefined; };
    void task.then(clear, clear);
    return task;
  },

  invalidateClients: () => set((state) => ({
    lastLoadedAt: 0, requestId: state.requestId + 1, isLoading: false, isRefreshing: false,
  })),

  manageClient: async (client, action, scopeKey) => {
    if (get().currentScopeKey !== scopeKey) return;
    const saved = await manageBusinessClient(client, action);
    if (get().currentScopeKey !== scopeKey) return;

    const appointmentIds = new Set(saved?.appointments.map((appointment) => appointment.id));
    const retain = (candidate: BusinessClient) =>
      candidate.id !== client.id &&
      candidate.id !== saved?.id &&
      (candidate.isRegistered || !candidate.appointments.some((appointment) => appointmentIds.has(appointment.id)));

    const { apiClients, manualClients, clientNotes, requestId } = get();
    const nextApi = apiClients.filter(retain);
    const nextManual = manualClients.filter(retain);
    if (saved) {
      nextApi.unshift(saved);
      nextManual.unshift(saved);
    }
    const nextNotes = { ...clientNotes };
    if (saved) {
      const localNote = clientNotes[normalizeClientKey(client)] ?? clientNotes[client.id];
      if (!saved.notes && localNote !== undefined) {
        nextNotes[normalizeClientKey(saved)] = localNote;
      }
    } else {
      delete nextNotes[client.id];
      delete nextNotes[normalizeClientKey(client)];
    }

    set({
      apiClients: nextApi,
      manualClients: nextManual,
      clientNotes: nextNotes,
      requestId: requestId + 1,
      isLoading: false,
      isRefreshing: false,
    });
    await Promise.allSettled([
      storage.set(`${MANUAL_CLIENTS_STORAGE_PREFIX}${scopeKey}`, nextManual),
      storage.set(`${CLIENT_NOTES_STORAGE_PREFIX}${scopeKey}`, nextNotes),
    ]);
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setActiveSegment: (activeSegment) => set({ activeSegment }),

  saveClient: async (payload, scopeKey) => {
    const cleanScope = scopeKey || get().currentScopeKey || 'default';
    if (get().currentScopeKey !== cleanScope) {
      set({
        currentScopeKey: cleanScope,
        apiClients: [],
        manualClients: [],
        clientNotes: {},
      });
    }

    set({ isSaving: true });

    const firstName = payload.firstName.trim();
    const lastName = (payload.lastName ?? '').trim();
    const email = sanitizeClientEmail(payload.email);
    const phone = sanitizeClientPhone(payload.phone);
    const notes = payload.notes?.trim();

    let savedClient: BusinessClient;
    try {
      // Solo se muestra éxito cuando el servidor confirma; si rechaza, propaga el error sin agregar registros fantasma
      savedClient = await upsertBusinessClient({
        clientId: payload.clientId,
        firstName,
        lastName,
        email,
        phone,
        notes,
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'El servidor rechazó el guardado del cliente.';
      if (get().currentScopeKey === cleanScope) {
        set({ isSaving: false });
      }
      throw new Error(errorMsg);
    }

    // Si la sesión o negocio cambió mientras el guardado estaba en vuelo, no contaminar la cuenta activa
    if (get().currentScopeKey !== cleanScope) {
      return savedClient;
    }

    const finalNotes =
      notes !== undefined
        ? notes
        : savedClient.notes ?? get().clientNotes[normalizeClientKey(savedClient)];

    const enrichedClient: BusinessClient = {
      ...savedClient,
      notes: finalNotes,
    };

    const clientKey = normalizeClientKey(enrichedClient);
    const originalKey = payload.clientId ? normalizeClientKey({ clientId: payload.clientId }) : null;
    const keepClient = (client: BusinessClient) => {
      const key = normalizeClientKey(client);
      return client.id !== enrichedClient.id && key !== clientKey && key !== originalKey;
    };

    const updatedApiClients = [enrichedClient, ...get().apiClients.filter(keepClient)];
    const updatedManual = [enrichedClient, ...get().manualClients.filter(keepClient)];

    const updatedNotes = { ...get().clientNotes };
    if (finalNotes !== undefined) {
      updatedNotes[clientKey] = finalNotes;
      updatedNotes[enrichedClient.id] = finalNotes;
    }

    set({
      apiClients: updatedApiClients,
      manualClients: updatedManual,
      clientNotes: updatedNotes,
      isSaving: false,
      isLoading: false,
      isRefreshing: false,
      requestId: get().requestId + 1,
    });

    try {
      await Promise.all([
        storage.set(`${MANUAL_CLIENTS_STORAGE_PREFIX}${cleanScope}`, updatedManual),
        storage.set(`${CLIENT_NOTES_STORAGE_PREFIX}${cleanScope}`, updatedNotes),
      ]);
    } catch {
      // Ignorar errores de almacenamiento secundario
    }

    return enrichedClient;
  },

  updateClientNote: async (client, note, scopeKey) => {
    const cleanScope = scopeKey || get().currentScopeKey || 'default';
    if (get().currentScopeKey !== cleanScope) return;
    const saved = await saveBusinessClientNote(client, note.trim());
    if (get().currentScopeKey !== cleanScope) return;

    const state = get();
    const history = new Set(saved.appointments.map(({ id }) => id));
    const keepClient = (candidate: BusinessClient) =>
      candidate.id !== client.id &&
      candidate.id !== saved.id &&
      (candidate.isRegistered || !candidate.appointments.some(({ id }) => history.has(id)));
    const nextNotes = { ...state.clientNotes };
    for (const updated of [client, saved]) {
      delete nextNotes[updated.id];
      delete nextNotes[normalizeClientKey(updated)];
    }
    const nextManual = [saved, ...state.manualClients.filter(keepClient)];
    set({
      apiClients: [saved, ...state.apiClients.filter(keepClient)],
      manualClients: nextManual,
      clientNotes: nextNotes,
      requestId: state.requestId + 1,
      isLoading: false,
      isRefreshing: false,
    });
    await Promise.allSettled([
      storage.set(`${MANUAL_CLIENTS_STORAGE_PREFIX}${cleanScope}`, nextManual),
      storage.set(`${CLIENT_NOTES_STORAGE_PREFIX}${cleanScope}`, nextNotes),
    ]);
    return saved;
  },

  resetClientsState: () =>
    set((state) => ({
      apiClients: [],
      manualClients: [],
      clientNotes: {},
      isLoading: false,
      isRefreshing: false,
      isSaving: false,
      error: null,
      searchQuery: '',
      activeSegment: 'all',
      currentScopeKey: 'default',
      lastLoadedAt: 0,
      requestId: state.requestId + 1,
    })),
}));

if (typeof useAuthStore?.subscribe === 'function') {
  let previousScope = resolveSessionScopeKey(useAuthStore.getState()?.user);
  useAuthStore.subscribe((state) => {
    const nextScope = resolveSessionScopeKey(state.user);
    if (nextScope !== previousScope) {
      previousScope = nextScope;
      useClientsStore.setState((cli) => ({
        apiClients: [],
        manualClients: [],
        clientNotes: {},
        isLoading: false,
        isRefreshing: false,
        isSaving: false,
        error: null,
        searchQuery: '',
        activeSegment: 'all',
        currentScopeKey: nextScope,
        lastLoadedAt: 0,
        requestId: cli.requestId + 1,
      }));
    }
  });
}
