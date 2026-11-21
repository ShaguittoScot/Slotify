/**
 * Slotify Global Color System
 * Centralized palette, semantic tokens, and theme configuration (Light & Dark mode).
 * Supports dual visual identities:
 *   1. Slotify Classic (Actual) — Grises carbón neutros, alto contraste puro.
 *   2. Obsidian — Base Zinc / Obsidian profunda, Índigo (#6366F1) como identidad principal y Esmeralda (#10B981) como acento complementario.
 */

export const palette = {
  // Deep Obsidian & Carbon Neutrals with subtle luxury depth
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#27272A',
    800: '#1C1C21',
    850: '#141418',
    900: '#0F0F12',
    950: '#09090B',
  },

  // Primary Accent (Indigo / Brand Violet)
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Semantic Feedback & Complementary Accents
  success: {
    light: '#DEF7EC',
    main: '#10B981',
    dark: '#059669',
    contrastText: '#FFFFFF',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
    contrastText: '#FFFFFF',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  info: {
    light: '#E0F2FE',
    main: '#3B82F6',
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },

  // Common Constants
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type VisualTheme = 'slotify' | 'obsidian';

export interface ThemeColors {
  isDark: boolean;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    backdrop: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    accent: string;
    link: string;
  };
  border: {
    light: string;
    main: string;
    strong: string;
    focus: string;
  };
  action: {
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    secondaryBorder: string;
    disabled: string;
    disabledText: string;
    highlight: string;
    highlightText: string;
  };
  tab: {
    activeBg: string;
    activeText: string;
    inactiveText: string;
  };
  slot: {
    availableBg: string;
    availableText: string;
    availableBorder: string;
    reservedBg: string;
    reservedText: string;
    reservedBorder: string;
    blockedBg: string;
    blockedText: string;
    blockedBorder: string;
    selectedBg: string;
    selectedText: string;
    selectedBorder: string;
    todayIndicator: string;
  };
  status: {
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;
  };
}

// ─────────────────────────────────────────────────────────────
// TEMA 1 — ACTUAL DE SLOTIFY (CLÁSICO NEUTRAL CARBÓN)
// ─────────────────────────────────────────────────────────────

export const slotifyLightColors: ThemeColors = {
  isDark: false,
  background: {
    primary: '#F9F9F9',
    secondary: '#FFFFFF',
    tertiary: '#F2F2F2',
    elevated: '#FFFFFF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#171717',
    secondary: '#525252',
    muted: '#A3A3A3',
    inverse: '#FFFFFF',
    accent: '#4F46E5',
    link: '#121212',
  },
  border: {
    light: '#F2F2F2',
    main: '#E5E5E5',
    strong: '#D4D4D4',
    focus: '#121212',
  },
  action: {
    primary: '#121212',
    primaryText: '#FFFFFF',
    secondary: '#FFFFFF',
    secondaryText: '#121212',
    secondaryBorder: '#E5E5E5',
    disabled: '#D4D4D4',
    disabledText: '#A3A3A3',
    highlight: '#EEF2FF',
    highlightText: '#4F46E5',
  },
  tab: {
    activeBg: '#121212',
    activeText: '#FFFFFF',
    inactiveText: '#737373',
  },
  slot: {
    availableBg: '#F2F2F2',
    availableText: '#262626',
    availableBorder: '#E5E5E5',
    reservedBg: '#EEF2FF',
    reservedText: '#4338CA',
    reservedBorder: '#C7D2FE',
    blockedBg: '#FEF2F2',
    blockedText: '#991B1B',
    blockedBorder: '#FECACA',
    selectedBg: '#121212',
    selectedText: '#FFFFFF',
    selectedBorder: '#121212',
    todayIndicator: '#121212',
  },
  status: {
    success: '#10B981',
    successBg: '#DEF7EC',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    info: '#3B82F6',
    infoBg: '#E0F2FE',
  },
};

export const slotifyDarkColors: ThemeColors = {
  isDark: true,
  background: {
    primary: '#121212',                 // Gris neutro carbón mate puro
    secondary: '#1E1E1E',               // Superficie de tarjetas y modales
    tertiary: '#2A2A2A',                // Inputs, chips y contenedores
    elevated: '#262626',                // Tarjetas elevadas
    backdrop: 'rgba(0, 0, 0, 0.8)',
  },
  text: {
    primary: '#F9F9F9',
    secondary: '#D4D4D4',
    muted: '#A3A3A3',
    inverse: '#121212',
    accent: '#818CF8',
    link: '#93C5FD',
  },
  border: {
    light: '#262626',
    main: '#333333',
    strong: '#444444',
    focus: '#6366F1',
  },
  action: {
    primary: '#F9F9F9',
    primaryText: '#121212',
    secondary: '#1E1E1E',
    secondaryText: '#F9F9F9',
    secondaryBorder: '#333333',
    disabled: '#333333',
    disabledText: '#737373',
    highlight: 'rgba(99, 102, 241, 0.2)',
    highlightText: '#818CF8',
  },
  tab: {
    activeBg: '#3A3A3A',
    activeText: '#FFFFFF',
    inactiveText: '#8E8E8E',
  },
  slot: {
    availableBg: '#1E1E1E',
    availableText: '#D4D4D4',
    availableBorder: '#333333',
    reservedBg: 'rgba(99, 102, 241, 0.2)',
    reservedText: '#C7D2FE',
    reservedBorder: '#6366F1',
    blockedBg: 'rgba(239, 68, 68, 0.2)',
    blockedText: '#FECACA',
    blockedBorder: '#EF4444',
    selectedBg: '#3A3A3A',
    selectedText: '#FFFFFF',
    selectedBorder: '#525252',
    todayIndicator: '#818CF8',
  },
  status: {
    success: '#34D399',
    successBg: 'rgba(16, 185, 129, 0.2)',
    warning: '#FBBF24',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    error: '#F87171',
    errorBg: 'rgba(239, 68, 68, 0.2)',
    info: '#60A5FA',
    infoBg: 'rgba(59, 130, 246, 0.2)',
  },
};

