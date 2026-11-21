import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '@/shared/theme';
import type {
  BusinessBrandInput,
  BusinessPresentationStyle,
  ResolvedBusinessBrand,
} from '../types';
import {
  getAccessibleContrastText,
  normalizeHexColor,
  withAlpha,
} from './colorUtils';
import { resolveSectorKey, SECTOR_VISUAL_PRESETS } from './sectorPresets';

const VALID_PRESENTATION_STYLES: ReadonlySet<BusinessPresentationStyle> = new Set([
  'classic_scroll',
  'interactive_slides',
]);

function normalizePresentationStyle(
  raw?: string | null
): BusinessPresentationStyle | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim() as BusinessPresentationStyle;
  return VALID_PRESENTATION_STYLES.has(trimmed) ? trimmed : null;
}

function normalizeOptionalUrl(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resuelve la identidad visual efectiva de un negocio en 3 capas:
 * 1. Tema de Slotify (neutros y fallback de acción)
 * 2. Preset visual del sector (paleta inicial, presentación y jerarquía)
 * 3. Personalización del negocio (prevalece cuando tiene valores válidos)
 */
export function resolveBusinessBrand(
  business?: BusinessBrandInput | null,
  themeColors?: Pick<ThemeColors, 'isDark' | 'action'>
): ResolvedBusinessBrand {
  const sector = resolveSectorKey(business);
  const preset = SECTOR_VISUAL_PRESETS[sector];
  const isDark = themeColors?.isDark ?? false;
  const themeFallback =
    normalizeHexColor(themeColors?.action?.primary) ?? '#6366F1';

  const customPrimary = normalizeHexColor(business?.brandColor);
  const primaryColor =
    customPrimary ??
    normalizeHexColor(preset.defaultPrimaryColor) ??
    themeFallback;

  const customSecondary = normalizeHexColor(business?.secondaryColor);
  const secondaryColor =
    customSecondary ??
    normalizeHexColor(preset.defaultSecondaryColor) ??
    primaryColor;

  const customStyle = normalizePresentationStyle(business?.presentationStyle);
  const presentationStyle = customStyle ?? preset.defaultPresentationStyle;

  return {
    sector,
    preset,
    primaryColor,
    secondaryColor,
    onPrimaryText: getAccessibleContrastText(primaryColor),
    onSecondaryText: getAccessibleContrastText(secondaryColor),
    primarySoftBg: withAlpha(primaryColor, isDark ? '26' : '14'),
    primaryBorder: withAlpha(primaryColor, isDark ? '55' : '38'),
    secondarySoftBg: withAlpha(secondaryColor, isDark ? '26' : '14'),
    logoUrl: normalizeOptionalUrl(business?.logoUrl),
    coverImageUrl: normalizeOptionalUrl(business?.coverImageUrl),
    presentationStyle,
    moduleHierarchy: preset.moduleHierarchy,
    source: {
      primaryColor: customPrimary
        ? 'business'
        : preset.defaultPrimaryColor
          ? 'sector'
          : 'theme',
      secondaryColor: customSecondary
        ? 'business'
        : preset.defaultSecondaryColor
          ? 'sector'
          : 'theme',
      presentationStyle: customStyle ? 'business' : 'sector',
    },
  };
}

export function useBusinessBrand(
  business?: BusinessBrandInput | null
): ResolvedBusinessBrand {
  const { colors } = useAppTheme();

  return useMemo(
    () => resolveBusinessBrand(business, colors),
    [
      business?.id,
      business?.name,
      business?.slug,
      business?.category,
      business?.categoryKey,
      business?.sector,
      business?.sectorTemplateId,
      business?.brandColor,
      business?.secondaryColor,
      business?.logoUrl,
      business?.coverImageUrl,
      business?.presentationStyle,
      colors.isDark,
      colors.action.primary,
    ]
  );
}
