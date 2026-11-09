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
import { ActivityIndicator, StatusBar, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthStore } from '@/features/auth/model';
import { STORAGE_KEYS } from '@/shared/lib/constants';
import { useAppTheme } from '@/shared/theme';

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
        AsyncStorage.getItem(STORAGE_KEYS.CONSUMER_ONBOARDING_COMPLETE).then((completed) => {
          if (completed === 'true') {
            router.replace('/(main)/explore' as any);
          } else {
            router.replace('/(onboarding)/consumer' as any);
          }
        });
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
