/**
 * US-006 / US-002: Sector Templates — Model/Store Layer
 *
 * Estado local para la selección de plantilla de sector.
 * Usa Zustand para state management.
 *
 * TODO: Implementar el store completo.
 */

import { create } from 'zustand';
import type { SectorTemplate } from '@/shared/types';

interface SectorTemplateState {
  /** Lista de plantillas disponibles (cargadas del backend). */
  templates: SectorTemplate[];

  /** Plantilla seleccionada por el admin durante onboarding. */
  selectedTemplate: SectorTemplate | null;

  /** Si se están cargando las plantillas. */
  isLoading: boolean;

  /** Error al cargar las plantillas. */
  error: string | null;

  // ── Acciones ──────────────────────────────────────────
  /** Establece la lista de plantillas cargadas. */
  setTemplates: (templates: SectorTemplate[]) => void;

  /** Selecciona una plantilla (acción del usuario en US-006). */
  selectTemplate: (template: SectorTemplate) => void;

  /** Limpia la selección. */
  clearSelection: () => void;
}

/**
 * Store de Zustand para la selección de giro comercial.
 * TODO: Conectar con TanStack Query para fetch automático.
 */
export const useSectorTemplateStore = create<SectorTemplateState>((set) => ({
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,

  setTemplates: (templates) => set({ templates, isLoading: false }),
  selectTemplate: (template) => set({ selectedTemplate: template }),
  clearSelection: () => set({ selectedTemplate: null }),
}));
