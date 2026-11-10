/**
 * Explore Feature — Model & State Management (Zustand)
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exploreApi } from '../api';
import { loadFormSchemaLocally } from '@/features/dashboard/model/formBranding';
import { DEFAULT_BUSINESS_CATALOG } from '../constants/defaultBusinesses';
import type { BusinessDto, Category } from '../types';

export const isValidHexColor = (color?: string | null): boolean => {
  if (!color || typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color.trim());
};

type LocalBranding = Awaited<ReturnType<typeof loadFormSchemaLocally>>;

/** Carga la identidad de marca local sin romper el explorador si el almacenamiento falla. */
const loadLocalBrandingSafely = async (): Promise<LocalBranding> => {
  try {
    return await loadFormSchemaLocally();
  } catch {
    return null;
  }
};

/** Completa logo/color del negocio con la identidad guardada localmente cuando el backend no la tiene. */
const enrichWithLocalBranding = (biz: BusinessDto, localBranding: LocalBranding): BusinessDto => {
  const localName = localBranding?.businessName?.trim().toLowerCase();
  const matchesName = Boolean(localName) && (biz.name ?? '').trim().toLowerCase() === localName;
  if (!localBranding || !matchesName) return biz;

  const hasBackendColor = isValidHexColor(biz.brandColor) && biz.brandColor !== '#000000';
  return {
    ...biz,
    logoUrl: biz.logoUrl || localBranding.logoUrl || null,
    brandColor: hasBackendColor
      ? biz.brandColor
      : isValidHexColor(localBranding.accentColor)
      ? localBranding.accentColor
      : biz.brandColor,
  };
};

/**
 * Combina negocios obtenidos del backend con el catálogo predeterminado de respaldo
 * asegurando unicidad por slug y que el usuario siempre tenga contenido disponible para explorar.
 */
const mergeWithDefaultCatalog = (backendList: BusinessDto[]): BusinessDto[] => {
  const map = new Map<string, BusinessDto>();

  // Agrega primero los que vienen del backend
  backendList.forEach((b) => {
    if (b && b.slug) {
      map.set(b.slug.toLowerCase(), b);
    }
  });

  // Complementa con los predeterminados para garantizar un catálogo amplio y completo
  DEFAULT_BUSINESS_CATALOG.forEach((item) => {
    const slugKey = item.slug.toLowerCase();
    if (!map.has(slugKey)) {
      map.set(slugKey, item);
    }
  });

  return Array.from(map.values());
};

interface ExploreState {
  businesses: BusinessDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  searchInput: string;
  debouncedQuery: string;
  selectedCategoryKey: string;

  // Actions
  fetchBusinesses: (isRefresh?: boolean) => Promise<void>;
  setSearchInput: (query: string) => void;
  setDebouncedQuery: (query: string) => void;
  setSelectedCategoryKey: (key: string) => void;
  resetFilters: () => void;
  initInterests: () => Promise<void>;
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  businesses: DEFAULT_BUSINESS_CATALOG,
  isLoading: false,
  isRefreshing: false,
  errorMessage: null,
  searchInput: '',
  debouncedQuery: '',
  selectedCategoryKey: 'all',

  fetchBusinesses: async (isRefresh = false) => {
    try {
      if (isRefresh) {
        set({ isRefreshing: true, errorMessage: null });
      } else {
        set({ isLoading: true, errorMessage: null });
      }

      let backendData: BusinessDto[] = [];
      try {
        backendData = await exploreApi.getBusinesses();
      } catch (apiErr: any) {
        console.warn('[explore] Endpoint remoto no disponible, usando catálogo de respaldo:', apiErr?.message);
      }

      const localBranding = await loadLocalBrandingSafely();
      const validBackendList = Array.isArray(backendData)
        ? backendData.filter((biz) => Boolean(biz && biz.id && biz.slug))
        : [];

      // Fusionamos los negocios del backend con el catálogo base
      const merged = mergeWithDefaultCatalog(validBackendList);
      const enriched = merged.map((biz) => enrichWithLocalBranding(biz, localBranding));

      set({ businesses: enriched, errorMessage: null });
    } catch (err: any) {
      console.warn('[explore] Error procesando negocios, usando catálogo base:', err?.message);
      set({ businesses: DEFAULT_BUSINESS_CATALOG, errorMessage: null });
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  setSearchInput: (searchInput) => set({ searchInput }),

  setDebouncedQuery: (debouncedQuery) => set({ debouncedQuery }),

  setSelectedCategoryKey: (selectedCategoryKey) => set({ selectedCategoryKey }),

  resetFilters: () => set({ searchInput: '', debouncedQuery: '', selectedCategoryKey: 'all' }),

  initInterests: async () => {
    try {
      const val = await AsyncStorage.getItem('consumerInterests');
      if (!val) return;
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const rawKey = String(parsed[0]).toLowerCase();
        let normalized = rawKey;
        if (rawKey.includes('barber')) normalized = 'barberia';
        else if (rawKey.includes('spa') || rawKey.includes('masaj')) normalized = 'spa';
        else if (rawKey.includes('salud') || rawKey.includes('dent')) normalized = 'salud';
        else if (rawKey.includes('estet') || rawKey.includes('belleza')) normalized = 'belleza';

        set({ selectedCategoryKey: normalized });
      }
    } catch {
      // Silently ignore storage parsing errors
    }
  },
}));

/**
 * Hook selector para obtener categorías únicas extraídas de los negocios
 */
export const selectExploreCategories = (businesses: BusinessDto[]): Category[] => {
  const map = new Map<string, string>();
  businesses.forEach((b) => {
    if (b.category && b.category.trim()) {
      const key = (b.categoryKey || b.category).toLowerCase().trim();
      if (!map.has(key)) map.set(key, b.category.trim());
    }
  });

  const list: Category[] = [{ id: 'all', name: 'Todos', key: 'all' }];
  map.forEach((name, key) => list.push({ id: key, name, key }));
  return list;
};

/**
 * Hook selector para filtrar negocios según la búsqueda y categoría
 */
export const selectFilteredBusinesses = (
  businesses: BusinessDto[],
  debouncedQuery: string,
  selectedCategoryKey: string
): BusinessDto[] => {
  const query = debouncedQuery.toLowerCase();
  const activeKey = selectedCategoryKey.toLowerCase();

  return businesses.filter((b) => {
    const bKey = (b.categoryKey || b.category || '').toLowerCase();
    if (activeKey !== 'all' && !bKey.includes(activeKey) && !activeKey.includes(bKey)) return false;
    if (!query) return true;

    return (
      (b.name && b.name.toLowerCase().includes(query)) ||
      (b.slug && b.slug.toLowerCase().includes(query)) ||
      (b.category && b.category.toLowerCase().includes(query)) ||
      (b.phone && b.phone.toLowerCase().includes(query)) ||
      (b.address && b.address.toLowerCase().includes(query)) ||
      (b.services && b.services.some((s) => s.name.toLowerCase().includes(query)))
    );
  });
};
