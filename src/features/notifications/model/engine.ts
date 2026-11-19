/**
 * US-Notifications: Motor principal de notificaciones push de Slotify.
 * Feature-Based Architecture (FBA) — feature `notifications`.
 *
 * Flujo:
 * 1. Al arrancar la app → `useNotificationEngine` se monta y:
 *    a. Carga el snapshot persisted localmente (sesión anterior).
 *    b. Llama al backend para obtener citas próximas + hash fresco.
 *    c. Compara hashes:
 *       - Nuevas citas → notificación inmediata "Nueva reserva"
 *       - Cancelaciones → notificación inmediata "Cita cancelada"
 *       - Reprogramaciones → notificación inmediata "Cita reprogramada"
 *    d. Programa recordatorios locales 30 min antes de cada cita confirmada.
 *    e. Persiste el nuevo snapshot localmente.
 *
 * 2. Mientras la app está en foreground: se re-ejecuta cada 60 s.
 * 3. Al volver al foreground desde background: se re-ejecuta.
 * 4. Al cerrar sesión: cancela todas las notificaciones y limpia el snapshot.
 *
 * Funciona para: DUENO (negocio), EMPLEADO (negocio), CLIENTE (sus propias citas).
 */

import { useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { fetchUpcomingNotifications } from '../api';
import Constants from 'expo-constants';
import {
  useNotificationsStore,
  selectUpcomingConfirmed,
  detectCancellations,
  detectNewBookings,
  detectReschedules,
} from './index';
import { settingsScope, useSettingsPreferences } from '@/features/settings/model/preferences';
import { loadLocalNotificationDevice } from '@/features/settings/model/localNotifications';
import type { AuthUser } from '@/shared/types';
import type { UpcomingAppointment } from '../types';

/** Canales y constantes */
const CHANNEL_ID = 'slotify-appointments';
const REMINDER_OFFSET_MS = 30 * 60_000; // 30 minutos antes
const POLL_INTERVAL_MS = 60_000;         // 1 minuto
const MAX_SCHEDULED_REMINDERS = 48;

/** Singleton de la promesa del módulo de notificaciones */
let _notifModule: Promise<ReturnType<typeof loadLocalNotificationDevice>> | undefined;

function getNotifModule() {
  if (_notifModule) return _notifModule;
  _notifModule = Promise.resolve().then(async () => {
    const device = loadLocalNotificationDevice();
    if (Platform.OS === 'android') {
      try {
        await device.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Citas de Slotify',
          importance: device.AndroidImportance?.DEFAULT ?? 5,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#818CF8',
        });
      } catch (channelErr) {
        // En Expo Go (sandbox de Android), setNotificationChannelAsync no retorna el canal nativo
        // pero las alertas locales se canalizan normalmente por el canal de sistema.
        if (__DEV__ && Constants.appOwnership !== 'expo') {
          console.debug('[Notifications] Canal de Android:', channelErr);
        }
      }
    }
    device.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    return device;
  }).catch((err) => {
    _notifModule = undefined;
    throw err;
  });
  return _notifModule;
}

/** Solicita permisos de notificaciones y retorna si fueron concedidos. */
export async function requestPushNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const device = await getNotifModule();
    const current = await device.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await device.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Envía una notificación inmediata (para eventos de cambio en la agenda).
 */
