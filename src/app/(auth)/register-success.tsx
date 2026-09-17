import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeIn,
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme } from '@/shared/theme';

export default function RegisterSuccessScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const setJustRegistered = useAuthStore((state) => state.setJustRegistered);

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const handleContinue = () => {
    setJustRegistered(false);
    router.replace('/(onboarding)/wizard' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Background decoration */}
      <View
        style={[
          styles.backgroundBlob1,
          {
            backgroundColor: isDark
              ? 'rgba(99, 102, 241, 0.08)'
              : 'rgba(66, 153, 225, 0.1)',
          },
        ]}
      />
      <View
        style={[
          styles.backgroundBlob2,
          {
            backgroundColor: isDark
              ? 'rgba(168, 85, 247, 0.06)'
              : 'rgba(159, 122, 234, 0.08)',
          },
        ]}
      />

      <View style={styles.content}>
        <Animated.View
          style={[styles.iconContainer, pulseStyle]}
          entering={FadeIn.duration(800).delay(200)}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.action.primary,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <Feather name="check" size={48} color={colors.action.primaryText} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(800).delay(400)}
          style={styles.textContainer}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>¡Cuenta Creada!</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Tu negocio ha sido registrado exitosamente en Slotify. Estás a un paso de
            revolucionar la forma en que gestionas tus reservas.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.action.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.action.primaryText }]}>
            Configurar mi Negocio
          </Text>
          <Feather
            name="arrow-right"
            size={18}
            color={colors.action.primaryText}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundBlob1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  backgroundBlob2: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
