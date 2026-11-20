/**
 * US-Notifications: Model — Zustand store del motor de notificaciones push.
 * Feature-Based Architecture (FBA) — feature `notifications`.
 *
 * Responsabilidades:
 * - Almacena el snapshot más reciente de citas próximas.
 * - Registra el hash anterior para detectar cambios.
 * - Persiste localmente entre sesiones (AsyncStorage).
 * - Expone acciones para actualizar y limpiar el snapshot.
 */

import { create } from 'zustand';
import { storage } from '@/shared/lib/storage';
import type { NotificationSnapshot, UpcomingAppointment } from '../types';

const SNAPSHOT_KEY = 'slotify_notification_snapshot';

interface NotificationsState {
  /** Snapshot actual en memoria. */
  snapshot: NotificationSnapshot | null;
  /** Hash del snapshot previo (antes del último refresh). */
  previousHash: string | null;
  /** Indica si se está realizando un refresh. */
  isRefreshing: boolean;

  // Acciones
  loadSnapshot: (scope: string) => Promise<void>;
  saveSnapshot: (scope: string, snap: NotificationSnapshot) => Promise<void>;
  clearSnapshot: (scope: string) => Promise<void>;
  setRefreshing: (val: boolean) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  snapshot: null,
  previousHash: null,
  isRefreshing: false,

  loadSnapshot: async (scope: string) => {
    const key = `${SNAPSHOT_KEY}_${scope}`;
    const saved = await storage.get<NotificationSnapshot>(key);
    if (saved) {
      set({ snapshot: saved, previousHash: saved.snapshotHash });
    }
  },

  saveSnapshot: async (scope: string, snap: NotificationSnapshot) => {
    const key = `${SNAPSHOT_KEY}_${scope}`;
    const prev = get().snapshot?.snapshotHash ?? null;
    set({ snapshot: snap, previousHash: prev });
    await storage.set(key, snap);
  },

  clearSnapshot: async (scope: string) => {
    const key = `${SNAPSHOT_KEY}_${scope}`;
    set({ snapshot: null, previousHash: null });
    await storage.remove(key);
  },

  setRefreshing: (val: boolean) => set({ isRefreshing: val }),
}));

/** Extrae el snapshot de citas relevantes para reminder scheduling.
 *  Retorna solo citas confirmadas que aún están en el futuro. */
export function selectUpcomingConfirmed(
  appointments: UpcomingAppointment[],
  now = Date.now(),
): UpcomingAppointment[] {
  return appointments
    .filter((a) => a.status === 'confirmed' && Date.parse(a.startTime) > now)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

/** Detecta qué citas fueron canceladas comparando dos snapshots. */
export function detectCancellations(
  previous: UpcomingAppointment[],
  current: UpcomingAppointment[],
): UpcomingAppointment[] {
  const prevMap = new Map(previous.map((a) => [a.id, a]));
  return current.filter(
    (a) => a.status === 'cancelled' && prevMap.get(a.id)?.status === 'confirmed',
  );
}

/** Detecta citas nuevas (confirmadas que no existían en el snapshot previo). */
export function detectNewBookings(
  previous: UpcomingAppointment[],
  current: UpcomingAppointment[],
): UpcomingAppointment[] {
  const prevIds = new Set(previous.map((a) => a.id));
  return current.filter((a) => a.status === 'confirmed' && !prevIds.has(a.id));
}

/** Detecta citas reprogramadas (mismo id, distinto startTime). */
export function detectReschedules(
  previous: UpcomingAppointment[],
  current: UpcomingAppointment[],
): UpcomingAppointment[] {
  const prevMap = new Map(previous.map((a) => [a.id, a]));
  return current.filter((a) => {
    const prev = prevMap.get(a.id);
    return prev && a.status === 'confirmed' && prev.startTime !== a.startTime;
  });
}
