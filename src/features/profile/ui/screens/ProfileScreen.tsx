import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme } from '@/shared/theme';

export function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <Animated.View entering={FadeIn.duration(500)} style={s.container}>
          <View
            style={[
              s.avatarLarge,
              { backgroundColor: colors.action.primary },
            ]}
          >
            <Text style={[s.avatarText, { color: colors.action.primaryText }]}>
              {getInitials(user?.fullName || 'US')}
            </Text>
          </View>
          <Text style={[s.name, { color: colors.text.primary }]}>
            {user?.fullName || 'Usuario'}
          </Text>
          <Text style={[s.email, { color: colors.text.muted }]}>
            {user?.email || 'Sin correo registrado'}
          </Text>

          <TouchableOpacity
            style={[
              s.settingsBtn,
              {
                backgroundColor: colors.action.primary,
              },
            ]}
            onPress={() => router.replace('/(main)/settings' as any)}
            activeOpacity={0.8}
          >
            <Feather name="settings" size={17} color={colors.action.primaryText} />
            <Text style={[s.settingsBtnText, { color: colors.action.primaryText }]}>
              Ir a Ajustes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.logoutBtn,
              {
                backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(239,68,68,0.28)' : '#FECACA',
              },
            ]}
            onPress={logout}
            activeOpacity={0.75}
          >
            <Feather name="log-out" size={17} color="#EF4444" />
            <Text style={s.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    marginBottom: 28,
    textAlign: 'center',
  },
  settingsBtn: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  settingsBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    width: '100%',
    maxWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
