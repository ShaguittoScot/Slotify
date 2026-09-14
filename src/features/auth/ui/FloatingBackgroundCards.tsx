import React, { useEffect } from 'react';
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
  startX: number;
  endX: number;
  endY: number;
  duration: number;
}

const FloatingCard = ({ title, delay, startX, endX, endY, duration }: FloatingCardProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Continuous loop for each card
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration * 0.2, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: duration * 0.4 }),
          withTiming(0, { duration: duration * 0.4, easing: Easing.in(Easing.ease) })
        ),
        -1, // infinite
        false // no reverse
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration * 0.2, easing: Easing.out(Easing.back(1.5)) }),
          withTiming(1, { duration: duration * 0.8 })
        ),
        -1,
        false
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-endY, { duration: duration, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX, { duration: duration * 0.2, easing: Easing.out(Easing.ease) }),
          withTiming(endX, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delay, duration, endY, startX, endX]);

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
        {/* Placeholder for future PNGs */}
        <View style={styles.iconPlaceholder} />
        <Text style={styles.cardText}>{title}</Text>
      </View>
    </Animated.View>
  );
};

export const FloatingBackgroundCards = () => {
  const cards = [
    {
      id: 1,
      title: 'Agenda tu barbero',
      delay: 0,
      startX: -60,
      endX: -40,
      endY: height * 0.4,
      duration: 4000,
    },
    {
      id: 2,
      title: 'Cita con tu manicurista',
      delay: 1500,
      startX: 60,
      endX: 30,
      endY: height * 0.45,
      duration: 4500,
    },
    {
      id: 3,
      title: 'Cita con el dentista',
      delay: 3000,
      startX: -40,
      endX: -80,
      endY: height * 0.42,
      duration: 4200,
    },
    {
      id: 4,
      title: 'Reserva tu spa',
      delay: 4500,
      startX: 50,
      endX: 70,
      endY: height * 0.38,
      duration: 4800,
    },
  ];

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {cards.map((card) => (
        <FloatingCard
          key={card.id}
          title={card.title}
          delay={card.delay}
          startX={card.startX}
          endX={card.endX}
          endY={card.endY}
          duration={card.duration}
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
