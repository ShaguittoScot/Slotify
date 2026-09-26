/**
 * Slotify Global Types
 */

/** Standard API response wrapper matching backend Result<T> */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  errors: string[];
}

/** Paginated response */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** Auth tokens */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// ────────────────────────────────────────────────────────────
// US-000: Registro y Autenticación de Administrador
// ────────────────────────────────────────────────────────────

/** Datos del usuario autenticado (subconjunto seguro, sin passwordHash) */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: 'DUENO' | 'EMPLEADO' | 'CLIENTE';
  businessId?: string;
  businessName?: string;
}

/** Respuesta de login/register del backend */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}

/** Payload para registrar admin (US-000) */
export interface RegisterAdminPayload {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
  businessPhone?: string;
  sectorTemplateId?: number;
}

/** Payload para login (US-000) */
export interface LoginPayload {
  email: string;
  password: string;
}

// ────────────────────────────────────────────────────────────
// US-006: Selector de Giro Comercial / US-002: Plantillas
// ────────────────────────────────────────────────────────────

/** Servicio sugerido dentro de una plantilla de sector */
export interface SuggestedService {
  name: string;
  durationMinutes: number;
  price?: number;
}

/** Plantilla de sector / giro comercial (de seed data) */
export interface SectorTemplate {
  id: number;
  name: string;
  defaultModules: string[];
  suggestedServices: SuggestedService[];
}

// ────────────────────────────────────────────────────────────
// US-003: Navegación Multiformato en Calendario Táctil
// ────────────────────────────────────────────────────────────

/** Modos de visualización del calendario */
export type CalendarViewMode = 'day' | 'week' | 'month';

/** Slot unificado del calendario (cita, bloqueo, o disponibilidad) */
export interface CalendarSlot {
  type: 'appointment' | 'block' | 'available';
  resourceId: string;
  startTime: string;
  endTime: string;
  title: string;
  status: 'confirmed' | 'cancelled' | 'blocked' | 'available' | 'completed' | 'pending';
  clientName?: string;
  clientPhone?: string;
  servicePrice?: string;
  notes?: string;
  employeeName?: string;
  blockReason?: string;
}

/** Respuesta completa del calendario para un rango */
export interface CalendarResponse {
  rangeStart: string;
  rangeEnd: string;
  slots: CalendarSlot[];
}

// ────────────────────────────────────────────────────────────
// US-008: Bloqueo Manual de Horarios No Disponibles
// ────────────────────────────────────────────────────────────

/** Payload para crear un bloqueo de agenda */
export interface CreateScheduleBlockPayload {
  employeeId?: string;
  startDateTime: string;
  endDateTime: string;
  reason?: string;
}

/** Bloqueo de agenda retornado por el backend */
export interface ScheduleBlock {
  id: number;
  businessId: string;
  employeeId?: string;
  startDateTime: string;
  endDateTime: string;
  reason?: string;
}
