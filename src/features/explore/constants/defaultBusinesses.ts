/**
 * Explore Feature — Default / Offline Fallback Businesses Catalog
 * Garantiza que la sección de Explorar siempre muestre opciones atractivas y funcionales
 * para el consumidor incluso cuando el backend en la nube esté en despliegue, en migración o inaccesible.
 */

import type { BusinessDto } from '../types';

export const DEFAULT_BUSINESS_CATALOG: BusinessDto[] = [
  {
    id: 'biz-1',
    name: 'Central Barber Studio',
    slug: 'central-barber',
    category: 'Barbería & Estilo',
    categoryKey: 'barberia',
    phone: '+52 55 1234 5678',
    rating: 4.9,
    reviewCount: 142,
    address: 'Av. Hidalgo 402, Centro',
    timeZone: 'America/Mexico_City',
    minAdvanceHours: 2,
    maxAdvanceDays: 30,
    sectorTemplateId: 1,
    brandColor: '#818CF8',
    logoUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=240&auto=format&fit=crop&q=80',
    services: [
      { id: 's1', name: 'Corte Clásico + Barba', durationMinutes: 45, price: 250 },
      { id: 's2', name: 'Perfilado de Barba', durationMinutes: 20, price: 150 },
      { id: 's3', name: 'Tratamiento Facial y Toalla Caliente', durationMinutes: 30, price: 200 },
    ],
  },
  {
    id: 'biz-2',
    name: 'Clínica Dental Sonrisas',
    slug: 'dental-sonrisas',
    category: 'Salud & Consultorios',
    categoryKey: 'salud',
    phone: '+52 55 8765 4321',
    rating: 5.0,
    reviewCount: 89,
    address: 'Plaza Médica Norte, Local 12',
    timeZone: 'America/Mexico_City',
    minAdvanceHours: 3,
    maxAdvanceDays: 30,
    sectorTemplateId: 2,
    brandColor: '#34D399',
    logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=240&auto=format&fit=crop&q=80',
    services: [
      { id: 's4', name: 'Limpieza Dental Ultrasonido', durationMinutes: 40, price: 500 },
      { id: 's5', name: 'Valoración y Diagnóstico', durationMinutes: 30, price: 350 },
      { id: 's6', name: 'Blanqueamiento Express', durationMinutes: 60, price: 1200 },
    ],
  },
  {
    id: 'biz-3',
    name: 'Zen Spa & Masajes',
    slug: 'zen-spa',
    category: 'Spa & Masajes',
    categoryKey: 'spa',
    phone: '+52 55 9988 7766',
    rating: 4.8,
    reviewCount: 215,
    address: 'Calle del Sol 88, Jardines',
    timeZone: 'America/Mexico_City',
    minAdvanceHours: 2,
    maxAdvanceDays: 15,
    sectorTemplateId: 3,
    brandColor: '#F472B6',
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=240&auto=format&fit=crop&q=80',
    services: [
      { id: 's7', name: 'Masaje Relajante Completo', durationMinutes: 60, price: 650 },
      { id: 's8', name: 'Sesión de Aromaterapia', durationMinutes: 45, price: 450 },
      { id: 's9', name: 'Exfoliación Corporal', durationMinutes: 50, price: 550 },
    ],
  },
  {
    id: 'biz-4',
    name: 'Glam Studio & Salón',
    slug: 'glam-studio',
    category: 'Salón & Estética',
    categoryKey: 'belleza',
    phone: '+52 55 3344 5566',
    rating: 4.9,
    reviewCount: 98,
    address: 'Plaza Galerías, Nivel 2',
    timeZone: 'America/Mexico_City',
    minAdvanceHours: 2,
    maxAdvanceDays: 20,
    sectorTemplateId: 4,
    brandColor: '#A78BFA',
    logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=240&auto=format&fit=crop&q=80',
    services: [
      { id: 's10', name: 'Corte y Peinado Dama', durationMinutes: 50, price: 380 },
      { id: 's11', name: 'Manicura Spa y Gelish', durationMinutes: 45, price: 280 },
      { id: 's12', name: 'Balayage / Tinte Completo', durationMinutes: 120, price: 1400 },
    ],
  },
];

