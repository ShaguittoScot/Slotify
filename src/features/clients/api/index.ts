/**
 * US-026: Construcción de módulo de clientes — Capa API
 *
 * Consume los endpoints protegidos del backend .NET (Slotify_back):
 * - GET /api/clients?search=...
 * - POST /api/clients
 * - PUT /api/clients/{id}
 *
 * El token JWT se adjunta automáticamente mediante apiClient y el backend
 * aísla estrictamente los datos por el BusinessId del token (US-022).
 */

import { apiClient, API_ENDPOINTS } from '@/shared/lib';
import type {
  BusinessClient,
  ClientAppointmentItem,
  ClientAppointmentStatus,
  ClientManagementAction,
  UpsertClientPayload,
} from '../types';

const DEFAULT_EMAIL_PLACEHOLDER = 'cliente@ejemplo.com';
const DEFAULT_PHONE_PLACEHOLDER = '+52 55 1234 5678';
const SYNTHETIC_EMAIL_SUFFIX = '@clientes.slotify.app';

export function sanitizeClientEmail(rawEmail?: string | null): string {
  if (!rawEmail) return '';
  const trimmed = String(rawEmail).trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === DEFAULT_EMAIL_PLACEHOLDER ||
    lower.endsWith(SYNTHETIC_EMAIL_SUFFIX)
  ) {
    return '';
  }
  return trimmed;
}

export function sanitizeClientPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const trimmed = String(rawPhone).trim();
  if (trimmed === DEFAULT_PHONE_PLACEHOLDER) {
    return '';
  }
  return trimmed;
}

function normalizeAppointmentStatus(rawStatus?: string): ClientAppointmentStatus {
  const s = (rawStatus ?? 'confirmed').toLowerCase();
  if (s === 'completed' || s === 'completada') return 'completed';
  if (s === 'cancelled' || s === 'cancelada') return 'cancelled';
  if (s === 'pending' || s === 'pendiente') return 'pending';
  if (s === 'no_show') return 'no_show';
  return 'confirmed';
}

function mapRawAppointment(raw: any): ClientAppointmentItem {
  return {
    id: String(raw?.id ?? raw?.Id ?? `apt-${Date.now()}`),
    startTime: String(raw?.startTime ?? raw?.StartTime ?? new Date().toISOString()),
    endTime: String(raw?.endTime ?? raw?.EndTime ?? new Date().toISOString()),
    status: normalizeAppointmentStatus(raw?.status ?? raw?.Status),
    agreedTotal: Number(raw?.agreedTotal ?? raw?.AgreedTotal ?? 0),
    title: raw?.title ?? raw?.Title ?? 'Servicio agendado',
    employeeName: raw?.employeeName ?? raw?.EmployeeName,
  };
}

export function mapRawBusinessClient(raw: any): BusinessClient {
  const fullName = String(raw?.fullName ?? raw?.FullName ?? 'Cliente').trim();
  const parts = fullName.split(/\s+/);
  const firstName = String(raw?.firstName ?? raw?.FirstName ?? parts[0] ?? 'Cliente').trim();
  const lastName = String(
    raw?.lastName ?? raw?.LastName ?? (parts.length > 1 ? parts.slice(1).join(' ') : '')
  ).trim();

  const appointmentsRaw = Array.isArray(raw?.appointments ?? raw?.Appointments)
    ? (raw.appointments ?? raw.Appointments)
    : [];

  const rawNotes = raw?.notes ?? raw?.Notes;

  return {
    id: String(raw?.id ?? raw?.Id ?? `client-${fullName.toLowerCase()}`),
    clientId: raw?.clientId ?? raw?.ClientId ?? null,
    isRegistered: raw?.isRegistered ?? raw?.IsRegistered ?? false,
    archivedAt: raw?.archivedAt ?? raw?.ArchivedAt ?? null,
    fullName,
    firstName,
    lastName,
    email: sanitizeClientEmail(raw?.email ?? raw?.Email),
    phone: sanitizeClientPhone(raw?.phone ?? raw?.Phone),
    totalVisits: Number(raw?.totalVisits ?? raw?.TotalVisits ?? 0),
    completedVisits: Number(raw?.completedVisits ?? raw?.CompletedVisits ?? 0),
    cancelledVisits: Number(raw?.cancelledVisits ?? raw?.CancelledVisits ?? 0),
    totalSpent: Number(raw?.totalSpent ?? raw?.TotalSpent ?? 0),
    lastVisitAt: raw?.lastVisitAt ?? raw?.LastVisitAt ?? null,
    nextVisitAt: raw?.nextVisitAt ?? raw?.NextVisitAt ?? null,
    createdAt: String(raw?.createdAt ?? raw?.CreatedAt ?? new Date().toISOString()),
    notes: typeof rawNotes === 'string' ? rawNotes : undefined,
    appointments: appointmentsRaw.map(mapRawAppointment),
  };
}

