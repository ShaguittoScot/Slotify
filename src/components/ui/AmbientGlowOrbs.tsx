/**
 * AmbientGlowOrbs
 * 
 * Orbes de iluminación ambiental cromática con dinámica orbital y respiración fluida
 * (estilo Apple VisionOS / Dribbble).
 * - Esfera superior derecha: Gradiente Púrpura/Índigo (#6366F1 / #7C3AED) con ciclo de respiración y deriva orbital.
 * - Esfera inferior izquierda: Gradiente Cian/Esmeralda (#06B6D4 / #10B981) en contrafase.
 * - Esfera central derecha: Violeta (#8B5CF6) de acento con micro-oscilación.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const AmbientGlowOrbs: React.FC = () => {
  // Orb 1: Escala, Opacidad y Deriva XY
  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const translateX1 = useSharedValue(0);
  const translateY1 = useSharedValue(0);

  // Orb 2: Escala, Opacidad y Deriva XY
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.22);
  const translateX2 = useSharedValue(0);
  const translateY2 = useSharedValue(0);

  // Orb 3: Micro-pulsación
  const scale3 = useSharedValue(1);
  const opacity3 = useSharedValue(0.16);

  useEffect(() => {
    // Orb 1: Ciclo de respiración (4.5s) y deriva orbital suave (7.5s y 9s)
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: 4500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.38, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.24, { duration: 4500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    translateX1.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 7500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-20, { duration: 7500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    translateY1.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(25, { duration: 9000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Orb 2: Ciclo en contrafase (5.5s) y deriva orbital (8s y 10s)
    scale2.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 5500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.15, { duration: 5500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.18, { duration: 5500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.32, { duration: 5500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    translateX2.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(20, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    translateY2.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-15, { duration: 10000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Orb 3: Acento lateral
    scale3.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity3.value = withRepeat(
      withSequence(
        withTiming(0.24, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.14, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedOrbStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX1.value },
      { translateY: translateY1.value },
      { scale: scale1.value },
    ],
    opacity: opacity1.value,
  }));

  const animatedOrbStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX2.value },
      { translateY: translateY2.value },
      { scale: scale2.value },
    ],
    opacity: opacity2.value,
  }));

  const animatedOrbStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Esfera Superior Derecha (Índigo / Púrpura) */}
      <Animated.View
        style={[
          styles.orb,
          styles.orbTopRight,
          animatedOrbStyle1,
          Platform.OS === 'web' && ({
            background: 'radial-gradient(circle, #6366F1 0%, #7C3AED 70%, transparent 100%)',
            filter: 'blur(85px)',
          } as any),
        ]}
      />

      {/* Esfera Inferior Izquierda (Cian / Esmeralda) */}
      <Animated.View
        style={[
          styles.orb,
          styles.orbBottomLeft,
          animatedOrbStyle2,
          Platform.OS === 'web' && ({
            background: 'radial-gradient(circle, #06B6D4 0%, #10B981 70%, transparent 100%)',
            filter: 'blur(95px)',
          } as any),
        ]}
      />

      {/* Esfera Acento Central (Violeta Suave) */}
      <Animated.View
        style={[
          styles.orb,
          styles.orbMidRight,
          animatedOrbStyle3,
          Platform.OS === 'web' && ({
            background: 'radial-gradient(circle, #8B5CF6 0%, #6366F1 70%, transparent 100%)',
            filter: 'blur(90px)',
          } as any),
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopRight: {
    top: -60,
    right: -50,
    width: 380,
    height: 380,
    backgroundColor: '#6366F1',
  },
  orbBottomLeft: {
    bottom: -80,
    left: -60,
    width: 420,
    height: 420,
    backgroundColor: '#06B6D4',
  },
  orbMidRight: {
    top: '40%',
    right: -80,
    width: 290,
    height: 290,
    backgroundColor: '#8B5CF6',
  },
});
