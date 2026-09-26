import { useEffect } from 'react';
import { Slot, useRouter, useSegments, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useAuthStore } from '@/features/auth/model';
import { useAppTheme } from '@/shared/theme';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, isDark, hydrateTheme } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();

  const { isAuthenticated, isLoading, user, appMode, hydrate } = useAuthStore();

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
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!isAuthenticated && inMainGroup) {
      // @ts-ignore
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      if (segments[1] === 'register-client' || appMode === 'CONSUMER') {
        router.replace('/(main)/explore' as any);
      } else if (!user?.businessId) {
        router.replace('/(onboarding)/wizard');
      } else {
        router.replace('/(main)');
      }
    }
  }, [isAuthenticated, isLoading, user?.businessId, appMode, segments, fontsLoaded]);

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

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}
