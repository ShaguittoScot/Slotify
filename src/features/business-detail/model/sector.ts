/**
 * Business Detail — Sector Adaptation Model
 * 
 * Configuración dinámica de la página pública del negocio según su giro comercial:
 * 1. Restaurantes: Menú, especialidades y fotografías de platillos/ambiente.
 * 2. Barbería / Estética: Servicios, profesionales (barberos/estilistas) y galería de trabajos.
 * 3. Salud / Clínica: Especialidades, profesionales médicos e instalaciones clínicas.
 * 4. General / Servicios: Servicios generales, propuesta de valor y atención.
 */

import type { BusinessStaffMember, BusinessGalleryItem } from '../types';

export type BusinessSectorType =
  | 'restaurant'
  | 'barbershop_beauty'
  | 'health_clinic'
  | 'general';

export interface SectorConfig {
  type: BusinessSectorType;
  label: string;
  badgeIcon: string;
  catalogTitle: string;
  catalogSubtitle: string;
  catalogBadge: string;
  staffTitle: string;
  staffSubtitle: string;
  showStaffByDefault: boolean;
  galleryTitle: string;
  gallerySubtitle: string;
  hoursTitle: string;
  ctaText: string;
  ctaIcon: string;
  defaultHighlights: string[];
  defaultStaff: BusinessStaffMember[];
  defaultGallery: BusinessGalleryItem[];
}

export const RESTAURANT_SECTOR_CONFIG: SectorConfig = {
  type: 'restaurant',
  label: 'Restaurante & Gastronomía',
  badgeIcon: 'coffee',
  catalogTitle: 'Menú y Especialidades',
  catalogSubtitle: 'Platillos destacados, especialidades de la casa y bebidas',
  catalogBadge: 'Menú',
  staffTitle: 'Nuestra Cocina & Chefs',
  staffSubtitle: 'El equipo culinario detrás de nuestras recetas',
  showStaffByDefault: false, // En restaurantes se prioriza platillos y ambiente
  galleryTitle: 'Fotografías & Especialidades',
  gallerySubtitle: 'Conoce nuestros platillos, coctelería y ambiente gastronómico',
  hoursTitle: 'Horarios de Servicio y Cocina',
  ctaText: 'Reservar mesa o turno',
  ctaIcon: 'calendar',
  defaultHighlights: [
    'Ingredientes frescos y de temporada',
    'Cocina artesanal y de autor',
    'Ambiente climatizado y terraza',
    'Reserva de mesa garantizada',
  ],
  defaultStaff: [
    { id: 'chef-1', name: 'Chef Ejecutivo', role: 'Jefe de Cocina', specialty: 'Especialidades & Carnes' },
    { id: 'chef-2', name: 'Sommelier de la Casa', role: 'Bebidas & Maridaje', specialty: 'Vinos & Coctelería' },
  ],
  defaultGallery: [
    {
      id: 'rest-1',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      title: 'Ambiente del Comedor Principal',
      category: 'Ambiente',
    },
    {
      id: 'rest-2',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
      title: 'Corte Especial a la Parrilla',
      category: 'Especialidades',
    },
    {
      id: 'rest-3',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      title: 'Terraza y Servicio de Mesa',
      category: 'Instalaciones',
    },
    {
      id: 'rest-4',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
      title: 'Selección de Maridaje & Bebidas',
      category: 'Bebidas',
    },
  ],
};

export const BARBERSHOP_SECTOR_CONFIG: SectorConfig = {
  type: 'barbershop_beauty',
  label: 'Barbería & Estética',
  badgeIcon: 'scissors',
  catalogTitle: 'Servicios y Tratamientos',
  catalogSubtitle: 'Cortes de cabello, cuidado de barba, tratamientos y estilo',
  catalogBadge: 'Servicios',
  staffTitle: 'Profesionales y Estilistas',
  staffSubtitle: 'Especialistas certificados dedicados a tu imagen y cuidado personal',
  showStaffByDefault: true,
  galleryTitle: 'Galería de Trabajos',
  gallerySubtitle: 'Cortes, degradados, perfilado de barba y acabados reales',
  hoursTitle: 'Horarios de Atención y Sillones',
  ctaText: 'Reservar cita',
  ctaIcon: 'calendar',
  defaultHighlights: [
    'Atención puntual sin esperas',
    'Barberos y estilistas certificados',
    'Productos profesionales de alta gama',
    'Ritual de toalla caliente y navaja libre',
  ],
  defaultStaff: [
    { id: 'barber-1', name: 'Barbero Titular', role: 'Master Barber', specialty: 'Degradados & Navaja' },
    { id: 'barber-2', name: 'Especialista en Barba', role: 'Estilista Senior', specialty: 'Cuidado & Perfilado' },
    { id: 'barber-3', name: 'Diseñador de Estilo', role: 'Colorista & Corte', specialty: 'Tendencias & Acabados' },
  ],
  defaultGallery: [
    {
      id: 'barber-1',
      imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
      title: 'Sillones y Espacio Tradicional',
      category: 'Instalaciones',
    },
    {
      id: 'barber-2',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      title: 'Perfilado Clásico a Navaja',
      category: 'Trabajos',
    },
    {
      id: 'barber-3',
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80',
      title: 'Corte y Fade de Precisión',
      category: 'Estilo',
    },
    {
      id: 'barber-4',
      imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80',
      title: 'Tratamiento de Barba & Toalla',
      category: 'Cuidado',
    },
  ],
};

