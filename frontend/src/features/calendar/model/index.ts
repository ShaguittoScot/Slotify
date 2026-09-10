/**
 * US-003: Calendar — Model/Store Layer
 *
 * Estado local para el calendario multiformato.
 * Maneja la vista activa (día/semana/mes), fechas seleccionadas,
 * y los slots cargados del backend.
 *
 * TODO: Implementar el store completo.
 */

import { create } from 'zustand';
import type { CalendarSlot, CalendarViewMode } from '@/shared/types';

interface CalendarState {
  /** Modo de vista actual: 'day' | 'week' | 'month' */
  viewMode: CalendarViewMode;

  /** Fecha seleccionada actualmente. */
  selectedDate: Date;

  /** Slots cargados del backend para el rango visible. */
  slots: CalendarSlot[];

  /** Si se están cargando los slots. */
  isLoading: boolean;

  // ── Acciones ──────────────────────────────────────────
  /** Cambia el modo de visualización (US-003: Multiformato). */
  setViewMode: (mode: CalendarViewMode) => void;

  /** Navega a una fecha específica. */
  setSelectedDate: (date: Date) => void;

  /** Navega al día siguiente/anterior. */
  navigateForward: () => void;
  navigateBackward: () => void;

  /** Establece los slots cargados del backend. */
  setSlots: (slots: CalendarSlot[]) => void;
}

/**
 * Store de Zustand para el calendario táctil.
 * TODO: Conectar con TanStack Query para fetch automático al cambiar rango.
 */
export const useCalendarStore = create<CalendarState>((set, get) => ({
  viewMode: 'day',
  selectedDate: new Date(),
  slots: [],
  isLoading: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  navigateForward: () => {
    const { selectedDate, viewMode } = get();
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    set({ selectedDate: next });
  },

  navigateBackward: () => {
    const { selectedDate, viewMode } = get();
    const prev = new Date(selectedDate);
    if (viewMode === 'day') prev.setDate(prev.getDate() - 1);
    else if (viewMode === 'week') prev.setDate(prev.getDate() - 7);
    else prev.setMonth(prev.getMonth() - 1);
    set({ selectedDate: prev });
  },

  setSlots: (slots) => set({ slots, isLoading: false }),
}));
