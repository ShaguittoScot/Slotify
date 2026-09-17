import { create } from 'zustand';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors, palette } from './colors';
import { storage } from '@/shared/lib/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'slotify_theme_preference';

interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  hydrateTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system', // Por defecto sigue el tema del dispositivo
  isHydrated: false,

  setMode: async (mode: ThemeMode) => {
    set({ mode });
    await storage.set(THEME_STORAGE_KEY, mode);
  },

  toggleTheme: async () => {
    const currentMode = get().mode;
    let nextMode: ThemeMode = 'dark';

    if (currentMode === 'system') {
      nextMode = 'dark';
    } else if (currentMode === 'dark') {
      nextMode = 'light';
    } else {
      nextMode = 'system';
    }

    set({ mode: nextMode });
    await storage.set(THEME_STORAGE_KEY, nextMode);
  },

  hydrateTheme: async () => {
    try {
      const savedMode = await storage.get<ThemeMode>(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'system' || savedMode === 'light' || savedMode === 'dark')) {
        set({ mode: savedMode, isHydrated: true });
      } else {
        set({ mode: 'system', isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
}));

/**
 * Hook to consume current theme colors, dark/light state, and settings in any component
 */
export const useAppTheme = () => {
  const systemColorScheme = useRNColorScheme();
  const { mode, setMode, toggleTheme, hydrateTheme, isHydrated } = useThemeStore();

  const isDark =
    mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';

  const colors: ThemeColors = isDark ? darkColors : lightColors;

  return {
    colors,
    palette,
    isDark,
    themeMode: mode,
    isHydrated,
    setThemeMode: setMode,
    toggleTheme,
    hydrateTheme,
  };
};
