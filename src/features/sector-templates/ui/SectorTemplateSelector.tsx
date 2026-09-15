/**
 * US-006: SectorTemplateSelector
 * 
 * Lista modular y organizada de categorías comerciales:
 * - Sección de rubros recomendados con plantillas afines
 * - Sección de lienzo libre ("Otro / Servicios Generales")
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SectorTemplateCard } from './SectorTemplateCard';
import type { SectorCategory } from '../types';

interface SectorTemplateSelectorProps {
  categories: SectorCategory[];
  selectedCategoryId: number | null;
  onSelectCategory: (category: SectorCategory) => void;
  disabled?: boolean;
}

export const SectorTemplateSelector: React.FC<SectorTemplateSelectorProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  disabled = false,
}) => {
  const suggestedCategories = categories.filter((cat) => !cat.isCustomCanvas);
  const generalCategories = categories.filter((cat) => cat.isCustomCanvas);

  return (
    <View style={styles.container} testID="sector-template-selector">
      {/* Sección 1: Categorías Recomendadas */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionKickerRow}>
          <View style={styles.sectionKickerDot} />
          <Text style={styles.sectionKicker}>PLANTILLAS PREDEFINIDAS</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Selecciona tu sector para precargar servicios, duraciones y módulos sugeridos
        </Text>
      </View>

      <View style={styles.list}>
        {suggestedCategories.map((category, index) => (
          <SectorTemplateCard
            key={category.id}
            category={category}
            index={index}
            isSelected={selectedCategoryId === category.id}
            onSelect={onSelectCategory}
            disabled={disabled}
          />
        ))}
      </View>

      {/* Separador elegante con etiqueta */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>O PERSONALIZACIÓN LIBRE</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Sección 2: Otro / Servicios Generales (Lienzo Libre) */}
      <View style={styles.list}>
        {generalCategories.map((category, index) => (
          <SectorTemplateCard
            key={category.id}
            category={category}
            index={suggestedCategories.length + index}
            isSelected={selectedCategoryId === category.id}
            onSelect={onSelectCategory}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionKickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818CF8',
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A5B4FC',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
  },
  list: {
    gap: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#64748B',
  },
});
