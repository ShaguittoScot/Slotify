const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export function isValidHexColor(color?: string | null): boolean {
  if (!color || typeof color !== 'string') return false;
  return HEX_COLOR_REGEX.test(color.trim());
}

/**
 * Normaliza #RGB o #RRGGBB a #RRGGBB en mayúsculas.
 * Si incluye canal alfa (#RRGGBBAA), conserva los primeros 6 dígitos RGB para cálculos de contraste.
 */
export function normalizeHexColor(color?: string | null): string | null {
  if (!isValidHexColor(color)) return null;
  const raw = color!.trim().slice(1).toUpperCase();

  if (raw.length === 3) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }

  return `#${raw.slice(0, 6)}`;
}

export function withAlpha(hexColor: string, alphaHex: string): string {
  const normalized = normalizeHexColor(hexColor) ?? '#6366F1';
  const cleanAlpha = alphaHex.replace('#', '').slice(0, 2).padEnd(2, 'F');
  return `${normalized}${cleanAlpha}`;
}

function channelToLinear(channel255: number): number {
  const srgb = channel255 / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hexColor: string): number {
  const normalized = normalizeHexColor(hexColor) ?? '#6366F1';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Selecciona texto claro u oscuro garantizando el mayor contraste WCAG sobre el color de marca.
 */
export function getAccessibleContrastText(
  backgroundHex: string,
  lightText: string = '#FFFFFF',
  darkText: string = '#111827'
): string {
  const contrastLight = getContrastRatio(backgroundHex, lightText);
  const contrastDark = getContrastRatio(backgroundHex, darkText);
  return contrastLight >= contrastDark ? lightText : darkText;
}
