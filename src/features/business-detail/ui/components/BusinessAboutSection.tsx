import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto } from '../../types';
import type { SectorConfig } from '../../model/sector';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessAboutSectionProps {
  business: BusinessDetailDto;
  sector: SectorConfig;
  accentColor: string;
}

export function BusinessAboutSection({
  business,
  sector,
  accentColor,
}: BusinessAboutSectionProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessDetailStyles(colors, accentColor);

  const description =
    business.description?.trim() ||
    `Te damos la bienvenida a ${business.name}. Nos enfocamos en brindarte una experiencia de calidad superior en ${business.category || sector.label}, con atención personalizada y los más altos estándares para que disfrutes de tu visita.`;

  const highlights =
    business.highlights && business.highlights.length > 0
      ? business.highlights
      : sector.defaultHighlights;

  const highlightIcons = ['check-circle', 'award', 'shield', 'clock', 'star'];

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sobre nosotros</Text>
        <Text style={styles.sectionSubtitle}>
          Conoce nuestra propuesta de valor y experiencia de servicio
        </Text>
      </View>

      <Text style={styles.aboutText}>{description}</Text>

      {highlights.length > 0 && (
        <View style={styles.highlightsContainer}>
          {highlights.map((highlight, index) => {
            const iconName = highlightIcons[index % highlightIcons.length] as any;
            return (
              <View key={index} style={styles.highlightChip}>
                <Feather name={iconName} size={13} color={accentColor} />
                <Text style={styles.highlightChipText}>{highlight}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
