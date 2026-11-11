import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  LinearTransition,
} from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import { useCalendarStore } from '@/features/calendar/model';
import { useAppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import {
  loadConsumerAppointmentsLocally,
  ConsumerBookedAppointment,
} from '@/features/dashboard/model/formBranding';

const DEMO_CONSUMER_APPOINTMENTS = [
  {
    id: 'c1',
    business: 'Barbería Capital',
    service: 'Corte Degradado & Barba',
    date: 'Hoy',
    time: '04:00 PM',
    status: 'confirmed',
  },
  {
    id: 'c2',
    business: 'Clínica Dental Sonrisas',
    service: 'Limpieza Ultrasónica',
    date: 'Mañana',
    time: '11:00 AM',
    status: 'pending',
  },
];

export function ConsumerDashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, toggleAppMode } = useAuthStore();
  const { slots, loadSlots } = useCalendarStore();
  const [localBookings, setLocalBookings] = useState<ConsumerBookedAppointment[]>(
    []
  );

  const hydrateConsumerBookings = useCallback(async () => {
    const saved = await loadConsumerAppointmentsLocally();
    setLocalBookings(saved);
  }, []);

  useEffect(() => {
    loadSlots();
    hydrateConsumerBookings();
  }, [loadSlots, hydrateConsumerBookings]);

  const isDemo =
    user?.email === 'demo@slotify.com' || user?.email === 'admin@slotify.com';

  const appointmentsList = useMemo(() => {
    const mappedLocal = localBookings.map((b) => ({
      id: b.id,
      business: b.businessName,
      service: b.serviceNames.join(' + '),
      date: b.dateLabel,
      time: b.timeLabel,
      status: b.status || 'confirmed',
    }));

    const localIds = new Set(mappedLocal.map((m) => m.id));
    const validSlots = slots.filter(
      (s) =>
        s.type === 'appointment' &&
        s.status !== 'cancelled' &&
        !localIds.has(s.resourceId)
    );

    const mappedSlots = validSlots.map((apt) => {
      const d = new Date(apt.startTime);
      const isToday =
        d.getDate() === new Date().getDate() &&
        d.getMonth() === new Date().getMonth() &&
        d.getFullYear() === new Date().getFullYear();

      const dateStr = isToday
        ? 'Hoy'
        : d.toLocaleDateString('es-MX', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });

      const timeStr = d.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return {
        id: apt.resourceId,
        business: apt.employeeName || 'Slotify Studio',
        service: apt.title || 'Cita programada',
        date: dateStr,
        time: timeStr,
        status: apt.status || 'confirmed',
      };
    });

    const combined = [...mappedLocal, ...mappedSlots];
    if (combined.length > 0) return combined;
    if (isDemo) return DEMO_CONSUMER_APPOINTMENTS;
    return [];
  }, [localBookings, slots, isDemo]);

  const getInitials = (name?: string) => {
    if (!name) return 'CL';
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
          {/* ─── CABECERA CLIENTE MINIMALISTA ─── */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={s.header}
          >
            <View style={s.headerLeft}>
              <View
                style={[
                  s.avatarRing,
                  {
                    borderColor: 'rgba(16, 185, 129, 0.45)',
                    backgroundColor: isDark ? '#121A17' : '#ECFDF5',
                  },
                ]}
              >
                <Text style={s.avatarText}>{getInitials(user?.fullName)}</Text>
              </View>
              <View>
                <View style={s.roleRow}>
                  <View style={s.accentDot} />
                  <Text style={[s.greetingSmall, { color: colors.text.muted }]}>
                    ESPACIO PERSONAL
                  </Text>
                </View>
                <Text
                  style={[s.greetingName, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {user?.fullName && user.fullName !== 'Pendiente'
                    ? user.fullName
                    : 'Cliente Slotify'}
                </Text>
              </View>
            </View>

            <View style={s.headerActions}>
              <AnimatedPressable
                onPress={toggleAppMode}
                style={[
                  s.modePill,
                  {
                    backgroundColor: isDark ? '#121816' : '#F4F4F5',
                    borderColor: isDark
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(16, 185, 129, 0.2)',
                  },
                ]}
              >
                <Feather name="repeat" size={13} color="#10B981" />
                <Text style={s.modePillText}>Modo Admin</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={[
                  s.iconBtn,
                  {
                    backgroundColor: isDark ? '#141418' : '#F4F4F5',
                    borderColor: isDark ? '#24242C' : '#E4E4E7',
                  },
                ]}
                onPress={() => router.push('/(main)/settings' as any)}
              >
                <Feather name="user" size={17} color={colors.text.primary} />
              </AnimatedPressable>
            </View>
          </Animated.View>

          {/* ─── HERO CARD MINIMALISTA ─── */}
          <Animated.View
            entering={FadeInDown.duration(450).delay(60).springify()}
            style={s.heroWrapper}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#13171A', '#0D0E12']
                  : ['#18181B', '#09090B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroCard}
            >
              <View style={s.heroTopRow}>
                <View style={s.heroBadge}>
                  <View style={s.heroDot} />
                  <Text style={s.heroBadgeText}>RESERVA DIGITAL</Text>
                </View>
                <Feather name="zap" size={15} color="#10B981" />
              </View>

              <Text style={s.heroTitle}>Agenda tu próxima visita</Text>
              <Text style={s.heroSub}>
                Elige tu establecimiento, selecciona horario y confirma en segundos.
              </Text>

              <View style={s.heroButtonsRow}>
                <AnimatedPressable
                  style={s.heroPrimaryBtn}
                  onPress={() => router.push('/(main)/form-preview' as any)}
                >
                  <Text style={s.heroPrimaryBtnText}>Reservar Cita</Text>
                  <Feather name="arrow-up-right" size={15} color="#09090B" />
                </AnimatedPressable>

                <AnimatedPressable
                  style={s.heroSecondaryBtn}
                  onPress={() => router.push('/(main)/explore' as any)}
                >
                  <Feather name="compass" size={14} color="#FAFAFA" />
                  <Text style={s.heroSecondaryBtnText}>Explorar</Text>
                </AnimatedPressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ─── MIS CITAS PROGRAMADAS ─── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(150).springify()}
          >
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                Mis Citas
              </Text>
              <AnimatedPressable
                onPress={() => router.push('/(main)/form-preview' as any)}
                style={s.newBookingLink}
              >
                <Feather name="plus" size={14} color="#10B981" />
                <Text style={s.seeAll}>Nueva</Text>
              </AnimatedPressable>
            </View>

            {appointmentsList.length > 0 ? (
              appointmentsList.map((apt, idx) => {
                const isConfirmed = apt.status === 'confirmed';
                return (
                  <Animated.View
                    key={apt.id}
                    layout={LinearTransition.springify()}
                    entering={FadeInRight.duration(350).delay(180 + idx * 60)}
                  >
                    <AnimatedPressable
                      onPress={() => router.push('/(main)/form-preview' as any)}
                      style={[
                        s.appointmentCard,
                        {
                          backgroundColor: isDark ? '#121216' : '#FFFFFF',
                          borderColor: isDark ? '#22222A' : '#E4E4E7',
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.aptIconBox,
                          {
                            backgroundColor: isDark ? '#181820' : '#F4F4F5',
                          },
                        ]}
                      >
                        <Feather name="calendar" size={16} color="#10B981" />
                      </View>

                      <View style={s.aptInfo}>
                        <Text
                          style={[s.aptName, { color: colors.text.primary }]}
                          numberOfLines={1}
                        >
                          {apt.business}
                        </Text>
                        <Text
                          style={[s.aptService, { color: colors.text.muted }]}
                          numberOfLines={1}
                        >
                          {apt.service}
                        </Text>
                      </View>

                      <View style={s.aptRight}>
                        <Text
                          style={[s.aptTime, { color: colors.text.primary }]}
                        >
                          {apt.time}
                        </Text>
                        <View style={s.statusRow}>
                          <View
                            style={[
                              s.statusDot,
                              {
                                backgroundColor: isConfirmed
                                  ? '#10B981'
                                  : '#F59E0B',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              s.aptDateBadge,
                              { color: colors.text.muted },
                            ]}
                          >
                            {apt.date}
                          </Text>
                        </View>
                      </View>
                    </AnimatedPressable>
                  </Animated.View>
                );
              })
            ) : (
              <View
                style={[
                  s.emptyStateCard,
                  {
                    backgroundColor: isDark ? '#121216' : '#FFFFFF',
                    borderColor: isDark ? '#22222A' : '#E4E4E7',
                  },
                ]}
              >
                <View
                  style={[
                    s.emptyIconCircle,
                    { backgroundColor: isDark ? '#181820' : '#F4F4F5' },
                  ]}
                >
                  <Feather name="calendar" size={20} color="#10B981" />
                </View>
                <Text
                  style={[s.emptyStateTitle, { color: colors.text.primary }]}
                >
                  Sin citas activas
                </Text>
                <Text
                  style={[s.emptyStateSubtitle, { color: colors.text.muted }]}
                >
                  Tus próximas reservaciones aparecerán aquí.
                </Text>
              </View>
            )}
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  greetingSmall: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  greetingName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Hero
  heroWrapper: { marginBottom: 22 },
  heroCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroBadgeText: {
    color: '#34D399',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13.5,
    color: '#A1A1AA',
    lineHeight: 19,
    marginBottom: 18,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroPrimaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#09090B',
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroSecondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FAFAFA',
  },

  // Mis Citas
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  newBookingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  appointmentCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  aptIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptInfo: {
    flex: 1,
    gap: 2,
  },
  aptName: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  aptService: {
    fontSize: 12.5,
  },
  aptRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  aptTime: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  aptDateBadge: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  emptyStateCard: {
    borderRadius: 18,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
  },
});
