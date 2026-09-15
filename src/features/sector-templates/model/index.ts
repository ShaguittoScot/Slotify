/**
 * US-006 / US-002: Sector Templates — Model/Store Layer
 *
 * Estado global para la selección de giro comercial y plantillas de sector.
 * Desarrollado con Zustand para proveer acceso reactivo y desacoplado.
 */

import { create } from 'zustand';
import type { SectorTemplate } from '@/shared/types';
import { CANONICAL_SECTOR_CATEGORIES } from '../constants';
import { fetchSectorTemplates } from '../api';
import type { SectorCategory, SectorCategoryKey } from '../types';

/**
 * Resultado consolidado del flujo de onboarding (US-006 output).
 * Este objeto es el "contrato de salida" que otros módulos de la app
 * (dashboard, agenda, configuración) deben consumir para acceder
 * a la configuración inicial del negocio elegida por el administrador.
 */
export interface OnboardingResult {
  /** Nombre comercial del negocio capturado durante el onboarding */
  businessName: string;
  /** Giro comercial seleccionado */
  sectorCategory: SectorCategory;
  /**
   * IDs de módulos activos al finalizar el onboarding.
   * Ejemplo: ['citas', 'empleados', 'recordatorios_sms']
   */
  activeModules: string[];
  /**
   * Servicios finales a publicar en el portal del negocio.
   * En modo sector contiene los sugeridos seleccionados;
   * en modo lienzo libre contiene los servicios creados por el usuario.
   */
  finalServices: Array<{
    name: string;
    durationMinutes: number;
    price?: number;
  }>;
  /** Si el negocio inició con lienzo modular básico (sin sector predefinido) */
  isCustomCanvas: boolean;
  /** Timestamp ISO de cuando se finalizó el onboarding */
  completedAt: string;
}

interface SectorTemplateState {
  /** Catálogo completo de giros y categorías comerciales */
  categories: SectorCategory[];

  /** Plantillas cargadas desde backend o catálogo seed */
  templates: SectorTemplate[];

  /** Categoría comercial seleccionada actualmente por el usuario (US-006) */
  selectedCategory: SectorCategory | null;

  /** Plantilla activa seleccionada o generada para el negocio */
  selectedTemplate: SectorTemplate | null;

  /**
   * Indicador del Escenario 2:
   * Verdadero si el usuario seleccionó "Otro / Servicios Generales"
   * e inicializa un lienzo modular básico sin forzar módulos sectoriales.
   */
  isCustomCanvas: boolean;

  /** Indicador de carga activa */
  isLoading: boolean;

  /** Mensaje de error si la carga falla */
  error: string | null;

  /**
   * Resultado consolidado del onboarding una vez completado (US-006 output).
   * Null hasta que el usuario finalice el flujo con éxito.
   * Disponible para que el dashboard y otros módulos lo consuman.
   */
  onboardingResult: OnboardingResult | null;

  /** True una vez que el administrador completó el flujo de onboarding */
  isOnboardingComplete: boolean;

  // ── Acciones ──────────────────────────────────────────
  /** Carga plantillas desde el backend o catálogo local */
  loadTemplates: () => Promise<void>;

  /** Establece la lista de plantillas cargadas */
  setTemplates: (templates: SectorTemplate[]) => void;

  /** Selecciona una categoría por su ID numérico (US-006) */
  selectCategoryById: (id: number) => void;

  /** Selecciona una categoría por su clave canónica */
  selectCategoryByKey: (key: SectorCategoryKey) => void;

  /** Selecciona una plantilla específica del catálogo */
  selectTemplate: (template: SectorTemplate) => void;

  /** Activa explícitamente el modo Lienzo Libre (Escenario 2) */
  selectCustomCanvasMode: () => void;

  /**
   * Finaliza el onboarding persistiendo todos los datos configurados.
   * Llamar al presionar "Aplicar Plantilla" / "Guardar y Entrar a Slotly".
   * Este es el OUTPUT final de US-006 que otros módulos de la app consumen.
   */
  finalizeOnboarding: (result: Omit<OnboardingResult, 'completedAt'>) => void;

  /** Limpia la selección actual */
  clearSelection: () => void;

  /** Reinicia el onboarding completo (para testing o re-configuración) */
  resetOnboarding: () => void;
}

export const useSectorTemplateStore = create<SectorTemplateState>((set, get) => ({
  categories: CANONICAL_SECTOR_CATEGORIES,
  templates: [],
  selectedCategory: null,
  selectedTemplate: null,
  isCustomCanvas: false,
  isLoading: false,
  error: null,
  onboardingResult: null,
  isOnboardingComplete: false,

  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const templates = await fetchSectorTemplates();
      set({ templates, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Error al cargar las plantillas de sector',
      });
    }
  },

  setTemplates: (templates) => set({ templates, isLoading: false }),

  selectCategoryById: (id: number) => {
    const { categories, templates, selectedCategory } = get();

    // Si el usuario vuelve a tocar la categoría ya seleccionada, la deselecciona (toggle)
    if (selectedCategory?.id === id) {
      set({
        selectedCategory: null,
        selectedTemplate: null,
        isCustomCanvas: false,
      });
      return;
    }

    const category = categories.find((c) => c.id === id);

    if (!category) return;

    if (category.isCustomCanvas) {
      // Escenario 2: Lienzo modular básico sin módulos forzados
      set({
        selectedCategory: category,
        isCustomCanvas: true,
        selectedTemplate: {
          id: category.id,
          name: category.name,
          defaultModules: ['citas', 'servicios_basicos'],
          suggestedServices: category.suggestedServices,
        },
      });
    } else {
      // Escenario 1: Categoría sugerida con módulos afines
      const matchingTemplate = templates.find((t) => t.id === category.id) || {
        id: category.id,
        name: category.name,
        defaultModules: category.defaultModules,
        suggestedServices: category.suggestedServices,
      };

      set({
        selectedCategory: category,
        isCustomCanvas: false,
        selectedTemplate: matchingTemplate,
      });
    }
  },

  selectCategoryByKey: (key: SectorCategoryKey) => {
    const { categories } = get();
    const category = categories.find((c) => c.key === key);
    if (category) {
      get().selectCategoryById(category.id);
    }
  },

  selectTemplate: (template) => {
    const { categories } = get();
    const matchingCategory = categories.find((c) => c.id === template.id) || null;
    set({
      selectedTemplate: template,
      selectedCategory: matchingCategory,
      isCustomCanvas: matchingCategory?.isCustomCanvas ?? false,
    });
  },

  selectCustomCanvasMode: () => {
    const { categories } = get();
    const customCat = categories.find((c) => c.isCustomCanvas);
    if (customCat) {
      get().selectCategoryById(customCat.id);
    } else {
      set({
        selectedCategory: null,
        isCustomCanvas: true,
        selectedTemplate: {
          id: 99,
          name: 'Lienzo Libre',
          defaultModules: ['citas', 'servicios_basicos'],
          suggestedServices: [],
        },
      });
    }
  },

  finalizeOnboarding: (result) => {
    const onboardingResult: OnboardingResult = {
      ...result,
      completedAt: new Date().toISOString(),
    };
    set({
      onboardingResult,
      isOnboardingComplete: true,
    });
  },

  clearSelection: () =>
    set({
      selectedCategory: null,
      selectedTemplate: null,
      isCustomCanvas: false,
    }),

  resetOnboarding: () =>
    set({
      selectedCategory: null,
      selectedTemplate: null,
      isCustomCanvas: false,
      onboardingResult: null,
      isOnboardingComplete: false,
    }),
}));
