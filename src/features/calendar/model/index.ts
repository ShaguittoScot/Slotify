/**
 * US-003: Calendar — Model/Store Layer (ViewModel)
 *
 * Estado reactivo para el calendario multiformato táctil.
 * Maneja la vista activa (día/semana/mes), fechas seleccionadas,
 * y la sincronización con el backend .NET (Slotify_back).
 */

import { create } from 'zustand';
import type { CalendarSlot, CalendarViewMode } from '@/shared/types';
import { fetchCalendarSlots } from '../api';

interface CalendarState {
  /** Modo de vista actual: 'day' | 'week' | 'month' */
  viewMode: CalendarViewMode;

  /** Fecha seleccionada actualmente */
  selectedDate: Date;

  /** Slots cargados del backend para el rango visible */
  slots: CalendarSlot[];

  /** Si se están cargando los slots */
  isLoading: boolean;

  /** Error de carga */
  error: string | null;

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

  /** Carga los slots del backend para el período activo */
  loadSlots: () => Promise<void>;

  /** Establece los slots manualmente */
  setSlots: (slots: CalendarSlot[]) => void;
}

/** Calcula el rango ISO [startDate, endDate] para la fecha y vista actuales */
export function getVisibleDateRange(date: Date, mode: CalendarViewMode): { startDate: string; endDate: string } {
  const d = new Date(date);

  if (mode === 'day') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  if (mode === 'week') {
    const dayOfWeek = d.getDay(); // 0 es Domingo
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lunes como inicio
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  // month
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  viewMode: 'day',
  selectedDate: new Date(),
  slots: [],
  isLoading: false,
  error: null,

  setViewMode: (mode) => {
    set({ viewMode: mode });
    get().loadSlots();
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().loadSlots();
  },

  goToToday: () => {
    set({ selectedDate: new Date() });
    get().loadSlots();
  },

  navigateForward: () => {
    const { selectedDate, viewMode } = get();
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    set({ selectedDate: next });
    get().loadSlots();
  },

  navigateBackward: () => {
    const { selectedDate, viewMode } = get();
    const prev = new Date(selectedDate);
    if (viewMode === 'day') prev.setDate(prev.getDate() - 1);
    else if (viewMode === 'week') prev.setDate(prev.getDate() - 7);
    else prev.setMonth(prev.getMonth() - 1);
    set({ selectedDate: prev });
    get().loadSlots();
  },

  loadSlots: async () => {
    const { selectedDate, viewMode } = get();
    const { startDate, endDate } = getVisibleDateRange(selectedDate, viewMode);

    set({ isLoading: true, error: null });
    try {
      const response = await fetchCalendarSlots(startDate, endDate);
      set({ slots: response.slots, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar slots del calendario', isLoading: false });
    }
  },

  setSlots: (slots) => set({ slots, isLoading: false }),
}));
