/**
 * Business Detail Feature — Types & Interfaces
 * Reutiliza y es 100% compatible con BusinessDto y BusinessServiceDto de Explore.
 */

import type { BusinessDto, BusinessServiceDto } from '@/features/explore/types';

export interface BusinessStaffMember {
  id: string;
  name: string;
  role?: string;
  specialty?: string;
  avatarUrl?: string;
  rating?: number;
}

export interface BusinessGalleryItem {
  id: string;
  imageUrl: string;
  title?: string;
  category?: string;
}

export interface BusinessScheduleItem {
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime: string;
  endTime: string;
  isClosed?: boolean;
}

export interface BusinessDetailDto extends BusinessDto {
  description?: string | null;
  coverImageUrl?: string | null;
  address?: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  staff?: BusinessStaffMember[];
  gallery?: (string | BusinessGalleryItem)[];
  hours?: BusinessScheduleItem[];
  highlights?: string[];
}

export type BusinessDetailServiceDto = BusinessServiceDto;
