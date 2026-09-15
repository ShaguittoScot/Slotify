/**
 * US-006: Selector Inicial de Giro Comercial (Épica EP-02)
 * Tipos e interfaces TypeScript para giros comerciales y plantillas de sector.
 * Compatibles con los endpoints REST en ASP.NET Core Web API (camelCase JSON).
 */

import type { SuggestedService } from '@/shared/types';

/** Clave canónica para identificar giros comerciales soportados */
export type SectorCategoryKey =
  | 'salud-bienestar'
  | 'belleza-cuidado'
  | 'fitness-deportes'
  | 'servicios-profesionales'
  | 'otro-general';

/**
 * Categoría o Giro Comercial para el selector inicial (US-006)
 */
export interface SectorCategory {
  /** ID numérico autoincremental de seed en backend .NET */
  id: number;
  /** Clave única para tracking y filtros en frontend */
  key: SectorCategoryKey;
  /** Nombre visible del giro comercial */
  name: string;
  /** Resumen rápido de sub-rubros (ej. Clínicas, Consultorios, Dentistas) */
  tagline: string;
  /** Descripción detallada del flujo y módulos afines */
  description: string;
  /** Identificador de icono SF Symbols / Material / Universal */
  iconName: string;
  /** Módulos pre-activados sugeridos */
  defaultModules: string[];
  /** Servicios sugeridos de catálogo para este sector */
  suggestedServices: SuggestedService[];
  /**
   * Si es true, representa "Otro / Servicios Generales" (Escenario 2)
   * que inicializa un lienzo modular básico sin imponer módulos sectoriales.
   */
  isCustomCanvas: boolean;
}

/**
 * DTO para plantillas de sector consumidas desde GET /api/sector-templates
 * Mapeo 1:1 con SectorTemplateDto en C# ASP.NET Core
 */
export interface SectorTemplateDto {
  id: number;
  name: string;
  defaultModules: string[];
  suggestedServices: SuggestedServiceDto[];
}

/**
 * DTO para servicio sugerido dentro de una plantilla de sector
 * Mapeo 1:1 con SuggestedServiceDto en C# ASP.NET Core
 */
export interface SuggestedServiceDto {
  name: string;
  durationMinutes: number;
  price?: number | null;
}

/**
 * Payload para persistir la selección del giro comercial en el negocio
 */
export interface SaveSectorSelectionPayload {
  businessId: string;
  sectorTemplateId: number;
  isCustomCanvas?: boolean;
}

/**
 * Parámetros de navegación hacia la pantalla de catálogo de plantillas (US-002)
 */
export interface OnboardingTemplateRouteParams {
  sectorId?: string;
  sectorKey?: SectorCategoryKey;
  isCustom?: string;
}