export function extractClientApiError(err: any, fallbackMessage: string): string {
  const data = err?.response?.data;
  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    return data.error.trim();
  }
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return String(data.errors[0]);
  }
  if (typeof data?.message === 'string' && data.message.trim().length > 0) {
    return data.message.trim();
  }
  if (typeof err?.message === 'string' && err.message.trim().length > 0) {
    return err.message.trim();
  }
  return fallbackMessage;
}

/**
 * Obtiene la cartera de clientes del negocio autenticado desde GET /api/clients.
 */
export async function fetchBusinessClients(search?: string, includeArchived = false): Promise<BusinessClient[]> {
  const trimmedSearch = search?.trim();
  const response = await apiClient.get<any>(API_ENDPOINTS.CLIENTS.GET_ALL, {
    params: {
      search: trimmedSearch || undefined,
      includeArchived: includeArchived || undefined,
    },
  });
  const body = response?.data ?? response;
  const list = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body?.Data)
    ? body.Data
    : Array.isArray(body)
    ? body
    : [];

  return list.map(mapRawBusinessClient);
}

export interface ClientOption {
  id: string;
  fullName: string;
  phone?: string | null;
  email: string;
}

export async function searchClientOptions(search: string, signal: AbortSignal): Promise<ClientOption[]> {
  const { data } = await apiClient.get<{ data: ClientOption[] }>(API_ENDPOINTS.CLIENTS.OPTIONS, {
    params: { search },
    signal,
  });
  return data.data;
}

export async function manageBusinessClient(
  client: BusinessClient,
  action: ClientManagementAction,
): Promise<BusinessClient | null> {
  const cardId = client.isRegistered ? client.clientId : null;
  try {
    if (action === 'archive') {
      const appointmentId = cardId ? null : client.appointments[0]?.id;
      if (!cardId && !appointmentId) {
        throw new Error('Actualiza la cartera para encontrar la ficha del cliente.');
      }
      const response = await apiClient.post(API_ENDPOINTS.CLIENTS.ARCHIVE, {
        clientId: cardId,
        appointmentId,
      });
      return parseManagedClient(response.data);
    }

    if (!cardId) {
      throw new Error('Actualiza la cartera para encontrar la ficha del cliente.');
    }
    if (action === 'delete') {
      const response = await apiClient.delete(API_ENDPOINTS.CLIENTS.UPDATE(cardId));
      if (response.data?.success !== true) {
        throw new Error('El servidor no confirmó la eliminación de la ficha.');
      }
      return null;
    }

    const response = await apiClient.post(API_ENDPOINTS.CLIENTS.RESTORE(cardId));
    return parseManagedClient(response.data);
  } catch (err: unknown) {
    throw new Error(extractClientApiError(err, 'No se pudo actualizar la ficha del cliente.'));
  }
}

export async function saveBusinessClientNote(client: BusinessClient, note: string): Promise<BusinessClient> {
  const clientId = client.isRegistered ? client.clientId : null;
  const appointmentId = clientId ? null : client.appointments[0]?.id;
  if (!clientId && !appointmentId) {
    throw new Error('Actualiza la cartera para encontrar la ficha del cliente.');
  }

  try {
    const response = await apiClient.patch(API_ENDPOINTS.CLIENTS.NOTE, { clientId, appointmentId, note });
    return parseManagedClient(response.data);
  } catch (err: unknown) {
    throw new Error(extractClientApiError(err, 'No se pudo guardar la nota en el servidor.'));
  }
}

function parseManagedClient(body: { success?: boolean; data?: { id?: string } }): BusinessClient {
  if (body?.success !== true || !body.data?.id) {
    throw new Error('El servidor no confirmó el cambio en la ficha.');
  }
  return mapRawBusinessClient(body.data);
}

/**
 * Registra o actualiza los datos de contacto y notas de un cliente en la cartera del negocio.
 * Propaga cualquier error del servidor para que la UI no muestre falsos positivos.
 */
export async function upsertBusinessClient(payload: UpsertClientPayload): Promise<BusinessClient> {
  const body: Record<string, unknown> = {
    clientId: payload.clientId || null,
    firstName: payload.firstName.trim(),
    lastName: (payload.lastName ?? '').trim(),
    email: sanitizeClientEmail(payload.email),
    phone: sanitizeClientPhone(payload.phone),
  };

  if (payload.notes !== undefined) {
    body.notes = payload.notes.trim();
  }

  const isUuid =
    typeof payload.clientId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.clientId);

  try {
    const response = isUuid
      ? await apiClient.put<any>(API_ENDPOINTS.CLIENTS.UPDATE(payload.clientId!), body)
      : await apiClient.post<any>(API_ENDPOINTS.CLIENTS.UPSERT, body);

    const responseBody = response?.data ?? response;
    if (responseBody && responseBody.success === false) {
      throw new Error(
        responseBody.error ||
          (Array.isArray(responseBody.errors) ? responseBody.errors[0] : null) ||
          responseBody.message ||
          'El servidor rechazó el guardado del cliente.'
      );
    }

    const data = responseBody?.data ?? responseBody?.Data ?? responseBody;
    return mapRawBusinessClient(data);
  } catch (err: any) {
    throw new Error(
      extractClientApiError(err, 'No se pudo guardar el cliente en el servidor.')
    );
  }
}
