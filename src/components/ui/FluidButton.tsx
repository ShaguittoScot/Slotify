/**
 * FluidButton
 * 
 * Botón CTA con micro-interacciones de física de resorte (Spring Physics)
 * y halo ambiental pulsante:
 * - Compresión táctil instantánea con withSpring (scale: 0.97)
 * - Halo luminoso de respiración cuando está habilitado
 * - Micro-movimiento en el icono de flecha al presionar
 * - Touch target estricto >= 48x48 dp (altura de 52 dp)
 */

import React, { useEffect } from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

interface FluidButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'emerald';
  testID?: string;
  iconName?: string;
  style?: StyleProp<ViewStyle>;
}

export const FluidButton: React.FC<FluidButtonProps> = ({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  testID,
  iconName = 'arrow.right',
  style,
}) => {
  const pressScale = useSharedValue(1);
  const arrowTranslate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  // Animación continua de halo luminoso pulsante cuando está habilitado
  useEffect(() => {
    if (!disabled) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.65, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = 0;
    }
  }, [disabled]);

  const handlePressIn = () => {
    if (!disabled) {
      pressScale.value = withSpring(0.968, { damping: 15, stiffness: 240, mass: 0.8 });
      arrowTranslate.value = withSpring(3, { damping: 14, stiffness: 220 });
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 240, mass: 0.8 });
    arrowTranslate.value = withSpring(0, { damping: 14, stiffness: 220 });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const animatedArrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowTranslate.value }],
  }));

  const isEmerald = variant === 'emerald';

  const webButtonStyle = Platform.OS === 'web' ? ({
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled
      ? 'none'
      : isEmerald
        ? '0 6px 24px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        : '0 6px 24px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    transition: 'background-color 0.2s ease, box-shadow 0.25s ease',
  } as any) : {};

  return (
    <Animated.View style={[styles.wrapper, animatedButtonStyle, style]}>
      <Pressable
        testID={testID}
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={label}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.buttonBase,
          webButtonStyle,
          isEmerald ? styles.buttonEmerald : styles.buttonPrimary,
          disabled && styles.buttonDisabled,
        ]}
      >
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>

        <Animated.View style={animatedArrowStyle}>
          <SymbolView
            name={{ ios: iconName as any, android: 'arrow_forward', web: 'arrow_forward' }}
            size={18}
            weight="bold"
            tintColor={disabled ? '#64748B' : '#FFFFFF'}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  buttonBase: {
    height: 50,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  buttonPrimary: {
    backgroundColor: '#3B3878',
    borderColor: '#4A468C',
    shadowColor: '#3B3878',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonEmerald: {
    backgroundColor: '#3B3878',
    borderColor: '#4A468C',
    shadowColor: '#3B3878',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#1C1C24',
    borderColor: '#262632',
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  labelDisabled: {
    color: '#555566',
  },
});
