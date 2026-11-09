/**
 * Explore Feature — Model & State Management (Zustand)
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exploreApi } from '../api';
import type { BusinessDto, Category } from '../types';

export const isValidHexColor = (color?: string | null): boolean => {
  if (!color || typeof color !== 'string') return false;
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color.trim());
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
  businesses: [],
  isLoading: true,
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

      const data = await exploreApi.getBusinesses();
      set({ businesses: data, errorMessage: null });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'No se pudieron cargar los negocios. Intenta de nuevo.';
      set({ errorMessage: message });
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
        set({ selectedCategoryKey: parsed[0].toLowerCase() });
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
      const key = b.categoryKey?.toLowerCase() || b.category.toLowerCase().trim();
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
    if (activeKey !== 'all' && !bKey.includes(activeKey)) return false;
    if (!query) return true;

    return (
      (b.name && b.name.toLowerCase().includes(query)) ||
      (b.slug && b.slug.toLowerCase().includes(query)) ||
      (b.category && b.category.toLowerCase().includes(query)) ||
      (b.phone && b.phone.toLowerCase().includes(query))
    );
  });
};

