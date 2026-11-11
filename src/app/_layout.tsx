import '@/global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthStore } from '@/features/auth/model';
import { useAppointmentNotifications } from '@/features/settings/model/appointmentNotifications';
import { STORAGE_KEYS } from '@/shared/lib/constants';
import { useAppTheme } from '@/shared/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, isDark, hydrateTheme } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();

  const { isAuthenticated, isLoading, user, businessProfileStatus, error, appMode, hydrate, logout } = useAuthStore();
  useAppointmentNotifications(isAuthenticated ? user : null);

  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inMainGroup = segments[0] === '(main)';
    const inBusinessSetup = segments[0] === '(onboarding)' && segments[1] === 'wizard';

    if (!isAuthenticated && (inMainGroup || inBusinessSetup)) {
      router.replace('/(auth)');
      return;
    }

    if (!isAuthenticated) return;
    if (appMode === 'CONSUMER') {
      if (!inAuthGroup && !inBusinessSetup) return;
      let active = true;
      const routeToConsumer = (completed: string | null) => {
        if (active) router.replace(completed === 'true' ? '/(main)/explore' : '/(onboarding)/consumer');
      };
      AsyncStorage.getItem(STORAGE_KEYS.CONSUMER_ONBOARDING_COMPLETE)
        .then(routeToConsumer, () => routeToConsumer(null));
      return () => { active = false; };
    }
    if (businessProfileStatus === 'needs-setup' && (inAuthGroup || inMainGroup)) {
      router.replace('/(onboarding)/wizard');
    } else if (businessProfileStatus === 'ready' && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [isAuthenticated, isLoading, businessProfileStatus, appMode, segments, fontsLoaded, router]);

  if (isLoading || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
        }}
      >
        <ActivityIndicator size="large" color={colors.action.primary} />
      </View>
    );
  }

  if (isAuthenticated && businessProfileStatus === 'unavailable') {
    return (
      <View style={[styles.recovery, { backgroundColor: colors.background.primary }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text.primary }]}>
          No pudimos verificar tu negocio
        </Text>
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.text.secondary }]}>
          {error || 'Intenta consultar tu cuenta de nuevo.'}
        </Text>
        <Pressable accessibilityRole="button" onPress={hydrate}
          style={[styles.retry, { backgroundColor: colors.action.primary }]}>
          <Text style={[styles.buttonText, { color: colors.action.primaryText }]}>Reintentar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={logout} style={styles.retry}>
          <Text style={[styles.buttonText, { color: colors.text.primary }]}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  recovery: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 28 },
  title: { fontSize: 23, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 16, textAlign: 'center', maxWidth: 420 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 24, borderRadius: 14 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