// ─────────────────────────────────────────────────────────────
// TEMA 2 — OBSIDIAN (ZINC / OBSIDIAN + ÍNDIGO + ESMERALDA)
// ─────────────────────────────────────────────────────────────

export const obsidianLightColors: ThemeColors = {
  isDark: false,
  background: {
    primary: '#FAFAFA',
    secondary: '#FFFFFF',
    tertiary: '#F4F4F5',
    elevated: '#FFFFFF',
    backdrop: 'rgba(9, 9, 11, 0.55)',
  },
  text: {
    primary: '#09090B',
    secondary: '#52525B',
    muted: '#71717A',
    inverse: '#FFFFFF',
    accent: '#6366F1',                 // Índigo principal
    link: '#4F46E5',
  },
  border: {
    light: '#F4F4F5',
    main: '#E4E4E7',
    strong: '#D4D4D8',
    focus: '#6366F1',
  },
  action: {
    primary: '#6366F1',                // Botón Índigo de identidad Obsidian
    primaryText: '#FFFFFF',
    secondary: '#FFFFFF',
    secondaryText: '#09090B',
    secondaryBorder: '#E4E4E7',
    disabled: '#E4E4E7',
    disabledText: '#A1A1AA',
    highlight: 'rgba(99, 102, 241, 0.12)',
    highlightText: '#6366F1',
  },
  tab: {
    activeBg: '#09090B',
    activeText: '#FAFAFA',
    inactiveText: '#71717A',
  },
  slot: {
    availableBg: '#F4F4F5',
    availableText: '#18181B',
    availableBorder: '#E4E4E7',
    reservedBg: 'rgba(99, 102, 241, 0.12)',
    reservedText: '#4338CA',
    reservedBorder: '#A5B4FC',
    blockedBg: '#FEF2F2',
    blockedText: '#B91C1C',
    blockedBorder: '#FECACA',
    selectedBg: '#6366F1',
    selectedText: '#FFFFFF',
    selectedBorder: '#6366F1',
    todayIndicator: '#6366F1',
  },
  status: {
    success: '#10B981',                 // Esmeralda complementario
    successBg: '#DEF7EC',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    info: '#6366F1',                   // Índigo
    infoBg: '#EEF2FF',
  },
};

export const obsidianDarkColors: ThemeColors = {
  isDark: true,
  background: {
    primary: '#09090B',                 // Deep Obsidian Base
    secondary: '#141418',               // Charcoal Luxury Surface
    tertiary: '#1C1C21',                // Input & Chip Background
    elevated: '#24242C',                // Elevated Cards & Modals
    backdrop: 'rgba(0, 0, 0, 0.85)',
  },
  text: {
    primary: '#FAFAFA',
    secondary: '#D4D4D8',
    muted: '#A1A1AA',
    inverse: '#09090B',
    accent: '#818CF8',                  // Índigo luminoso para modo oscuro
    link: '#A5B4FC',
  },
  border: {
    light: '#1C1C21',
    main: '#27272A',
    strong: '#3F3F46',
    focus: '#818CF8',
  },
  action: {
    primary: '#6366F1',                 // Botón Índigo de identidad Obsidian
    primaryText: '#FFFFFF',
    secondary: '#141418',
    secondaryText: '#FAFAFA',
    secondaryBorder: '#27272A',
    disabled: '#27272A',
    disabledText: '#71717A',
    highlight: 'rgba(99, 102, 241, 0.22)',
    highlightText: '#818CF8',
  },
  tab: {
    activeBg: '#24242C',
    activeText: '#FAFAFA',
    inactiveText: '#71717A',
  },
  slot: {
    availableBg: '#141418',
    availableText: '#E4E4E7',
    availableBorder: '#27272A',
    reservedBg: 'rgba(99, 102, 241, 0.22)',
    reservedText: '#C7D2FE',
    reservedBorder: '#6366F1',
    blockedBg: 'rgba(239, 68, 68, 0.2)',
    blockedText: '#FECACA',
    blockedBorder: '#EF4444',
    selectedBg: '#6366F1',
    selectedText: '#FAFAFA',
    selectedBorder: '#818CF8',
    todayIndicator: '#818CF8',
  },
  status: {
    success: '#10B981',                 // Esmeralda complementario
    successBg: 'rgba(16, 185, 129, 0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    error: '#EF4444',
    errorBg: 'rgba(239, 68, 68, 0.2)',
    info: '#818CF8',                    // Índigo
    infoBg: 'rgba(99, 102, 241, 0.2)',
  },
};

/**
 * Resolver central de colores según la identidad visual y el modo (claro/oscuro)
 */
export function getThemeColors(
  visualTheme: VisualTheme = 'slotify',
  isDark: boolean = false
): ThemeColors {
  if (visualTheme === 'obsidian') {
    return isDark ? obsidianDarkColors : obsidianLightColors;
  }
  return isDark ? slotifyDarkColors : slotifyLightColors;
}

// ─────────────────────────────────────────────────────────────
// EXPORTACIONES POR DEFECTO PARA COMPATIBILIDAD
// ─────────────────────────────────────────────────────────────
export const lightColors = slotifyLightColors;
export const darkColors = slotifyDarkColors;
export const colors = slotifyLightColors;
export type Palette = typeof palette;
