import { isValidHexColor, formatPrice } from '../model';
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
});
