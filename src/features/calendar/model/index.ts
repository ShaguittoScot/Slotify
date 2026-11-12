/**
 * US-003 / US-008 / US-023: Calendar — Model/Store Layer (ViewModel)
 *
 * Estado reactivo para el calendario multiformato táctil y bloqueos funcionales de agenda.
 * Maneja la vista activa (día/semana/mes), fechas seleccionadas,
 * y la sincronización con el backend .NET (Slotify_back).
 */

import { create } from 'zustand';
import type { CalendarSlot, CalendarViewMode } from '@/shared/types';
import { fetchCalendarSlots } from '../api';
import { useAuthStore } from '@/features/auth/model';
import { createScheduleBlock, deleteScheduleBlock } from '@/features/schedule-blocks/api';

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

  // ── Acciones de Administrador ──────────────────────────
  /** Actualiza el estado de un slot (ej. 'confirmed' | 'cancelled' | 'completed' | 'pending') */
  updateSlotStatus: (resourceId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'pending') => void;

  /** Agrega un nuevo slot manualmente (cita walk-in o bloqueo) */
  addSlot: (slot: CalendarSlot) => void;

  /** Crea un bloqueo de horario de forma funcional persistiendo en backend (US-008 / US-023) */
  createBlock: (data: {
    title: string;
    reason: string;
    startTime: string;
    endTime: string;
    employeeId?: string;
  }) => Promise<void>;

  /** Elimina un bloqueo de la agenda en backend y en memoria (US-008 / US-023) */
  deleteBlock: (resourceId: string) => Promise<void>;

  /** Elimina un slot de la agenda en memoria */
  removeSlot: (resourceId: string) => void;

  /** Reprograma el horario de una cita existente */
  rescheduleSlot: (resourceId: string, newStartTime: string, newEndTime: string) => void;
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
    if (get().slots.length === 0) {
      get().loadSlots();
    }
  },

  setSelectedDate: (date) => {
    const prev = get().selectedDate;
    const sameMonth = prev.getFullYear() === date.getFullYear() && prev.getMonth() === date.getMonth();
    set({ selectedDate: date });
    if (!sameMonth || get().slots.length === 0) {
      get().loadSlots();
    }
  },

  goToToday: () => {
    const today = new Date();
    const prev = get().selectedDate;
    const sameMonth = prev.getFullYear() === today.getFullYear() && prev.getMonth() === today.getMonth();
    set({ selectedDate: today });
    if (!sameMonth || get().slots.length === 0) {
      get().loadSlots();
    }
  },

  navigateForward: () => {
    const { selectedDate, viewMode } = get();
    const next = new Date(selectedDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);

    const sameMonth = selectedDate.getFullYear() === next.getFullYear() && selectedDate.getMonth() === next.getMonth();
    set({ selectedDate: next });
    if (!sameMonth || get().slots.length === 0) {
      get().loadSlots();
    }
  },

  navigateBackward: () => {
    const { selectedDate, viewMode } = get();
    const prev = new Date(selectedDate);
    if (viewMode === 'day') prev.setDate(prev.getDate() - 1);
    else if (viewMode === 'week') prev.setDate(prev.getDate() - 7);
    else prev.setMonth(prev.getMonth() - 1);

    const sameMonth = selectedDate.getFullYear() === prev.getFullYear() && selectedDate.getMonth() === prev.getMonth();
    set({ selectedDate: prev });
    if (!sameMonth || get().slots.length === 0) {
      get().loadSlots();
    }
  },

  loadSlots: async () => {
    const { selectedDate } = get();
    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0);
    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    if (get().slots.length === 0) {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await fetchCalendarSlots(start.toISOString(), end.toISOString());
      set({ slots: response.slots, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar slots del calendario', isLoading: false });
    }
  },

  setSlots: (slots) => set({ slots, isLoading: false }),

  updateSlotStatus: (resourceId, status) => {
    set((state) => ({
      slots: state.slots.map((s) => (s.resourceId === resourceId ? { ...s, status } : s)),
    }));
  },

  addSlot: (slot) => {
    set((state) => ({
      slots: [...state.slots, slot],
    }));
  },

  createBlock: async (data) => {
    // El modo demo se detecta si isDemoMode está activo o por el id fijo asignado en login demo
    const authState = useAuthStore.getState();
    const isDemo = Boolean((authState as any).isDemoMode) || authState.user?.id === 'demo-user-123';

    if (isDemo) {
      const demoSlot: CalendarSlot = {
        type: 'block',
        resourceId: `blk-demo-${Date.now()}`,
        title: data.title,
        status: 'blocked',
        blockReason: data.reason,
        startTime: data.startTime,
        endTime: data.endTime,
        employeeName: 'Todo el personal',
      };
      set((state) => ({ slots: [...state.slots, demoSlot] }));
      return;
    }

    const blockId = await createScheduleBlock({
      startDateTime: data.startTime,
      endDateTime: data.endTime,
      reason: data.reason,
      employeeId: data.employeeId,
    });

    const newSlot: CalendarSlot = {
      type: 'block',
      resourceId: String(blockId || `blk-${Date.now()}`),
      title: data.title,
      status: 'blocked',
      blockReason: data.reason,
      startTime: data.startTime,
      endTime: data.endTime,
      employeeName: 'Todo el personal',
    };

    set((state) => ({ slots: [...state.slots, newSlot] }));
  },

  deleteBlock: async (resourceId) => {
    // El modo demo se detecta si isDemoMode está activo o por el id fijo asignado en login demo
    const authState = useAuthStore.getState();
    const isDemo = Boolean((authState as any).isDemoMode) || authState.user?.id === 'demo-user-123';

    if (!isDemo) {
      const numericId = parseInt(resourceId.replace(/\D/g, ''), 10);
      if (!isNaN(numericId) && numericId > 0) {
        await deleteScheduleBlock(numericId);
      }
    }

    set((state) => ({
      slots: state.slots.filter((s) => s.resourceId !== resourceId),
    }));
  },

  removeSlot: (resourceId) => {
    set((state) => ({
      slots: state.slots.filter((s) => s.resourceId !== resourceId),
    }));
  },

  rescheduleSlot: (resourceId, newStartTime, newEndTime) => {
    set((state) => ({
      slots: state.slots.map((s) =>
        s.resourceId === resourceId ? { ...s, startTime: newStartTime, endTime: newEndTime } : s
      ),
    }));
  },
}));
