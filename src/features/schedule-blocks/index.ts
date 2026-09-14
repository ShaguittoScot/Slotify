/**
 * Feature: Schedule Blocks (US-008)
 *
 * Bloqueo manual de horarios no disponibles.
 * Barrel export del feature completo.
 */

export { useScheduleBlockStore } from './model';
export { createScheduleBlock, deleteScheduleBlock } from './api';
// export { BlockSlotModal } from './ui'; // TODO: Descomentar
