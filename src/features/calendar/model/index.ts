/**
 * US-003: Calendar — Model/Store Layer (ViewModel)
 *
 * Estado reactivo para el calendario multiformato táctil.
 * Maneja la vista activa (día/semana/mes), fechas seleccionadas,
 * aislamiento por sesión/negocio y la sincronización con el backend .NET (Slotify_back).
 */

import { create } from 'zustand';
import type { CalendarSlot, CalendarViewMode } from '@/shared/types';
import { fetchCalendarSlots } from '../api';
import { useAuthStore } from '@/features/auth/model';
import { calendarRange, DEFAULT_BUSINESS_TIME_ZONE, resolveBusinessTimeZone, toBusinessClock } from './businessTime';

export interface AppointmentClient {
  businessClientId?: string;
  fullName: string;
  phone?: string | null;
  email?: string;
}

export function getCalendarAmount(slot: Pick<CalendarSlot, 'agreedTotal' | 'servicePrice'>): number | undefined {
  if (typeof slot.agreedTotal === 'number' && Number.isFinite(slot.agreedTotal)) {
    return slot.agreedTotal;
  }
  const legacyAmount = parseFloat(slot.servicePrice?.replace(/[^0-9.]/g, '') ?? '');
  return Number.isFinite(legacyAmount) ? legacyAmount : undefined;
}

export function resolveSessionScopeKey(user?: {
  id?: string;
  businessId?: string;
  email?: string;
} | null): string {
  if (!user) return 'anonymous';
  const uid = (user.id ?? user.email ?? 'user').trim();
  const biz = (user.businessId ?? 'no-business').trim();
  return `${uid}:${biz}`;
}

interface CalendarState {
  /** Modo de vista actual: 'day' | 'week' | 'month' */
  viewMode: CalendarViewMode;

  /** Fecha seleccionada actualmente */
  selectedDate: Date;
  timeZone: string | null;
  appointmentDraft: { scopeKey: string; client: AppointmentClient } | null;
  prepareAppointment: (draft: { scopeKey: string; client: AppointmentClient } | null) => void;

  /** Slots cargados del backend para el rango visible */
  slots: CalendarSlot[];

  /** Si se están cargando los slots */
  isLoading: boolean;

  /** Error de carga */
  error: string | null;

  /** Alcance actual de sesión y negocio */
  currentScopeKey: string;

  /** Contador monotónico de petición para descartar respuestas tardías al cambiar de cuenta */
  requestId: number;

  // ── Acciones ──────────────────────────────────────────
  /** Cambia el modo de visualización (Día / Semana / Mes) */
  setViewMode: (mode: CalendarViewMode) => void;

  /** Navega a una fecha específica */
  setSelectedDate: (date: Date) => void;

  /** Navega a la fecha actual ("Hoy") */
  goToToday: () => void;

  /** Navega al siguiente período según la vista activa */
  navigateForward: () => void;

  /** Navega al período anterior según la vista activa */
  navigateBackward: () => void;

  /** Carga los slots del backend para el período y sesión activos */
  loadSlots: (scopeKey?: string) => Promise<void>;

  /** Establece los slots manualmente */
  setSlots: (slots: CalendarSlot[]) => void;

  /** Reinicia el estado de la agenda al cerrar sesión o cambiar de cuenta */
  resetCalendarState: () => void;

  // ── Acciones de Administrador ──────────────────────────
  /** Actualiza el estado de un slot (ej. 'confirmed' | 'cancelled' | 'completed' | 'pending') */
  updateSlotStatus: (resourceId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'pending') => void;

  /** Agrega un nuevo slot confirmado por el servidor */
  addSlot: (slot: CalendarSlot) => void;

  /** Elimina un slot de la agenda (desbloquear horario o eliminar cita) */
  removeSlot: (resourceId: string) => void;

  /** Reprograma el horario de una cita existente */
  rescheduleSlot: (resourceId: string, newStartTime: string, newEndTime: string) => void;
}

function calendarMonthWithNeighbors(date: Date, timeZone: string) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  // La semana y la cuadrícula mensual pueden mostrar días de los meses vecinos.
  return calendarRange(new Date(Date.UTC(year, month, -6)), new Date(Date.UTC(year, month + 1, 8)), timeZone);
}

