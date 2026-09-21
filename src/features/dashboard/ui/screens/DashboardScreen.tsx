import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme } from '@/shared/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BUSINESS_STATS = [
  { label: 'Citas Hoy', value: '3', icon: 'calendar', color: '#6366F1' },
  { label: 'Clientes', value: '12', icon: 'users', color: '#10B981' },
  { label: 'Ingresos Hoy', value: '$1,450', icon: 'dollar-sign', color: '#F59E0B' },
  { label: 'Pendientes', value: '2', icon: 'clock', color: '#EC4899' },
];

const UPCOMING_APPOINTMENTS = [
  { id: '1', name: 'Carlos Mendoza', service: 'Corte de Cabello & Barba', time: '10:00 AM', status: 'confirmed' },
  { id: '2', name: 'Laura Gómez', service: 'Tinte & Peinado', time: '11:30 AM', status: 'confirmed' },
  { id: '3', name: 'Roberto Díaz', service: 'Tratamiento Capilar', time: '02:00 PM', status: 'pending' },
  { id: '4', name: 'Andrea Ruiz', service: 'Manicura Spa', time: '04:15 PM', status: 'confirmed' },
];

export function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleShareLink = async () => {
    try {
      const slug = user?.fullName ? user.fullName.toLowerCase().replace(/\s+/g, '-') : 'tu-negocio';
      await Share.share({
        message: `¡Agenda tu cita conmigo en Slotify! Ingresa aquí: https://slotly.app/${slug}`,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── HEADER ─── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={[s.avatar, { backgroundColor: colors.action.primary }]}>
                <Text style={[s.avatarText, { color: colors.action.primaryText }]}>
                  {getInitials(user?.fullName)}
                </Text>
              </View>
              <View>
                <Text style={[s.greetingSmall, { color: colors.text.secondary }]}>
                  Panel de Negocio
                </Text>
                <Text style={[s.greetingName, { color: colors.text.primary }]}>
                  {user?.fullName || 'Mi Negocio'}
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
              <Feather name="settings" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* ─── HERO CARD ─── */}
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
                  <Text style={s.heroBadgeText}>Resumen del Día</Text>
                </View>
                <Text style={s.heroTitle}>Tu negocio al día</Text>
                <Text style={s.heroSub}>
                  Tienes 3 citas programadas para hoy y 2 pendientes de confirmar.
                </Text>
                <TouchableOpacity
                  style={[s.heroBtn, { backgroundColor: colors.action.primary }]}
                  onPress={() => router.push('/(main)/agenda' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.heroBtnText, { color: colors.action.primaryText }]}>
                    Ver Agenda Táctil
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={15}
                    color={colors.action.primaryText}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* ─── STATS GRID ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={s.statsGrid}>
            {BUSINESS_STATS.map((stat, idx) => (
              <View
                key={idx}
                style={[
                  s.statCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <View style={[s.statIconBox, { backgroundColor: stat.color + '18' }]}>
                  <Feather name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <Text style={[s.statValue, { color: colors.text.primary }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: colors.text.secondary }]}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ─── QUICK ACTIONS ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Accesos Rápidos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.actionsRow}
            >
              <TouchableOpacity
                style={[
                  s.actionChip,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
                onPress={() => router.push('/(main)/agenda' as any)}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconBox, { backgroundColor: '#6366F115' }]}>
                  <Feather name="plus-circle" size={18} color="#6366F1" />
                </View>
                <Text style={[s.actionLabel, { color: colors.text.primary }]}>Nueva Cita</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.actionChip,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
                onPress={() => router.push('/(main)/clients' as any)}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconBox, { backgroundColor: '#10B98115' }]}>
                  <Feather name="user-plus" size={18} color="#10B981" />
                </View>
                <Text style={[s.actionLabel, { color: colors.text.primary }]}>Clientes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.actionChip,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
                onPress={handleShareLink}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconBox, { backgroundColor: '#F59E0B15' }]}>
                  <Feather name="share-2" size={18} color="#F59E0B" />
                </View>
                <Text style={[s.actionLabel, { color: colors.text.primary }]}>Compartir Link</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>

          {/* ─── UPCOMING APPOINTMENTS ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Próximas Citas</Text>
              <TouchableOpacity onPress={() => router.push('/(main)/agenda' as any)}>
                <Text style={[s.seeAll, { color: colors.action.primary }]}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {UPCOMING_APPOINTMENTS.map((apt, idx) => (
              <Animated.View
                key={apt.id}
                entering={FadeInRight.duration(400).delay(350 + idx * 80)}
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
                    <Text style={[s.aptAvatarText, { color: colors.text.primary }]}>
                      {getInitials(apt.name)}
                    </Text>
                  </View>
                  <View style={s.aptInfo}>
                    <Text style={[s.aptName, { color: colors.text.primary }]}>{apt.name}</Text>
                    <Text style={[s.aptService, { color: colors.text.secondary }]}>
                      {apt.service}
                    </Text>
                  </View>
                </View>

                <View style={s.aptRight}>
                  <Text style={[s.aptTime, { color: colors.text.primary }]}>{apt.time}</Text>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: (SCREEN_WIDTH - 52) / 2, borderRadius: 18, padding: 16, borderWidth: 1 },
  statIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: 12 },
  actionsRow: { gap: 12, paddingBottom: 4, marginBottom: 24 },
  actionChip: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', flexDirection: 'row', gap: 10, borderWidth: 1 },
  actionIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  appointmentCard: { borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  aptLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  aptAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  aptAvatarText: { fontSize: 14, fontWeight: '700' },
  aptInfo: { flex: 1 },
  aptName: { fontSize: 15, fontWeight: '700' },
  aptService: { fontSize: 13, marginTop: 2 },
  aptRight: { alignItems: 'flex-end', gap: 4 },
  aptTime: { fontSize: 13, fontWeight: '700' },
  aptBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  aptBadgeText: { fontSize: 11, fontWeight: '700' },
});
