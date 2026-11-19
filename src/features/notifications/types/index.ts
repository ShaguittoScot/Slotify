/**
 * US-Notifications: Tipos del motor de notificaciones push de Slotify.
 * Feature-Based Architecture (FBA) — capa de tipos de la feature `notifications`.
 */

/** Una cita próxima devuelta por el backend para el motor de notificaciones. */
export interface UpcomingAppointment {
  id: string;
  startTime: string; // ISO 8601 UTC
  endTime: string;   // ISO 8601 UTC
  clientName?: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  employeeName?: string;
  businessName?: string;
  agreedTotal?: number;
}

/** Respuesta completa del endpoint /api/notifications/upcoming */
export interface UpcomingNotificationsResponse {
  appointments: UpcomingAppointment[];
  /** Hash SHA-256 del snapshot de citas: cambia si hay nueva cita, cancelación o reprogramación. */
  snapshotHash: string;
  generatedAt: string; // ISO 8601 UTC
  horizonDays: number;
}

/** Snapshot persistido localmente para comparación entre sesiones/refreshes. */
export interface NotificationSnapshot {
  snapshotHash: string;
  appointments: UpcomingAppointment[];
  savedAt: number; // Date.now()
}

/** Tipos de evento que pueden originar una notificación. */
export type NotificationEventType =
  | 'reminder'      // Recordatorio 30 min antes de una cita
  | 'new_booking'   // Nueva cita confirmada detectada
  | 'cancellation'  // Cita cancelada
  | 'reschedule'    // Cita reprogramada (mismo id, distinto startTime)
  | 'upcoming_check'; // Verificación periódica interna
