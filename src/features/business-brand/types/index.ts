export type BusinessSectorKey =
  | 'restaurant'
  | 'barbershop_beauty'
  | 'health_clinic'
  | 'general';

export type BusinessPresentationStyle =
  | 'classic_scroll'
  | 'interactive_slides';

export type BusinessModuleKey =
  | 'about'
  | 'services'
  | 'staff'
  | 'gallery'
  | 'location_hours';

export interface SectorVisualPreset {
  key: BusinessSectorKey;
  label: string;
  badgeIcon: string;
  defaultPrimaryColor: string;
  defaultSecondaryColor: string;
  defaultPresentationStyle: BusinessPresentationStyle;
  moduleHierarchy: BusinessModuleKey[];
}

export interface BusinessBrandInput {
  id?: string;
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  categoryKey?: string | null;
  sector?: string | null;
  sectorTemplateId?: number | null;
  brandColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  presentationStyle?: string | null;
}

export interface BusinessBrandSource {
  primaryColor: 'business' | 'sector' | 'theme';
  secondaryColor: 'business' | 'sector' | 'theme';
  presentationStyle: 'business' | 'sector';
}

export interface ResolvedBusinessBrand {
  sector: BusinessSectorKey;
  preset: SectorVisualPreset;
  primaryColor: string;
  secondaryColor: string;
  onPrimaryText: string;
  onSecondaryText: string;
  primarySoftBg: string;
  primaryBorder: string;
  secondarySoftBg: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  presentationStyle: BusinessPresentationStyle;
  moduleHierarchy: BusinessModuleKey[];
  source: BusinessBrandSource;
}
