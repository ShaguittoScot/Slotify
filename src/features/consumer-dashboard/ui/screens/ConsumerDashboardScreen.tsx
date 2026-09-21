import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme } from '@/shared/theme';

const CONSUMER_APPOINTMENTS = [
  { id: 'c1', business: 'Barbería Capital', service: 'Corte Degradado', date: 'Hoy', time: '04:00 PM', status: 'confirmed', address: 'Av. Reforma 222' },
  { id: 'c2', business: 'Clínica Dental Sonrisas', service: 'Limpieza Dental', date: 'Mañana', time: '11:00 AM', status: 'pending', address: 'Calle 10 #45' },
];

export function ConsumerDashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Cliente */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={[s.avatar, { backgroundColor: colors.action.primary }]}>
                <Text style={[s.avatarText, { color: colors.action.primaryText }]}>
                  {getInitials(user?.fullName)}
                </Text>
              </View>
              <View>
                <Text style={[s.greetingSmall, { color: colors.text.secondary }]}>
                  ¡Hola!
                </Text>
                <Text style={[s.greetingName, { color: colors.text.primary }]}>
                  {user?.fullName || 'Cliente'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                s.bellBtn,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
              onPress={() => router.push('/(main)/settings' as any)}
              activeOpacity={0.7}
            >
              <Feather name="user" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Banner Explorar y Agendar */}
          <Animated.View entering={FadeInDown.duration(500)} style={s.heroWrapper}>
            <View
              style={[
                s.heroCard,
                {
                  backgroundColor: isDark ? '#262626' : '#171717',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
                },
              ]}
            >
              <View style={s.heroContent}>
                <View style={s.heroBadge}>
                  <Text style={s.heroBadgeText}>Explorar Servicios</Text>
                </View>
                <Text style={s.heroTitle}>¿Buscas agendar una cita?</Text>
                <Text style={s.heroSub}>
                  Encuentra barberías, consultorios, spas y más negocios cerca de ti.
                </Text>
                <TouchableOpacity
                  style={[s.heroBtn, { backgroundColor: colors.action.primary }]}
                  onPress={() => router.push('/(main)/explore' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.heroBtnText, { color: colors.action.primaryText }]}>
                    Explorar y Reservar
                  </Text>
                  <Feather
                    name="compass"
                    size={15}
                    color={colors.action.primaryText}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Mis Citas Agendadas */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                Mis Citas Programadas
              </Text>
              <TouchableOpacity onPress={() => router.push('/(main)/explore' as any)}>
                <Text style={[s.seeAll, { color: colors.action.primary }]}>+ Agendar otra</Text>
              </TouchableOpacity>
            </View>

            {CONSUMER_APPOINTMENTS.map((apt, idx) => (
              <Animated.View
                key={apt.id}
                entering={FadeInRight.duration(400).delay(250 + idx * 80)}
                style={[
                  s.appointmentCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <View style={s.aptLeft}>
                  <View
                    style={[
                      s.aptAvatar,
                      {
                        backgroundColor: colors.background.tertiary,
                      },
                    ]}
                  >
                    <Feather name="calendar" size={18} color={colors.action.primary} />
                  </View>
                  <View style={s.aptInfo}>
                    <Text style={[s.aptName, { color: colors.text.primary }]}>{apt.business}</Text>
                    <Text style={[s.aptService, { color: colors.text.secondary }]}>
                      {apt.service}
                    </Text>
                    <Text style={[s.aptSubText, { color: colors.text.muted }]}>
                      {apt.address}
                    </Text>
                  </View>
                </View>

                <View style={s.aptRight}>
                  <Text style={[s.aptTime, { color: colors.text.primary }]}>{apt.time}</Text>
                  <Text style={[s.aptDateBadge, { color: colors.text.secondary }]}>{apt.date}</Text>
                  <View
                    style={[
                      s.aptBadge,
                      apt.status === 'confirmed'
                        ? { backgroundColor: '#10B98120' }
                        : { backgroundColor: '#F59E0B20' },
                    ]}
                  >
                    <Text
                      style={[
                        s.aptBadgeText,
                        apt.status === 'confirmed'
                          ? { color: '#10B981' }
                          : { color: '#F59E0B' },
                      ]}
                    >
                      {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  greetingSmall: { fontSize: 13, fontWeight: '500' },
  greetingName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  bellBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  heroWrapper: { marginBottom: 20 },
  heroCard: { borderRadius: 24, padding: 22, borderWidth: 1 },
  heroContent: { zIndex: 1 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  heroBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4, marginBottom: 6 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 16 },
  heroBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  heroBtnText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  appointmentCard: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  aptLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  aptAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  aptInfo: { flex: 1 },
  aptName: { fontSize: 15, fontWeight: '700' },
  aptService: { fontSize: 13, marginTop: 2 },
  aptSubText: { fontSize: 11, marginTop: 2 },
  aptRight: { alignItems: 'flex-end', gap: 4 },
  aptTime: { fontSize: 13, fontWeight: '700' },
  aptDateBadge: { fontSize: 11, fontWeight: '500' },
  aptBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  aptBadgeText: { fontSize: 11, fontWeight: '700' },
});
