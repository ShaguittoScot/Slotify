import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
      {/* Background decoration in warm terracotta tints */}
      <View
        style={[
          styles.backgroundBlob1,
          {
            backgroundColor: isDark
              ? 'rgba(197, 119, 71, 0.08)'
              : 'rgba(255, 244, 237, 0.9)',
          },
        ]}
      />
      <View
        style={[
          styles.backgroundBlob2,
          {
            backgroundColor: isDark
              ? 'rgba(197, 119, 71, 0.05)'
              : 'rgba(254, 243, 199, 0.5)',
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
              styles.iconCircleOuter,
              {
                backgroundColor: isDark ? '#262626' : '#FFF4ED',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#F0D4BD',
              },
            ]}
          >
            <View
              style={[
                styles.iconCircleInner,
                {
                  backgroundColor: isDark ? '#333333' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0D4BD',
                },
              ]}
            >
              <Feather name="check" size={40} color="#C57747" />
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(800).delay(400)}
          style={styles.textContainer}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>¡Cuenta Creada!</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Tu acceso a Slotify ha sido registrado exitosamente. Ahora configuremos tu negocio en unos sencillos pasos.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#C57747' }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            Configurar mi Negocio
          </Text>
          <Feather
            name="arrow-right"
            size={18}
            color="#FFFFFF"
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
    marginBottom: 36,
  },
  iconCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#C57747',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircleInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 100,
    shadowColor: '#C57747',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
