import { create } from 'zustand';
import { useColorScheme as useRNColorScheme } from 'react-native';
import {
  ThemeColors,
  VisualTheme,
  palette,
  getThemeColors,
  slotifyLightColors,
  slotifyDarkColors,
} from './colors';

function getStorage() {
  return (require('@/shared/lib/storage') as typeof import('@/shared/lib/storage')).storage;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type { VisualTheme };

const THEME_MODE_STORAGE_KEY = 'slotify_theme_preference';
const VISUAL_THEME_STORAGE_KEY = 'slotify_visual_theme_preference';

interface ThemeState {
  mode: ThemeMode;
  visualTheme: VisualTheme;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  setVisualTheme: (theme: VisualTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
  hydrateTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark', // Estilo oscuro elegante por defecto
  visualTheme: 'slotify', // Tema actual por defecto
  isHydrated: false,

  setMode: async (mode: ThemeMode) => {
    set({ mode });
    await getStorage().set(THEME_MODE_STORAGE_KEY, mode);
  },

  setVisualTheme: async (visualTheme: VisualTheme) => {
    set({ visualTheme });
    await getStorage().set(VISUAL_THEME_STORAGE_KEY, visualTheme);
  },

  toggleTheme: async () => {
    const currentMode = get().mode;
    let nextMode: ThemeMode = 'dark';

    if (currentMode === 'system') {
      nextMode = 'dark';
    } else if (currentMode === 'dark') {
      nextMode = 'light';
    } else {
      nextMode = 'dark';
    }

    set({ mode: nextMode });
    await getStorage().set(THEME_MODE_STORAGE_KEY, nextMode);
  },

  hydrateTheme: async () => {
    try {
      const storage = getStorage();
      const [savedMode, savedVisualTheme] = await Promise.all([
        storage.get<ThemeMode>(THEME_MODE_STORAGE_KEY),
        storage.get<VisualTheme>(VISUAL_THEME_STORAGE_KEY),
      ]);

      const validMode: ThemeMode =
        savedMode === 'light' || savedMode === 'dark' || savedMode === 'system'
          ? savedMode
          : 'dark';

      const validVisualTheme: VisualTheme =
        savedVisualTheme === 'obsidian' ? 'obsidian' : 'slotify';

      set({
        mode: validMode,
        visualTheme: validVisualTheme,
        isHydrated: true,
      });
    } catch {
      set({ mode: 'dark', visualTheme: 'slotify', isHydrated: true });
    }
  },
}));

/**
 * Hook to consume current theme colors, dark/light state, visual identity, and settings in any component
 */
export const useAppTheme = () => {
  const systemColorScheme = useRNColorScheme();
  const {
    mode,
    visualTheme,
    setMode,
    setVisualTheme,
    toggleTheme,
    hydrateTheme,
    isHydrated,
  } = useThemeStore();

  const isDark =
    mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';

  const colors: ThemeColors = getThemeColors(visualTheme, isDark);

  return {
    colors,
    palette,
    isDark,
    themeMode: mode,
    visualTheme,
    isHydrated,
    setThemeMode: setMode,
    setVisualTheme,
    toggleTheme,
    hydrateTheme,
  };
};
