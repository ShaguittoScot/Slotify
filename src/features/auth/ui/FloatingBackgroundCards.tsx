import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface FloatingCardProps {
  title: string;
  delay: number;
  endX: number;
  endY: number;
  duration: number;
  loop?: boolean;
}

const FloatingCard = ({ title, delay, endX, endY, duration, loop = true }: FloatingCardProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const withLoop = (anim: any) => loop ? withRepeat(anim, -1, false) : anim;

    opacity.value = withDelay(
      delay,
      withLoop(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: duration * 0.15, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: duration * 0.7 }),
          withTiming(0, { duration: duration * 0.15, easing: Easing.in(Easing.ease) })
        )
      )
    );

    scale.value = withDelay(
      delay,
      withLoop(
        withSequence(
          withTiming(0.2, { duration: 0 }),
          withTiming(1, { duration: duration * 0.3, easing: Easing.out(Easing.back(1.5)) }),
          withTiming(1, { duration: duration * 0.7 })
        )
      )
    );

    translateY.value = withDelay(
      delay,
      withLoop(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(-endY, { duration: duration, easing: Easing.out(Easing.cubic) })
        )
      )
    );

    translateX.value = withDelay(
      delay,
      withLoop(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(endX, { duration: duration, easing: Easing.out(Easing.cubic) })
        )
      )
    );
  }, [delay, duration, endY, endX, loop]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <View style={styles.cardContent}>
        <View style={styles.iconPlaceholder} />
        <Text style={styles.cardText}>{title}</Text>
      </View>
    </Animated.View>
  );
};

export const FloatingBackgroundCards = ({ burstCounter = 0 }: { burstCounter?: number }) => {
  const [burstCards, setBurstCards] = useState<any[]>([]);

  useEffect(() => {
    if (burstCounter > 0) {
      const isLeft = Math.random() > 0.5;
      const endX = isLeft ? -80 - Math.random() * 60 : 80 + Math.random() * 60;
      const newBurst = {
        id: Date.now() + Math.random(),
        title: '¡Súper Cita!',
        delay: 0,
        endX: endX,
        endY: height * 0.35 + Math.random() * (height * 0.15),
        duration: 2000 + Math.random() * 500, // Fast burst
      };
      
      setBurstCards(prev => {
        const next = [...prev, newBurst];
        return next.slice(-4); // Keep at most 4 burst cards to avoid screen saturation
      });
    }
  }, [burstCounter]);

  const cards = [
    { id: 1, title: 'Agenda tu barbero', delay: 0, endX: -90, endY: height * 0.4, duration: 3000 },
    { id: 2, title: 'Cita con tu manicurista', delay: 400, endX: 110, endY: height * 0.45, duration: 3300 },
    { id: 3, title: 'Cita con el dentista', delay: 800, endX: -100, endY: height * 0.42, duration: 3100 },
    { id: 4, title: 'Reserva tu spa', delay: 1200, endX: 90, endY: height * 0.38, duration: 3500 },
    { id: 5, title: 'Clases de yoga', delay: 1600, endX: -120, endY: height * 0.48, duration: 3200 },
    { id: 6, title: 'Tutorías privadas', delay: 2000, endX: 100, endY: height * 0.43, duration: 3600 },
    { id: 7, title: 'Reparación de auto', delay: 2400, endX: -80, endY: height * 0.35, duration: 3100 },
    { id: 8, title: 'Consulta médica', delay: 2800, endX: 120, endY: height * 0.47, duration: 3700 },
  ];

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {cards.map((card) => (
        <FloatingCard
          key={card.id}
          title={card.title}
          delay={card.delay}
          endX={card.endX}
          endY={card.endY}
          duration={card.duration}
        />
      ))}
      {burstCards.map((card) => (
        <FloatingCard
          key={card.id}
          title={card.title}
          delay={card.delay}
          endX={card.endX}
          endY={card.endY}
          duration={card.duration}
          loop={false}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    top: '15%', // Shift spawn center down to align with the lowered logo
    zIndex: 1, // Behind the foreground text/buttons, but above base background
  },
  cardContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
});
