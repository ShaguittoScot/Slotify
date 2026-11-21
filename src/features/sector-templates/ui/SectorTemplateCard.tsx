/**
 * US-006: SectorTemplateCard
 * 
 * Componente con micro-interacciones y animaciones de física de resorte (Spring Physics):
 * - Entrada escalonada fluida (FadeInDown con delay por índice y springify)
 * - Micro-feedback de escala táctil instantánea al presionar con withSpring
 * - Animación elástica del punto de radio al activarse (pop elástico)
 * - Barra luminosa de acento animada con resorte
 * - Superficie Frosted Glass con bordes biselados y halo luminoso
 */

import React, { ComponentProps, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { SectorCategory } from '../types';

interface SectorTemplateCardProps {
  category: SectorCategory;
  isSelected: boolean;
  onSelect: (category: SectorCategory) => void;
  disabled?: boolean;
  index?: number;
}

type FeatherIconName = ComponentProps<typeof Feather>['name'];

function getFeatherIcon(iconName: string): FeatherIconName {
  switch (iconName) {
    case 'heart.fill':
      return 'heart';
    case 'sparkles':
      return 'star';
    case 'figure.run':
      return 'activity';
    case 'briefcase.fill':
      return 'briefcase';
    case 'square.grid.2x2':
      return 'layers';
    default:
      return 'grid';
  }
}

export const SectorTemplateCard: React.FC<SectorTemplateCardProps> = ({
  category,
  isSelected,
  onSelect,
  disabled = false,
  index = 0,
}) => {
  const { colors, isDark } = useAppTheme();
  const iconName = getFeatherIcon(category.iconName);
  const accentColor = category.isCustomCanvas ? '#10B981' : colors.action.primary;

  // Micro-interacción: escala de resorte al tocar
  const pressScale = useSharedValue(1);

  // Animación elástica del punto de selección radio
  const radioScale = useSharedValue(isSelected ? 1 : 0);

  // Animación de la barra lateral de acento luminosa
  const glowBarScale = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    radioScale.value = withSpring(isSelected ? 1 : 0, {
      damping: 11,
      stiffness: 260,
      mass: 0.5,
    });
    glowBarScale.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isSelected]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const animatedRadioStyle = useAnimatedStyle(() => ({
    transform: [{ scale: radioScale.value }],
  }));

  const animatedGlowBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: glowBarScale.value }],
    opacity: glowBarScale.value,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      pressScale.value = withSpring(0.972, { damping: 14, stiffness: 240, mass: 0.8 });
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 240, mass: 0.8 });
  };

  // Estilos de cristal esmerilado real para Web
  const webGlassStyle = Platform.OS === 'web' ? ({
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: isSelected
      ? (category.isCustomCanvas
          ? '0 0 16px rgba(63, 91, 88, 0.15)'
          : '0 0 16px rgba(197, 119, 71, 0.15)')
      : '0 2px 10px rgba(0, 0, 0, 0.02)',
    transition: 'border 0.2s ease, background-color 0.2s ease, box-shadow 0.25s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
  } as any) : {};

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(16).stiffness(130)}
      style={[styles.animatedWrapper, animatedCardStyle]}
    >
      <Pressable
        testID={`sector-card-${category.key}`}
        accessible={true}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected, disabled }}
        accessibilityLabel={`${category.name}. ${category.tagline}`}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect(category)}
        style={[
          styles.cardContainer,
          {
            backgroundColor: isSelected
              ? colors.background.secondary
              : isDark
                ? 'rgba(20, 20, 20, 0.88)'
                : 'rgba(255, 255, 255, 0.85)',
            borderColor: isSelected ? accentColor : colors.border.main,
          },
          webGlassStyle,
          isSelected && { shadowOpacity: 0.08, elevation: 3 },
          disabled && styles.cardDisabled,
        ]}
      >
        {/* Barra lateral de acento luminosa con resorte */}
        <Animated.View
          style={[
            styles.glowBar,
            { backgroundColor: accentColor },
            animatedGlowBarStyle,
          ]}
        />

        {/* Icono temático */}
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: isSelected
                ? category.isCustomCanvas
                  ? 'rgba(16, 185, 129, 0.14)'
                  : colors.background.tertiary
                : colors.background.primary,
              borderColor: isSelected ? accentColor : colors.border.main,
            },
          ]}
        >
          <Feather
            name={iconName}
            size={20}
            color={isSelected ? accentColor : colors.text.muted}
          />
        </View>

        {/* Textos descriptivos */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.title, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {category.name}
            </Text>

          </View>

          <Text style={[styles.tagline, { color: colors.text.muted }]} numberOfLines={1}>
            {category.tagline}
          </Text>
        </View>

        {/* Indicador de Selección Radio con Spring Pop */}
        <View
          style={[
            styles.radioRing,
            {
              borderColor: isSelected ? accentColor : colors.border.strong,
              backgroundColor: isSelected
                ? category.isCustomCanvas
                  ? 'rgba(16, 185, 129, 0.12)'
                  : colors.background.tertiary
                : 'transparent',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.radioDot,
              { backgroundColor: accentColor },
              animatedRadioStyle,
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedWrapper: {
    width: '100%',
  },
  cardContainer: {
    minHeight: 70,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#E3E5E6',
    marginVertical: 5,
    overflow: 'hidden',
    shadowColor: '#2D3250',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  glowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: '#C57747',
    borderRadius: 2,
  },
  glowBarCustom: {
    backgroundColor: '#3F5B58',
  },

  cardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C57747',
    shadowOpacity: 0.06,
    elevation: 3,
  },
  cardCustomSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3F5B58',
    shadowOpacity: 0.06,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.4,
  },

  // Icon Badge
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  iconBadgeDefault: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E3E5E6',
  },
  iconBadgeSelected: {
    backgroundColor: '#FFF4ED',
    borderColor: '#C57747',
  },
  iconBadgeCustomSelected: {
    backgroundColor: '#F0F5F4',
    borderColor: '#3F5B58',
  },

  // Text Container
  textContainer: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#2D3250',
  },
  titleSelected: {
    color: '#2D3250',
  },
  tagline: {
    fontSize: 13,
    lineHeight: 18,
    color: '#AAACAD',
  },



  // Radio Ring
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E3E5E6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  radioRingSelected: {
    borderColor: '#C57747',
    backgroundColor: '#FFF4ED',
  },
  radioRingCustom: {
    borderColor: '#3F5B58',
    backgroundColor: '#F0F5F4',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#C57747',
  },
  radioDotCustom: {
    backgroundColor: '#3F5B58',
  },
});
