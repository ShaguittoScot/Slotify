import {
  isValidHexColor,
  normalizeHexColor,
  CORPORATE_COLOR_PRESETS,
  PRESET_BRAND_LOGOS,
  saveFormSchemaLocally,
  loadFormSchemaLocally,
} from '../src/features/dashboard/model/formBranding';
import type { FormSchema } from '../src/features/dashboard/ui/screens/FormBuilderScreen';

describe('Form Branding & Identity Configuration', () => {
  it('validates 3-digit and 6-digit hexadecimal corporate colors', () => {
    expect(isValidHexColor('#6366F1')).toBe(true);
    expect(isValidHexColor('#E07A5F')).toBe(true);
    expect(isValidHexColor('#FFF')).toBe(true);
    expect(isValidHexColor('6366F1')).toBe(false);
    expect(isValidHexColor('#GGGGGG')).toBe(false);
  });

  it('normalizes user hex input and falls back safely when invalid', () => {
    expect(normalizeHexColor('e07a5f')).toBe('#E07A5F');
    expect(normalizeHexColor('#10b981')).toBe('#10B981');
    expect(normalizeHexColor('invalid-color', '#6366F1')).toBe('#6366F1');
  });

  it('provides corporate color presets and brand logo samples', () => {
    expect(CORPORATE_COLOR_PRESETS.length).toBeGreaterThan(0);
    CORPORATE_COLOR_PRESETS.forEach((preset) => {
      expect(isValidHexColor(preset.primary)).toBe(true);
      expect(isValidHexColor(preset.secondary)).toBe(true);
    });
    expect(PRESET_BRAND_LOGOS.length).toBeGreaterThan(0);
  });

  it('persists and hydrates form schema with logoUrl and corporate colors', async () => {
    const mockSchema: FormSchema = {
      title: 'Reserva en Barbería Imperial',
      description: 'Agenda tu corte o ritual de barba',
      presentationStyle: 'classic_scroll',
      accentColor: '#E07A5F',
      secondaryColor: '#C57747',
      logoUrl: 'https://mi-barberia.com/logo.png',
      businessName: 'Barbería Imperial',
      fields: [
        { id: 'f1', type: 'short_text', question: 'Nombre del cliente', required: true },
      ],
    };

    await saveFormSchemaLocally(mockSchema);
    const loaded = await loadFormSchemaLocally();

    expect(loaded).not.toBeNull();
    expect(loaded?.logoUrl).toBe('https://mi-barberia.com/logo.png');
    expect(loaded?.accentColor).toBe('#E07A5F');
    expect(loaded?.secondaryColor).toBe('#C57747');
    expect(loaded?.businessName).toBe('Barbería Imperial');
  });
});

