/**
 * Slotify Global Color System
 * Centralized palette, semantic tokens, and theme configuration (Light & Dark mode).
 * Pure neutral dark gray / true charcoal tones with ZERO blue undertones.
 */

export const palette = {
  // Pure Neutral Dark Grays / True Charcoal (Zero blue tint: R ≈ G ≈ B)
  neutral: {
    50: '#F9F9F9',
    100: '#F2F2F2',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#3A3A3A',
    800: '#262626',
    850: '#1E1E1E',
    900: '#171717',
    950: '#121212',
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

  // Semantic Feedback
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

/**
 * Light Mode Theme Semantic Tokens (Pure neutral grays and clean white)
 */
export const lightColors: ThemeColors = {
  isDark: false,
  
  // Backgrounds
  background: {
    primary: palette.neutral[50],       // #F9F9F9 (Limpio, neutro sin tinte)
    secondary: palette.white,            // #FFFFFF (Tarjetas, modales)
    tertiary: palette.neutral[100],      // #F2F2F2 (Inputs, chips)
    elevated: palette.white,
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: palette.neutral[900],       // #171717
    secondary: palette.neutral[600],     // #525252
    muted: palette.neutral[400],         // #A3A3A3
    inverse: palette.white,
    accent: palette.primary[600],        // #4F46E5
    link: palette.neutral[950],          // #121212
  },

  // Borders & Dividers
  border: {
    light: palette.neutral[100],         // #F2F2F2
    main: palette.neutral[200],          // #E5E5E5
    strong: palette.neutral[300],        // #D4D4D4
    focus: palette.neutral[950],         // #121212
  },

  // Action Buttons & Controls
  action: {
    primary: palette.neutral[950],       // #121212 (Botón negro neutro mate)
    primaryText: palette.white,
    secondary: palette.white,
    secondaryText: palette.neutral[950],
    secondaryBorder: palette.neutral[200],
    disabled: palette.neutral[300],
    disabledText: palette.neutral[400],
    highlight: palette.primary[50],
    highlightText: palette.primary[600],
  },

  // Tabs / Segmented controls
  tab: {
    activeBg: palette.neutral[950],      // #121212
    activeText: palette.white,
    inactiveText: palette.neutral[500],  // #737373
  },

  // Slot & Calendar Status Tokens
  slot: {
    availableBg: palette.neutral[100],   // #F2F2F2
    availableText: palette.neutral[800], // #262626
    availableBorder: palette.neutral[200],

    reservedBg: '#EEF2FF',
    reservedText: '#4338CA',
    reservedBorder: '#C7D2FE',

    blockedBg: '#FEF2F2',
    blockedText: '#991B1B',
    blockedBorder: '#FECACA',

    selectedBg: palette.neutral[950],
    selectedText: palette.white,
    selectedBorder: palette.neutral[950],

    todayIndicator: palette.neutral[950],
  },

  // Semantic status
  status: {
    success: palette.success.main,
    successBg: palette.success.light,
    warning: palette.warning.main,
    warningBg: palette.warning.light,
    error: palette.error.main,
    errorBg: palette.error.light,
    info: palette.info.main,
    infoBg: palette.info.light,
  },
};

/**
 * Dark Mode Theme Semantic Tokens (Pure Neutral Dark Charcoal / Onyx: NO Blue Tint)
 */
export const darkColors: ThemeColors = {
  isDark: true,

  // Backgrounds (Negros y grises puros, neutros sin matices azules)
  background: {
    primary: palette.neutral[950],       // #121212 (Fondo principal negro mate puro)
    secondary: palette.neutral[850],     // #1E1E1E (Tarjetas, modales y headers)
    tertiary: palette.neutral[700],      // #3A3A3A (Inputs, chips, fondos de tabs)
    elevated: palette.neutral[800],      // #262626 (Elevaciones)
    backdrop: 'rgba(0, 0, 0, 0.8)',
  },

  // Text colors
  text: {
    primary: palette.neutral[50],        // #F9F9F9 (Blanco suave)
    secondary: palette.neutral[300],     // #D4D4D4 (Gris claro neutro)
    muted: palette.neutral[400],         // #A3A3A3 (Gris medio neutro)
    inverse: palette.neutral[950],       // #121212
    accent: palette.primary[300],        // #A5B4FC
    link: '#93C5FD',
  },

  // Borders & Dividers
  border: {
    light: palette.neutral[800],         // #262626
    main: palette.neutral[700],          // #3A3A3A
    strong: palette.neutral[600],        // #525252
    focus: palette.primary[400],         // #818CF8
  },

  // Action Buttons & Controls
  action: {
    primary: palette.neutral[50],        // #F9F9F9 (Botón blanco/gris claro de alto contraste)
    primaryText: palette.neutral[950],   // #121212
    secondary: palette.neutral[850],     // #1E1E1E
    secondaryText: palette.neutral[50],
    secondaryBorder: palette.neutral[700],
    disabled: palette.neutral[700],
    disabledText: palette.neutral[500],
    highlight: 'rgba(99, 102, 241, 0.2)',
    highlightText: palette.primary[300],
  },

  // Tabs / Segmented controls (Pestaña activa en gris neutro iluminado #3A3A3A o #525252)
  tab: {
    activeBg: palette.neutral[600],      // #525252 (Gris neutro destacado sin azul)
    activeText: palette.white,
    inactiveText: palette.neutral[400],  // #A3A3A3
  },

  // Slot & Calendar Status Tokens
  slot: {
    availableBg: palette.neutral[850],   // #1E1E1E
    availableText: palette.neutral[200], // #E5E5E5
    availableBorder: palette.neutral[700],

    reservedBg: 'rgba(99, 102, 241, 0.2)',
    reservedText: '#C7D2FE',
    reservedBorder: '#6366F1',

    blockedBg: 'rgba(239, 68, 68, 0.2)',
    blockedText: '#FECACA',
    blockedBorder: '#EF4444',

    selectedBg: palette.neutral[600],
    selectedText: palette.white,
    selectedBorder: palette.neutral[500],

    todayIndicator: palette.primary[400],
  },

  // Semantic status
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

export type Palette = typeof palette;
export const colors = lightColors; // Default fallback