export const HEALTH_SECTOR_CONFIG: SectorConfig = {
  type: 'health_clinic',
  label: 'Salud & Bienestar',
  badgeIcon: 'activity',
  catalogTitle: 'Especialidades y Consultas',
  catalogSubtitle: 'Consultas médicas, valoraciones diagnósticas y tratamientos clínicos',
  catalogBadge: 'Especialidades',
  staffTitle: 'Especialistas y Cuerpo Médico',
  staffSubtitle: 'Profesionales de la salud colegiados con atención personalizada',
  showStaffByDefault: true,
  galleryTitle: 'Instalaciones y Consultorios',
  gallerySubtitle: 'Equipamiento clínico de vanguardia, consultorios y recepción higienizada',
  hoursTitle: 'Horarios de Consulta Médica',
  ctaText: 'Agendar consulta',
  ctaIcon: 'calendar',
  defaultHighlights: [
    'Protocolos estrictos de higiene y esterilización',
    'Atención médica privada y confidencial',
    'Historial clínico y seguimiento digital',
    'Instalaciones modernas y accesibles',
  ],
  defaultStaff: [
    { id: 'doc-1', name: 'Dr. Titular de Consulta', role: 'Médico Especialista', specialty: 'Diagnóstico & Consulta General' },
    { id: 'doc-2', name: 'Dra. en Rehabilitación', role: 'Fisioterapia & Cuidados', specialty: 'Terapia Integral' },
    { id: 'doc-3', name: 'Especialista Odontológico', role: 'Cirujano Dentista', specialty: 'Salud Oral & Profilaxis' },
  ],
  defaultGallery: [
    {
      id: 'clinic-1',
      imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
      title: 'Consultorio Dental y Clínico',
      category: 'Consultorios',
    },
    {
      id: 'clinic-2',
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
      title: 'Sala de Espera y Recepción',
      category: 'Recepción',
    },
    {
      id: 'clinic-3',
      imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=800&auto=format&fit=crop&q=80',
      title: 'Área de Diagnóstico Equipado',
      category: 'Equipamiento',
    },
    {
      id: 'clinic-4',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      title: 'Consultorio Privado de Atención',
      category: 'Atención',
    },
  ],
};

export const GENERAL_SECTOR_CONFIG: SectorConfig = {
  type: 'general',
  label: 'Servicios Profesionales',
  badgeIcon: 'briefcase',
  catalogTitle: 'Catálogo de Servicios',
  catalogSubtitle: 'Consulta las opciones ofrecidas antes de iniciar tu reserva',
  catalogBadge: 'Servicios',
  staffTitle: 'Equipo Profesional',
  staffSubtitle: 'Especialistas a tu disposición para brindarte la mejor atención',
  showStaffByDefault: false,
  galleryTitle: 'Instalaciones y Espacios',
  gallerySubtitle: 'Conoce nuestro espacio de trabajo y atención personalizada',
  hoursTitle: 'Horarios de Atención',
  ctaText: 'Reservar cita',
  ctaIcon: 'calendar',
  defaultHighlights: [
    'Atención profesional garantizada',
    'Confirmación inmediata de cita',
    'Espacios cómodos y preparados',
    'Gestión transparente y puntual',
  ],
  defaultStaff: [
    { id: 'gen-1', name: 'Responsable de Atención', role: 'Especialista Principal', specialty: 'Atención al Cliente' },
  ],
  defaultGallery: [
    {
      id: 'gen-1',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      title: 'Espacio de Atención y Oficina',
      category: 'Instalaciones',
    },
    {
      id: 'gen-2',
      imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80',
      title: 'Recepción y Sala de Juntas',
      category: 'Recepción',
    },
  ],
};

/**
 * Detecta el sector del negocio a partir de sus metadatos (sectorTemplateId, categoryKey, category).
 */
export function detectSector(business?: {
  category?: string | null;
  categoryKey?: string | null;
  sectorTemplateId?: number | null;
}): SectorConfig {
  const cat = (business?.category || '').toLowerCase().trim();
  const key = (business?.categoryKey || '').toLowerCase().trim();
  const id = business?.sectorTemplateId;

  // 1. Restaurante & Gastronomía
  if (
    cat.includes('restauran') ||
    cat.includes('gastronom') ||
    cat.includes('comida') ||
    cat.includes('café') ||
    cat.includes('cafe') ||
    /\bbar\b/.test(cat) ||
    cat.includes('bistr') ||
    key.includes('restauran') ||
    key.includes('gastronom') ||
    key.includes('comida')
  ) {
    return RESTAURANT_SECTOR_CONFIG;
  }

  // 2. Salud & Bienestar Clínico
  if (
    id === 1 ||
    cat.includes('salud') ||
    cat.includes('clínic') ||
    cat.includes('clinic') ||
    cat.includes('médic') ||
    cat.includes('medic') ||
    cat.includes('dental') ||
    cat.includes('odontol') ||
    cat.includes('fisioter') ||
    cat.includes('nutric') ||
    cat.includes('psicol') ||
    key.includes('salud') ||
    key.includes('clinic') ||
    key.includes('dental')
  ) {
    return HEALTH_SECTOR_CONFIG;
  }

  // 3. Barbería & Cuidado Personal / Estética
  if (
    id === 2 ||
    id === 5 ||
    cat.includes('barber') ||
    cat.includes('belleza') ||
    cat.includes('estétic') ||
    cat.includes('estetic') ||
    cat.includes('peluquer') ||
    cat.includes('salón') ||
    cat.includes('salon') ||
    cat.includes('spa') ||
    cat.includes('uñas') ||
    cat.includes('unas') ||
    key.includes('barber') ||
    key.includes('belleza') ||
    key.includes('estetic') ||
    key.includes('spa')
  ) {
    return BARBERSHOP_SECTOR_CONFIG;
  }

  // 4. General / Otros
  return GENERAL_SECTOR_CONFIG;
}
