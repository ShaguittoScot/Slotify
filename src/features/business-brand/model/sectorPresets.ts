import type {
  BusinessBrandInput,
  BusinessSectorKey,
  SectorVisualPreset,
} from '../types';

export const SECTOR_VISUAL_PRESETS: Record<BusinessSectorKey, SectorVisualPreset> = {
  restaurant: {
    key: 'restaurant',
    label: 'Restaurante & Gastronomía',
    badgeIcon: 'coffee',
    defaultPrimaryColor: '#B45309',
    defaultSecondaryColor: '#78350F',
    defaultPresentationStyle: 'classic_scroll',
    moduleHierarchy: ['about', 'services', 'gallery', 'location_hours', 'staff'],
  },
  barbershop_beauty: {
    key: 'barbershop_beauty',
    label: 'Barbería & Estética',
    badgeIcon: 'scissors',
    defaultPrimaryColor: '#4F46E5',
    defaultSecondaryColor: '#312E81',
    defaultPresentationStyle: 'classic_scroll',
    moduleHierarchy: ['about', 'services', 'staff', 'gallery', 'location_hours'],
  },
  health_clinic: {
    key: 'health_clinic',
    label: 'Salud & Clínica',
    badgeIcon: 'heart',
    defaultPrimaryColor: '#0F766E',
    defaultSecondaryColor: '#0369A1',
    defaultPresentationStyle: 'interactive_slides',
    moduleHierarchy: ['about', 'services', 'staff', 'location_hours', 'gallery'],
  },
  general: {
    key: 'general',
    label: 'Servicios Generales',
    badgeIcon: 'briefcase',
    defaultPrimaryColor: '#6366F1',
    defaultSecondaryColor: '#4F46E5',
    defaultPresentationStyle: 'classic_scroll',
    moduleHierarchy: ['about', 'services', 'staff', 'gallery', 'location_hours'],
  },
};

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveSectorKey(
  input?: Pick<
    BusinessBrandInput,
    'sectorTemplateId' | 'categoryKey' | 'category' | 'sector'
  > | null
): BusinessSectorKey {
  if (!input) return 'general';

  if (input.sectorTemplateId === 1) return 'restaurant';
  if (input.sectorTemplateId === 2) return 'barbershop_beauty';
  if (input.sectorTemplateId === 3) return 'health_clinic';

  const combined = `${normalizeText(input.categoryKey)} ${normalizeText(input.category)} ${normalizeText(input.sector)}`;

  if (
    combined.includes('restaur') ||
    combined.includes('gastron') ||
    combined.includes('cafeter') ||
    combined.includes('comida') ||
    combined.includes('bistro')
  ) {
    return 'restaurant';
  }

  if (
    combined.includes('barber') ||
    combined.includes('estetic') ||
    combined.includes('salon') ||
    combined.includes('belleza') ||
    combined.includes('peluquer')
  ) {
    return 'barbershop_beauty';
  }

  if (
    combined.includes('salud') ||
    combined.includes('clinic') ||
    combined.includes('dental') ||
    combined.includes('medic') ||
    combined.includes('consultorio') ||
    combined.includes('fisio') ||
    combined.includes('nutric')
  ) {
    return 'health_clinic';
  }

  return 'general';
}
