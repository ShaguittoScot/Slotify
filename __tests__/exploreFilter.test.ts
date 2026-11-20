jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

import {
  selectExploreCategories,
  selectFilteredBusinesses,
} from '../src/features/explore/model';
import type { BusinessDto } from '../src/features/explore/types';

describe('Explore Feature — Categorías y Filtros por Defecto', () => {
  const mockBusinesses: BusinessDto[] = [
    {
      id: 'b1',
      name: 'Barbería Imperial',
      slug: 'barberia-imperial',
      phone: '555-111-2222',
      category: 'Barbería y Estilo',
      categoryKey: 'barberia-y-estilo',
      services: [],
    },
    {
      id: 'b2',
      name: 'Spa Serenidad',
      slug: 'spa-serenidad',
      phone: '555-333-4444',
      category: 'Spa y Masajes',
      categoryKey: 'spa-y-masajes',
      services: [],
    },
    {
      id: 'b3',
      name: 'Clínica Dental Sonrisas',
      slug: 'clinica-dental',
      phone: '555-555-6666',
      category: 'Salud y Consultorios',
      categoryKey: 'salud-y-consultorios',
      services: [],
    },
  ];

  it('selectExploreCategories siempre incluye "Todos" (key: "all") como primera categoría', () => {
    const categories = selectExploreCategories(mockBusinesses);

    expect(categories.length).toBe(4);
    expect(categories[0]).toEqual({ id: 'all', name: 'Todos', key: 'all' });
    expect(categories.map((c) => c.key)).toContain('barberia-y-estilo');
    expect(categories.map((c) => c.key)).toContain('spa-y-masajes');
    expect(categories.map((c) => c.key)).toContain('salud-y-consultorios');
  });

  it('cuando selectedCategoryKey es "all", muestra TODOS los negocios (nunca vacío por defecto)', () => {
    const results = selectFilteredBusinesses(mockBusinesses, '', 'all');
    expect(results.length).toBe(3);
  });

  it('cuando selectedCategoryKey es vacío, null o undefined, asume "all" por defecto y muestra todos los negocios', () => {
    const resultsEmpty = selectFilteredBusinesses(mockBusinesses, '', '');
    const resultsNull = selectFilteredBusinesses(mockBusinesses, '', null as any);
    const resultsUndefined = selectFilteredBusinesses(mockBusinesses, '', undefined as any);

    expect(resultsEmpty.length).toBe(3);
    expect(resultsNull.length).toBe(3);
    expect(resultsUndefined.length).toBe(3);
  });

  it('cuando se selecciona una categoría específica existente, filtra correctamente', () => {
    const results = selectFilteredBusinesses(mockBusinesses, '', 'spa-y-masajes');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Spa Serenidad');
  });

  it('filtra correctamente con búsqueda de texto combinada con categoría', () => {
    const results = selectFilteredBusinesses(mockBusinesses, 'imperial', 'all');
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe('barberia-imperial');
  });
});