function moveDate(date: Date, mode: CalendarViewMode, direction: number): Date {
  const next = new Date(date);
  if (mode === 'month') {
    const day = next.getUTCDate();
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + direction);
    const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
    next.setUTCDate(Math.min(day, lastDay));
  } else {
    next.setUTCDate(next.getUTCDate() + direction * (mode === 'week' ? 7 : 1));
  }
  return next;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  viewMode: 'day',
  selectedDate: toBusinessClock(Date.now(), DEFAULT_BUSINESS_TIME_ZONE),
  timeZone: null,
  appointmentDraft: null,
  prepareAppointment: (appointmentDraft) => set({ appointmentDraft }),
  slots: [],
  isLoading: false,
  error: null,
  currentScopeKey: 'default',
  requestId: 0,

  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (get().slots.length === 0) {
      get().loadSlots();
    }
  },

  setSelectedDate: (date) => {
    const prev = get().selectedDate;
    const sameMonth = prev.getUTCFullYear() === date.getUTCFullYear() && prev.getUTCMonth() === date.getUTCMonth();
    set({ selectedDate: date });
    if (!sameMonth || get().slots.length === 0) {
      get().loadSlots();
    }
  },

  goToToday: () => get().setSelectedDate(toBusinessClock(Date.now(), get().timeZone ?? DEFAULT_BUSINESS_TIME_ZONE)),

  navigateForward: () => get().setSelectedDate(moveDate(get().selectedDate, get().viewMode, 1)),

  navigateBackward: () => get().setSelectedDate(moveDate(get().selectedDate, get().viewMode, -1)),

  loadSlots: async (explicitScopeKey) => {
    const authUser = useAuthStore.getState().user;
    const cleanScope =
      explicitScopeKey ||
      (authUser ? resolveSessionScopeKey(authUser) : get().currentScopeKey || 'default');

    const scopeChanged = get().currentScopeKey !== cleanScope;
    const nextRequestId = get().requestId + 1;

    if (scopeChanged) {
      set({
        currentScopeKey: cleanScope,
        timeZone: null,
        selectedDate: toBusinessClock(Date.now(), DEFAULT_BUSINESS_TIME_ZONE),
        appointmentDraft: get().appointmentDraft?.scopeKey === cleanScope ? get().appointmentDraft : null,
        requestId: nextRequestId,
        slots: [],
        isLoading: true,
        error: null,
      });
    } else {
      set({
        currentScopeKey: cleanScope,
        requestId: nextRequestId,
        isLoading: get().slots.length === 0,
        error: null,
      });
    }

    const { selectedDate, timeZone } = get();
    try {
      const { startDate, endDate } = calendarMonthWithNeighbors(selectedDate, timeZone ?? DEFAULT_BUSINESS_TIME_ZONE);
      const response = await fetchCalendarSlots(startDate, endDate, undefined, cleanScope);

      // Ignorar respuestas tardías si la sesión/negocio cambió mientras estaba en vuelo
      if (get().currentScopeKey !== cleanScope || get().requestId !== nextRequestId) {
        return;
      }

      const businessTimeZone = resolveBusinessTimeZone(response.timeZone ?? timeZone);
      set((state) => ({
        slots: response.slots,
        timeZone: businessTimeZone,
        selectedDate: !timeZone && state.selectedDate === selectedDate
          ? toBusinessClock(Date.now(), businessTimeZone)
          : state.selectedDate,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      if (get().currentScopeKey !== cleanScope || get().requestId !== nextRequestId) {
        return;
      }

      set({ error: err.message || 'Error al cargar slots del calendario', isLoading: false });
    }
  },

  setSlots: (slots) => set({ slots, isLoading: false }),

  resetCalendarState: () =>
    set((state) => ({
      slots: [],
      isLoading: false,
      error: null,
      currentScopeKey: 'default',
      timeZone: null,
      appointmentDraft: null,
      selectedDate: toBusinessClock(Date.now(), DEFAULT_BUSINESS_TIME_ZONE),
      requestId: state.requestId + 1,
    })),

  updateSlotStatus: (resourceId, status) => {
    set((state) => ({
      requestId: state.requestId + 1,
      isLoading: false,
      slots: state.slots.map((s) => (s.resourceId === resourceId ? { ...s, status } : s)),
    }));
  },

  addSlot: (slot) => {
    set((state) => ({
      requestId: state.requestId + 1,
      isLoading: false,
      slots: [
        ...state.slots.filter((s) => s.resourceId !== slot.resourceId),
        slot,
      ],
    }));
  },

  removeSlot: (resourceId) => {
    set((state) => ({
      requestId: state.requestId + 1,
      isLoading: false,
      slots: state.slots.filter((s) => s.resourceId !== resourceId),
    }));
  },

  rescheduleSlot: (resourceId, newStartTime, newEndTime) => {
    set((state) => ({
      requestId: state.requestId + 1,
      isLoading: false,
      slots: state.slots.map((s) =>
        s.resourceId === resourceId ? { ...s, startTime: newStartTime, endTime: newEndTime } : s
      ),
    }));
  },
}));

if (typeof useAuthStore?.subscribe === 'function') {
  let previousScope = resolveSessionScopeKey(useAuthStore.getState()?.user);
  useAuthStore.subscribe((state) => {
    const nextScope = resolveSessionScopeKey(state.user);
    if (nextScope !== previousScope) {
      previousScope = nextScope;
      useCalendarStore.setState((cal) => ({
        slots: [],
        isLoading: false,
        error: null,
        currentScopeKey: nextScope,
        timeZone: null,
        appointmentDraft: null,
        selectedDate: toBusinessClock(Date.now(), DEFAULT_BUSINESS_TIME_ZONE),
        requestId: cal.requestId + 1,
      }));
    }
  });
}
