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
import { SymbolView } from 'expo-symbols';
import type { SectorCategory } from '../types';

interface SectorTemplateCardProps {
  category: SectorCategory;
  isSelected: boolean;
  onSelect: (category: SectorCategory) => void;
  disabled?: boolean;
  index?: number;
}

type SymbolName = ComponentProps<typeof SymbolView>['name'];

function getSymbolConfig(iconName: string): SymbolName {
  switch (iconName) {
    case 'heart.fill':
      return { ios: 'heart.fill', android: 'favorite', web: 'favorite' };
    case 'sparkles':
      return { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' };
    case 'figure.run':
      return { ios: 'figure.run', android: 'directions_run', web: 'directions_run' };
    case 'briefcase.fill':
      return { ios: 'briefcase.fill', android: 'work', web: 'work' };
    case 'square.grid.2x2':
      return { ios: 'square.grid.2x2.fill', android: 'dashboard_customize', web: 'dashboard_customize' };
    default:
      return { ios: 'circle.grid.2x2.fill', android: 'category', web: 'category' };
  }
}

export const SectorTemplateCard: React.FC<SectorTemplateCardProps> = ({
  category,
  isSelected,
  onSelect,
  disabled = false,
  index = 0,
}) => {
  const symbolConfig = getSymbolConfig(category.iconName);

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
          ? '0 0 24px rgba(16, 185, 129, 0.38), 0 8px 32px 0 rgba(0, 0, 0, 0.45)'
          : '0 0 24px rgba(99, 102, 241, 0.38), 0 8px 32px 0 rgba(0, 0, 0, 0.45)')
      : '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
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
          webGlassStyle,
          isSelected && styles.cardSelected,
          category.isCustomCanvas && isSelected && styles.cardCustomSelected,
          disabled && styles.cardDisabled,
        ]}
      >
        {/* Barra lateral de acento luminosa con resorte */}
        <Animated.View
          style={[
            styles.glowBar,
            category.isCustomCanvas && styles.glowBarCustom,
            animatedGlowBarStyle,
          ]}
        />

        {/* Icono temático */}
        <View
          style={[
            styles.iconBadge,
            isSelected ? styles.iconBadgeSelected : styles.iconBadgeDefault,
            category.isCustomCanvas && isSelected && styles.iconBadgeCustomSelected,
          ]}
        >
          <SymbolView
            name={symbolConfig}
            size={22}
            tintColor={
              isSelected
                ? (category.isCustomCanvas ? '#34D399' : '#818CF8')
                : '#94A3B8'
            }
          />
        </View>

        {/* Textos descriptivos */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.title, isSelected && styles.titleSelected]}
              numberOfLines={1}
            >
              {category.name}
            </Text>

            {category.isCustomCanvas && (
              <View style={styles.canvasPill}>
                <View style={styles.canvasDot} />
                <Text style={styles.canvasPillText}>Lienzo Libre</Text>
              </View>
            )}
          </View>

          <Text style={styles.tagline} numberOfLines={2}>
            {category.tagline}
          </Text>

          {/* Chips de metadatos */}
          <View style={styles.chipsRow}>
            {category.isCustomCanvas ? (
              <View style={styles.chipCustom}>
                <Text style={styles.chipCustomText}>Total flexibilidad • Sin módulos forzados</Text>
              </View>
            ) : (
              <>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{category.defaultModules.length} módulos base</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{category.suggestedServices.length} servicios</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Indicador de Selección Radio con Spring Pop */}
        <View
          style={[
            styles.radioRing,
            isSelected && styles.radioRingSelected,
            category.isCustomCanvas && isSelected && styles.radioRingCustom,
          ]}
        >
          <Animated.View
            style={[
              styles.radioDot,
              category.isCustomCanvas && styles.radioDotCustom,
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
    minHeight: 88,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#16161D',
    borderWidth: 1,
    borderTopColor: '#2B2B38',
    borderBottomColor: '#20202A',
    borderLeftColor: '#262632',
    borderRightColor: '#262632',
    marginVertical: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  glowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  glowBarCustom: {
    backgroundColor: '#10B981',
  },

  cardSelected: {
    backgroundColor: '#1C1B2E',
    borderTopColor: '#6366F1',
    borderBottomColor: '#4F46E5',
    borderLeftColor: '#4F46E5',
    borderRightColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  cardCustomSelected: {
    backgroundColor: '#111E1A',
    borderTopColor: '#10B981',
    borderBottomColor: '#059669',
    borderLeftColor: '#059669',
    borderRightColor: '#059669',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  cardDisabled: {
    opacity: 0.4,
  },

  // Icon Badge
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  iconBadgeDefault: {
    backgroundColor: '#202028',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomColor: '#181820',
    borderLeftColor: '#282834',
    borderRightColor: '#282834',
  },
  iconBadgeSelected: {
    backgroundColor: '#2D2A54',
    borderColor: '#4F46E5',
  },
  iconBadgeCustomSelected: {
    backgroundColor: '#0F2A22',
    borderColor: '#10B981',
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
    marginBottom: 3,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  titleSelected: {
    color: '#FFFFFF',
  },
  canvasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#20202A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#303040',
  },
  canvasDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#818CF8',
  },
  canvasPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#8E8E98',
    marginBottom: 6,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#202028',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2B2B38',
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  chipCustom: {
    backgroundColor: '#202028',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2B2B38',
  },
  chipCustomText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#A5B4FC',
  },

  // Radio Ring
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#383846',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  radioRingSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  radioRingCustom: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#6366F1',
  },
  radioDotCustom: {
    backgroundColor: '#10B981',
  },
});
