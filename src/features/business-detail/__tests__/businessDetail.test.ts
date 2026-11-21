import { isValidHexColor, formatPrice, detectSector } from '../model';
import { businessDetailApi } from '../api';
import { apiClient } from '@/shared/lib/api';
import type { BusinessDetailDto } from '../types';

jest.mock('@/shared/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('Business Detail Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidHexColor', () => {
    it('valida colores hexadecimales de 3, 6 y 8 caracteres', () => {
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#4F46E5')).toBe(true);
      expect(isValidHexColor('#4F46E5AA')).toBe(true);
      expect(isValidHexColor('  #121212  ')).toBe(true);
    });

    it('invalida colores incorrectos, nulos o no hexadecimales', () => {
      expect(isValidHexColor('red')).toBe(false);
      expect(isValidHexColor('123456')).toBe(false);
      expect(isValidHexColor('#xyz')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
      expect(isValidHexColor(null)).toBe(false);
      expect(isValidHexColor(undefined)).toBe(false);
    });
  });

  describe('formatPrice', () => {
    it('formatea precios a formato de moneda con dos decimales', () => {
      expect(formatPrice(150)).toBe('$150.00');
      expect(formatPrice(29.9)).toBe('$29.90');
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('maneja valores no numéricos devolviendo $0.00', () => {
      expect(formatPrice(NaN)).toBe('$0.00');
      expect(formatPrice(undefined as any)).toBe('$0.00');
    });
  });

  describe('businessDetailApi', () => {
    it('consume el endpoint GET /api/businesses/{slug} correctamente', async () => {
      const mockBusiness: BusinessDetailDto = {
        id: 'biz-1',
        name: 'Barbería Imperial',
        slug: 'barberia-imperial',
        category: 'Barbería',
        categoryKey: 'barberia',
        phone: '555-123-4567',
        timeZone: 'America/Mexico_City',
        minAdvanceHours: 2,
        maxAdvanceDays: 30,
        services: [
          {
            id: 'svc-1',
            name: 'Corte Clásico',
            price: 250,
            durationMinutes: 45,
            isActive: true,
          },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBusiness });

      const result = await businessDetailApi.getBusinessBySlug('barberia-imperial');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/businesses/barberia-imperial');
      expect(result).toEqual(mockBusiness);
    });

    it('codifica el slug para evitar inyecciones o caracteres inválidos en la URL', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });

      await businessDetailApi.getBusinessBySlug('barbería y estilo');

      expect(apiClient.get).toHaveBeenCalledWith('/businesses/barber%C3%ADa%20y%20estilo');
    });
  });

  describe('Filtro de servicios activos', () => {
    it('filtra servicios inactivos (isActive === false) y conserva los activos', () => {
      const services = [
        { id: '1', name: 'Corte Activo', price: 200, durationMinutes: 30, isActive: true },
        { id: '2', name: 'Servicio Inactivo', price: 100, durationMinutes: 15, isActive: false },
        { id: '3', name: 'Servicio Sin Flag', price: 300, durationMinutes: 60 },
      ];

      const activeServices = services.filter((s) => s.isActive !== false);

      expect(activeServices).toHaveLength(2);
      expect(activeServices.map((s) => s.name)).toEqual(['Corte Activo', 'Servicio Sin Flag']);
    });
  });

  describe('detectSector (Adaptación comercial por sector)', () => {
    it('detecta sector Restaurantes y adapta catálogo a menú y platillos', () => {
      const config1 = detectSector({ category: 'Restaurante Gourmet', categoryKey: 'restaurante' });
      expect(config1.type).toBe('restaurant');
      expect(config1.catalogTitle).toBe('Menú y Especialidades');
      expect(config1.ctaText).toBe('Reservar mesa o turno');
      expect(config1.showStaffByDefault).toBe(false);

      const config2 = detectSector({ category: 'Café & Bistro', categoryKey: 'cafe' });
      expect(config2.type).toBe('restaurant');
    });

    it('detecta sector Barbería / Estética y prioriza profesionales y galería de cortes', () => {
      const config1 = detectSector({ sectorTemplateId: 5, category: 'Barbería Clásica' });
      expect(config1.type).toBe('barbershop_beauty');
      expect(config1.catalogTitle).toBe('Servicios y Tratamientos');
      expect(config1.staffTitle).toBe('Profesionales y Estilistas');
      expect(config1.galleryTitle).toBe('Galería de Trabajos');
      expect(config1.showStaffByDefault).toBe(true);

      const config2 = detectSector({ category: 'Salón de Belleza y Spa', categoryKey: 'belleza' });
      expect(config2.type).toBe('barbershop_beauty');
    });

    it('detecta sector Salud / Clínica y adapta a especialidades, cuerpo médico e instalaciones', () => {
      const config1 = detectSector({ sectorTemplateId: 1, category: 'Salud y Bienestar' });
      expect(config1.type).toBe('health_clinic');
      expect(config1.catalogTitle).toBe('Especialidades y Consultas');
      expect(config1.staffTitle).toBe('Especialistas y Cuerpo Médico');
      expect(config1.galleryTitle).toBe('Instalaciones y Consultorios');
      expect(config1.ctaText).toBe('Agendar consulta');
      expect(config1.showStaffByDefault).toBe(true);

      const config2 = detectSector({ category: 'Clínica Dental Odontológica' });
      expect(config2.type).toBe('health_clinic');
    });

    it('retorna configuración General cuando no pertenece a giros especializados', () => {
      const config = detectSector({ category: 'Consultoría y Asesoría Legal', categoryKey: 'legal' });
      expect(config.type).toBe('general');
      expect(config.catalogTitle).toBe('Catálogo de Servicios');
      expect(config.ctaText).toBe('Reservar cita');
    });
  });
});
