import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={s.screen}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <Animated.View entering={FadeIn.duration(500)} style={s.container}>
          <View style={s.avatarLarge}>
            <Text style={s.avatarText}>{getInitials(user?.fullName || 'US')}</Text>
          </View>
          <Text style={s.name}>{user?.fullName || 'Usuario'}</Text>
          <Text style={s.email}>{user?.email || 'email@ejemplo.com'}</Text>

          <View style={s.badge}>
            <Text style={s.badgeText}>Configuración completa próximamente</Text>
          </View>

          <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <SymbolView
              name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
              size={18}
              tintColor="#EF4444"
            />
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
    backgroundColor: '#FAFAF8',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 32,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
