/**
 * Slotify Theme - Barrel Export
 * Single entry point for the entire design system
 */

export {
  palette,
  lightColors,
  darkColors,
  colors,
  slotifyLightColors,
  slotifyDarkColors,
  obsidianLightColors,
  obsidianDarkColors,
  getThemeColors,
} from './colors';
export type { ThemeColors, Palette, VisualTheme } from './colors';

export { useAppTheme, useThemeStore } from './useTheme';
export type { ThemeMode } from './useTheme';

export { ThemeSettingsModal } from './ThemeSettingsModal';

export { fontFamilies, fontSizes, lineHeights, textStyles } from './typography';
export type { TextStyles } from './typography';

export { spacing, borderRadius, shadows } from './spacing';
export type { Spacing, BorderRadius, Shadows } from './spacing';
