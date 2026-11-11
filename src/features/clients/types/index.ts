/**
 * US-026: Construcción de módulo de clientes — Tipos de Dominio Frontend
 * Relacionado con: SCRUM-114 (Cartera de Clientes e Historial de Citas)
 */

export type ClientAppointmentStatus =
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'no_show';

export interface ClientAppointmentItem {
  id: string;
  startTime: string;
  endTime: string;
  status: ClientAppointmentStatus;
  agreedTotal: number;
  title?: string;
  employeeName?: string;
}

export interface BusinessClient {
  id: string;
  clientId?: string | null;
  isRegistered?: boolean;
  archivedAt?: string | null;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  totalSpent: number;
  lastVisitAt?: string | null;
  nextVisitAt?: string | null;
  createdAt: string;
  notes?: string;
  appointments: ClientAppointmentItem[];
}

export type ClientFilterSegment = 'all' | 'upcoming' | 'frequent' | 'new' | 'archived';

export type ClientManagementAction = 'archive' | 'restore' | 'delete';

export interface UpsertClientPayload {
  clientId?: string | null;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

