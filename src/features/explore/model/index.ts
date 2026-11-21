/**
 * Explore Feature — Model & State Management (Zustand)
 */

import { isValidHexColor } from '@/features/business-brand';
import { loadFormSchemaLocally } from '@/features/dashboard/model/formBranding';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { exploreApi } from '../api';
import type { BusinessDto, Category } from '../types';

export { isValidHexColor };

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

const mergeBusinessCatalog = (backendList: BusinessDto[]): BusinessDto[] => {
  const map = new Map<string, BusinessDto>();

  backendList.forEach((b) => {
    if (b && b.slug) {
      map.set(b.slug.toLowerCase(), b);
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

export const useExploreStore = create<ExploreState>((set) => ({
  businesses: [],
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

      const backendData = await exploreApi.getBusinesses();
      const localBranding = await loadLocalBrandingSafely();
      const validBackendList = Array.isArray(backendData)
        ? backendData.filter((biz) => Boolean(biz && biz.id && biz.slug))
        : [];

      const merged = mergeBusinessCatalog(validBackendList);
      const enriched = merged.map((biz) => enrichWithLocalBranding(biz, localBranding));

      set({ businesses: enriched, errorMessage: null });
    } catch {
      set((state) => ({
        businesses: state.businesses,
        errorMessage: 'No se pudo cargar el catálogo de negocios. Revisa tu conexión e inténtalo de nuevo.',
      }));
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
      if (!val) {
        set({ selectedCategoryKey: 'all' });
        return;
      }
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const rawKey = String(parsed[0]).toLowerCase();
        let normalized = rawKey;
        if (rawKey.includes('barber')) normalized = 'barberia';
        else if (rawKey.includes('spa') || rawKey.includes('masaj')) normalized = 'spa';
        else if (rawKey.includes('salud') || rawKey.includes('dent')) normalized = 'salud';
        else if (rawKey.includes('estet') || rawKey.includes('belleza')) normalized = 'belleza';

        set({ selectedCategoryKey: normalized });
      } else {
        set({ selectedCategoryKey: 'all' });
      }
    } catch {
      set({ selectedCategoryKey: 'all' });
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
  const query = debouncedQuery.toLowerCase().trim();
  const activeKey = (selectedCategoryKey || 'all').toLowerCase().trim();

  return businesses.filter((b) => {
    if (activeKey !== 'all') {
      const bKey = (b.categoryKey || b.category || '').toLowerCase().trim();
      const matches = bKey === activeKey || bKey.includes(activeKey) || activeKey.includes(bKey);
      if (!matches) return false;
    }
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
