/**
 * FluidToggleSwitch
 * 
 * Switch táctil interactivo con física de resorte (Spring Physics) estilo iOS / VisionOS:
 * - Deslizamiento suave del thumb mediante useAnimatedStyle y withSpring
 * - Efecto de compresión y estiramiento (squash & stretch) al interactuar
 * - Transición de color del riel (track)
 * - Área de toque amplia >= 48x48 dp para ergonomía móvil estricta
 */

import React, { useEffect } from 'react';
import {
  View,
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
  interpolateColor,
} from 'react-native-reanimated';

interface FluidToggleSwitchProps {
  value: boolean;
  onValueChange?: (nextValue: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const FluidToggleSwitch: React.FC<FluidToggleSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  activeColor = '#10B981',
  inactiveColor = 'rgba(255, 255, 255, 0.16)',
  style,
  testID,
}) => {
  // Desplazamiento del thumb: 0 (apagado) a 20 (encendido)
  const progress = useSharedValue(value ? 1 : 0);
  const thumbScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      damping: 15,
      stiffness: 220,
      mass: 0.7,
    });
  }, [value]);

  const handlePressIn = () => {
    if (!disabled) {
      thumbScale.value = withSpring(1.18, { damping: 14, stiffness: 240 });
    }
  };

  const handlePressOut = () => {
    thumbScale.value = withSpring(1, { damping: 14, stiffness: 240 });
  };

  const handleToggle = (event?: any) => {
    event?.stopPropagation?.();
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
  };

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    );

    return {
      backgroundColor,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    const translateX = progress.value * 20;

    return {
      transform: [
        { translateX },
        { scale: thumbScale.value },
      ],
    };
  });

  if (!onValueChange) {
    return (
      <View style={[styles.touchTarget, style]} pointerEvents="none">
        <Animated.View style={[styles.track, animatedTrackStyle]}>
          <Animated.View style={[styles.thumb, animatedThumbStyle]} />
        </Animated.View>
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleToggle}
      style={[styles.touchTarget, style]}
    >
      <Animated.View style={[styles.track, animatedTrackStyle]}>
        <Animated.View style={[styles.thumb, animatedThumbStyle]} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...(Platform.OS === 'web' && {
      transition: 'background-color 0.25s ease, border-color 0.25s ease',
    }),
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
});
