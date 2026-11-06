/**
 * Explore Feature — Types & Interfaces
 */

export interface BusinessServiceDto {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export type BusinessServiceItem = BusinessServiceDto;

export interface BusinessDto {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  category: string;
  categoryKey?: string;
  timeZone?: string;
  minAdvanceHours?: number;
  maxAdvanceDays?: number;
  sectorTemplateId?: number | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  services: BusinessServiceDto[];
  address?: string;
  rating?: number;
  reviewCount?: number;
}

export type Business = BusinessDto;
export type BusinessItem = BusinessDto;

export interface Category {
  id: string;
  name: string;
  key: string;
}

export interface SearchFilters {
  query: string;
  categoryKey: string;
}