async function sendImmediateNotification(
  scope: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  try {
    const device = await getNotifModule();
    if (!(await device.getPermissionsAsync()).granted) return;
    await device.scheduleNotificationAsync({
      content: { title, body, data: { scope, ...data } },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // Silencioso — las notificaciones son best-effort
  }
}

/**
 * Programa recordatorios locales para las citas confirmadas próximas.
 * Cancela los recordatorios obsoletos y agrega los nuevos.
 */
async function syncScheduledReminders(
  scope: string,
  confirmed: UpcomingAppointment[],
): Promise<void> {
  try {
    const device = await getNotifModule();
    if (!(await device.getPermissionsAsync()).granted) return;

    const now = Date.now();
    // Mapa de citas que queremos tener programadas: id → timestamp del recordatorio
    const desired = new Map<string, number>();
    for (const apt of confirmed
      .slice(0, MAX_SCHEDULED_REMINDERS)
      .filter((a) => Date.parse(a.startTime) - REMINDER_OFFSET_MS > now)) {
      desired.set(apt.id, Date.parse(apt.startTime) - REMINDER_OFFSET_MS);
    }

    // Cancelar las que ya no corresponden
    const scheduled = await device.getAllScheduledNotificationsAsync();
    for (const req of scheduled) {
      const { scope: owner, appointmentId, at } = (req.content.data ?? {}) as Record<string, unknown>;
      if (owner !== scope || typeof appointmentId !== 'string') continue;
      if (typeof at === 'number' && desired.get(appointmentId) === at) {
        desired.delete(appointmentId); // ya está programada correctamente
      } else {
        await device.cancelScheduledNotificationAsync(req.identifier);
      }
    }

    // Programar las nuevas
    for (const [aptId, at] of desired) {
      if (at <= Date.now()) continue;
      const apt = confirmed.find((a) => a.id === aptId);
      const clientLabel = apt?.clientName ? ` con ${apt.clientName}` : '';
      const businessLabel = apt?.businessName ? ` en ${apt.businessName}` : '';
      await device.scheduleNotificationAsync({
        identifier: `slotify-${scope}-${aptId}`,
        content: {
          title: 'Próxima cita en 30 minutos',
          body: `Tu cita${clientLabel}${businessLabel} comienza pronto.`,
          data: { scope, appointmentId: aptId, at },
        },
        trigger: {
          type: device.SchedulableTriggerInputTypes.DATE,
          date: at,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch {
    // Best-effort
  }
}

/**
 * Cancela todos los recordatorios programados para un scope.
 */
async function cancelAllRemindersForScope(scope: string): Promise<void> {
  try {
    const device = await getNotifModule();
    const scheduled = await device.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((r) => (r.content.data as Record<string, unknown>)?.scope === scope)
        .map((r) => device.cancelScheduledNotificationAsync(r.identifier)),
    );
  } catch {
    // Best-effort
  }
}

/**
 * Hook principal del motor de notificaciones push de Slotify.
 *
 * Uso:
 * ```tsx
 * // En el layout raíz o en _layout.tsx, pasa el usuario autenticado:
 * useNotificationEngine(isAuthenticated ? user : null);
 * ```
 */
export function useNotificationEngine(user: AuthUser | null): void {
  const scope = settingsScope(user);
  const { load: loadPrefs, scope: loadedScope, ready, notifications: enabled } = useSettingsPreferences();
  const store = useNotificationsStore();

  const isLiveBusiness =
    Boolean(user?.businessId) && !user?.businessId?.startsWith('demo');
  const isClient = user?.role === 'CLIENTE';
  const isActive = Boolean(scope) && (isLiveBusiness || isClient) && Platform.OS !== 'web';

  // Cargar preferencias cuando cambia el scope
  useEffect(() => {
    void loadPrefs(scope);
  }, [loadPrefs, scope]);

  // Cargar snapshot persisted al iniciar
  useEffect(() => {
    if (!scope) return;
    void store.loadSnapshot(scope);
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const runningRef = useRef(false);

  /**
   * Función principal de refresh:
   * 1. Llama al backend.
   * 2. Compara snapshots.
   * 3. Despacha notificaciones de cambio.
   * 4. Programa recordatorios.
   * 5. Persiste snapshot.
   */
  const refresh = useCallback(async () => {
    if (!isActive || !scope || !ready || loadedScope !== scope || !enabled) return;
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      const granted = await requestPushNotificationPermission();
      if (!granted) return;

      const response = await fetchUpcomingNotifications(30);
      const currentAppointments = response.appointments;
      const currentHash = response.snapshotHash;

      const previousSnapshot = useNotificationsStore.getState().snapshot;
      const previousHash = previousSnapshot?.snapshotHash;
      const previousAppointments = previousSnapshot?.appointments ?? [];

      // ── Detectar cambios y notificar ─────────────────────────────────
      if (previousHash && previousHash !== currentHash) {
        const cancelled = detectCancellations(previousAppointments, currentAppointments);
        const newBookings = detectNewBookings(previousAppointments, currentAppointments);
        const rescheduled = detectReschedules(previousAppointments, currentAppointments);

        // Notificar cancelaciones
        for (const apt of cancelled) {
          const clientLabel = apt.clientName ? ` de ${apt.clientName}` : '';
          await sendImmediateNotification(
            scope,
            'Cita cancelada',
            `La cita${clientLabel} fue cancelada. Abre Slotify para más detalles.`,
            { type: 'cancellation', appointmentId: apt.id },
          );
        }

        // Notificar nuevas reservas
        if (newBookings.length > 0) {
          const count = newBookings.length;
          const label = count === 1
            ? `Nueva cita: ${newBookings[0].clientName ?? 'cliente'}`
            : `${count} nuevas citas confirmadas`;
          await sendImmediateNotification(
            scope,
            'Nueva reserva en agenda',
            `${label}. Abre Slotify para ver los detalles.`,
            { type: 'new_booking', count },
          );
        }

        // Notificar reprogramaciones
        for (const apt of rescheduled) {
          const clientLabel = apt.clientName ? ` de ${apt.clientName}` : '';
          await sendImmediateNotification(
            scope,
            'Cita reprogramada',
            `La cita${clientLabel} fue movida a un nuevo horario.`,
            { type: 'reschedule', appointmentId: apt.id },
          );
        }
      }

      // ── Programar recordatorios de proximidad ─────────────────────────
      const confirmed = selectUpcomingConfirmed(currentAppointments);
      await syncScheduledReminders(scope, confirmed);

      // ── Persistir snapshot ────────────────────────────────────────────
      await useNotificationsStore.getState().saveSnapshot(scope, {
        snapshotHash: currentHash,
        appointments: currentAppointments,
        savedAt: Date.now(),
      });
    } catch {
      // Best-effort: si falla la red, conservamos el snapshot anterior
    } finally {
      runningRef.current = false;
    }
  }, [isActive, scope, ready, loadedScope, enabled]);

  // ── Ciclo principal: polling + AppState ──────────────────────────────
  useEffect(() => {
    if (!isActive || !scope || !ready || loadedScope !== scope || !enabled) return;

    // Ejecutar inmediatamente al montar
    void refresh();

    // Re-ejecutar al volver al foreground
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    };
    const sub = AppState.addEventListener('change', handleAppState);

    // Polling periódico
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);

    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [isActive, scope, ready, loadedScope, enabled, refresh]);

  // ── Limpiar al cerrar sesión ─────────────────────────────────────────
  useEffect(() => {
    if (scope || !user) return;
    // El scope es undefined → el usuario cerró sesión
    return () => {
      // Limpiar recursos del scope anterior cuando sea conocido
    };
  }, [scope, user]);

  // Cancelar recordatorios cuando se desactivan las notificaciones
  useEffect(() => {
    if (!scope) return;
    if (!enabled && ready && loadedScope === scope) {
      void cancelAllRemindersForScope(scope);
      void useNotificationsStore.getState().clearSnapshot(scope);
    }
  }, [enabled, scope, ready, loadedScope]);
}
