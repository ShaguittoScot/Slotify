import {
  getAccessibleContrastText,
  isValidHexColor,
  normalizeHexColor,
  resolveBusinessBrand,
  resolveSectorKey,
  SECTOR_VISUAL_PRESETS,
} from '../index';

describe('business-brand — Sistema de identidad visual adaptativa por sector', () => {
  describe('colorUtils (validación, normalización y contraste WCAG)', () => {
    it('valida y normaliza códigos hexadecimales #RGB y #RRGGBB', () => {
      expect(isValidHexColor('#abc')).toBe(true);
      expect(isValidHexColor('#0F766E')).toBe(true);
      expect(isValidHexColor('no-color')).toBe(false);
      expect(isValidHexColor('')).toBe(false);

      expect(normalizeHexColor('#abc')).toBe('#AABBCC');
      expect(normalizeHexColor('#0f766e')).toBe('#0F766E');
      expect(normalizeHexColor('#12345680')).toBe('#123456');
      expect(normalizeHexColor('invalid')).toBeNull();
    });

    it('calcula texto accesible en blanco u oscuro según luminancia del fondo', () => {
      expect(getAccessibleContrastText('#0F766E')).toBe('#FFFFFF');
      expect(getAccessibleContrastText('#1E293B')).toBe('#FFFFFF');
      expect(getAccessibleContrastText('#FACC15')).toBe('#111827');
      expect(getAccessibleContrastText('#E2E8F0')).toBe('#111827');
    });
  });

  describe('resolveSectorKey y presets de sector', () => {
    it('resuelve sectores por sectorTemplateId (1, 2, 3) y palabras clave', () => {
      expect(resolveSectorKey({ sectorTemplateId: 1 })).toBe('restaurant');
      expect(resolveSectorKey({ sectorTemplateId: 2 })).toBe('barbershop_beauty');
      expect(resolveSectorKey({ sectorTemplateId: 3 })).toBe('health_clinic');
      expect(resolveSectorKey({ category: 'Clínica Dental' })).toBe('health_clinic');
      expect(resolveSectorKey({ category: 'Restaurante Italiano' })).toBe('restaurant');
      expect(resolveSectorKey({ category: 'Barbería Clásica' })).toBe('barbershop_beauty');
      expect(resolveSectorKey({ category: 'Consultoría Legal' })).toBe('general');
    });
  });

  describe('resolveBusinessBrand (prioridad de 3 capas)', () => {
    it('aplica el preset del sector cuando el negocio no define colores personalizados', () => {
      const resolved = resolveBusinessBrand(
        {
          name: 'Clínica Vital',
          sectorTemplateId: 3,
        },
        { isDark: false, action: { primary: '#18181B' } as any }
      );

      expect(resolved.sector).toBe('health_clinic');
      expect(resolved.primaryColor).toBe(SECTOR_VISUAL_PRESETS.health_clinic.defaultPrimaryColor);
      expect(resolved.secondaryColor).toBe(SECTOR_VISUAL_PRESETS.health_clinic.defaultSecondaryColor);
      expect(resolved.presentationStyle).toBe('interactive_slides');
      expect(resolved.source.primaryColor).toBe('sector');
      expect(resolved.logoUrl).toBeNull();
      expect(resolved.coverImageUrl).toBeNull();
    });

    it('prioriza la personalización del negocio sobre los valores del sector', () => {
      const resolved = resolveBusinessBrand(
        {
          name: 'Bistró Casa del Sol',
          sectorTemplateId: 1,
          brandColor: '#c2410c',
          secondaryColor: '#431407',
          logoUrl: 'https://cdn.slotify.app/logo.png',
          presentationStyle: 'interactive_slides',
        },
        { isDark: true, action: { primary: '#6366F1' } as any }
      );

      expect(resolved.sector).toBe('restaurant');
      expect(resolved.primaryColor).toBe('#C2410C');
      expect(resolved.secondaryColor).toBe('#431407');
      expect(resolved.presentationStyle).toBe('interactive_slides');
      expect(resolved.logoUrl).toBe('https://cdn.slotify.app/logo.png');
      expect(resolved.coverImageUrl).toBeNull();
      expect(resolved.source.primaryColor).toBe('business');
      expect(resolved.source.secondaryColor).toBe('business');
      expect(resolved.source.presentationStyle).toBe('business');
    });

    it('ignora colores inválidos del negocio y conserva el preset del sector sin inventar medios', () => {
      const resolved = resolveBusinessBrand({
        name: 'Barbería Test',
        sectorTemplateId: 2,
        brandColor: 'rgb(0,0,0)',
        logoUrl: '   ',
      });

      expect(resolved.primaryColor).toBe(SECTOR_VISUAL_PRESETS.barbershop_beauty.defaultPrimaryColor);
      expect(resolved.source.primaryColor).toBe('sector');
      expect(resolved.logoUrl).toBeNull();
      expect(resolved.coverImageUrl).toBeNull();
    });
  });
});
