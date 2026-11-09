import { storage } from '@/shared/lib/storage';
import type { FormSchema } from '../ui/screens/FormBuilderScreen';

export const FORM_SCHEMA_STORAGE_KEY = 'slotify_form_schema_v1';

export interface CorporateColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

export const CORPORATE_COLOR_PRESETS: CorporateColorPreset[] = [
  {
    id: 'indigo-violet',
    name: 'Índigo Corporativo',
    primary: '#6366F1',
    secondary: '#8B5CF6',
  },
  {
    id: 'barber-terracotta',
    name: 'Terracota & Bronce',
    primary: '#E07A5F',
    secondary: '#C57747',
  },
  {
    id: 'emerald-teal',
    name: 'Esmeralda Clínica',
    primary: '#10B981',
    secondary: '#0D9488',
  },
  {
    id: 'rose-glam',
    name: 'Rosa Salón & Spa',
    primary: '#EC4899',
    secondary: '#F43F5E',
  },
  {
    id: 'amber-gourmet',
    name: 'Ámbar & Oro',
    primary: '#D97706',
    secondary: '#F59E0B',
  },
  {
    id: 'ocean-blue',
    name: 'Azul Ejecutivo',
    primary: '#2563EB',
    secondary: '#06B6D4',
  },
  {
    id: 'obsidian-luxury',
    name: 'Obsidiana Luxury',
    primary: '#18181B',
    secondary: '#52525B',
  },
];

export const COLOR_SWATCHES: string[] = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#E07A5F',
  '#D97706',
  '#10B981',
  '#0D9488',
  '#2563EB',
  '#06B6D4',
  '#18181B',
  '#475569',
];

export interface PresetLogoOption {
  id: string;
  label: string;
  url: string;
}

export const PRESET_BRAND_LOGOS: PresetLogoOption[] = [
  {
    id: 'barber',
    label: 'Barbería',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'spa',
    label: 'Spa & Belleza',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'clinic',
    label: 'Clínica / Salud',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'gourmet',
    label: 'Restaurante',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=240&auto=format&fit=crop&q=80',
  },
];

/**
 * Validates whether a string is a valid 3- or 6-character HEX color
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex.trim());
}

/**
 * Normalizes user input into a valid #RRGGBB string or returns fallback
 */
export function normalizeHexColor(input: string, fallback = '#6366F1'): string {
  const cleaned = input.trim();
  const withHash = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
  if (isValidHexColor(withHash)) {
    return withHash.toUpperCase();
  }
  return fallback;
}

export async function saveFormSchemaLocally(schema: FormSchema): Promise<void> {
  await storage.set(FORM_SCHEMA_STORAGE_KEY, schema);
}

export async function loadFormSchemaLocally(): Promise<FormSchema | null> {
  return await storage.get<FormSchema>(FORM_SCHEMA_STORAGE_KEY);
}

