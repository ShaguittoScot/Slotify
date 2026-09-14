/**
 * US-008: Schedule Blocks — Model/Store Layer
 *
 * Estado para el flujo de bloqueo manual de horarios.
 *
 * TODO: Implementar el store completo.
 */

import { create } from 'zustand';

interface ScheduleBlockFormState {
  /** Si el modal de crear bloqueo está abierto. */
  isModalOpen: boolean;

  /** Fecha/hora de inicio pre-seleccionada (al tocar un slot en el calendario). */
  preselectedStart: Date | null;

  /** Fecha/hora de fin pre-seleccionada. */
  preselectedEnd: Date | null;

  // ── Acciones ──────────────────────────────────────────
  /** Abre el modal de bloqueo con fechas pre-seleccionadas (del calendario). */
  openBlockModal: (start?: Date, end?: Date) => void;

  /** Cierra el modal de bloqueo. */
  closeBlockModal: () => void;
}

/**
 * Store de Zustand para el formulario de bloqueo.
 * Se integra con el calendario (US-003): al tocar un slot disponible,
 * se abre el modal con las fechas pre-seleccionadas.
 */
export const useScheduleBlockStore = create<ScheduleBlockFormState>((set) => ({
  isModalOpen: false,
  preselectedStart: null,
  preselectedEnd: null,

  openBlockModal: (start, end) =>
    set({
      isModalOpen: true,
      preselectedStart: start ?? null,
      preselectedEnd: end ?? null,
    }),

  closeBlockModal: () =>
    set({
      isModalOpen: false,
      preselectedStart: null,
      preselectedEnd: null,
    }),
}));
