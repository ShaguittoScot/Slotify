/**
 * Slotify Typography
 * Font families, sizes, and text styles
 * 
 * Design system:
 * - Poppins: Used for headings and display text (bold, impactful)
 * - Inter: Used for body text, labels, and UI elements (clean, readable)
 */

export const fontFamilies = {
  // Poppins — Headings & Display
  heading: 'Poppins_700Bold',
  headingSemiBold: 'Poppins_600SemiBold',
  headingMedium: 'Poppins_500Medium',

  // Inter — Body & UI
 */

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeights = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 56,
} as const;

export const textStyles = {
  h1: {
    fontSize: fontSizes['4xl'],
    lineHeight: lineHeights['4xl'],
    fontFamily: fontFamilies.heading,
    fontFamily: fontFamilies.bold,
  },
  h2: {
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights['3xl'],
    fontFamily: fontFamilies.heading,
    fontFamily: fontFamilies.bold,
  },
  h3: {
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontFamily: fontFamilies.headingSemiBold,
    fontFamily: fontFamilies.semiBold,
  },
  h4: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontFamily: fontFamilies.headingSemiBold,
    fontFamily: fontFamilies.semiBold,
  },
  body: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.regular,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.regular,
  },
  caption: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontFamily: fontFamilies.regular,
  },
  button: {
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontFamily: fontFamilies.semiBold,
  },
  buttonSmall: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontFamily: fontFamilies.medium,
  },
} as const;

export type TextStyles = typeof textStyles;
