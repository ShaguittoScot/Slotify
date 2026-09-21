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
        <Text style={styles.sectionTitle}>Plantillas Predefinidas</Text>
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
        <Text style={styles.sectionTitle}>Libre</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3250',
    letterSpacing: -0.2,
  },
  list: {
    gap: 4,
  },
  dividerContainer: {
    marginVertical: 12,
  },
});
