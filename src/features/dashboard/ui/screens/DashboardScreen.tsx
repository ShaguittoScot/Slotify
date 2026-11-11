import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
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
import { TemplateMigrationModal } from '../components/TemplateMigrationModal';

const DEMO_UPCOMING_APPOINTMENTS = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    service: 'Corte Clásico & Barba',
    time: '10:00 AM',
    status: 'confirmed',
  },
  {
    id: '2',
    name: 'Laura Gómez',
    service: 'Diseño & Estilizado',
    time: '11:30 AM',
    status: 'confirmed',
  },
  {
    id: '3',
    name: 'Roberto Díaz',
    service: 'Tratamiento Facial',
    time: '02:00 PM',
    status: 'pending',
  },
];

export function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, toggleAppMode } = useAuthStore();
  const { slots, loadSlots } = useCalendarStore();
  const [migrationModalVisible, setMigrationModalVisible] = useState(false);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const isDemo =
    user?.email === 'demo@slotify.com' || user?.email === 'admin@slotify.com';

  const appointments = useMemo(
    () => slots.filter((s) => s.type === 'appointment'),
    [slots]
  );

  const upcomingAppointmentsList = useMemo(() => {
    if (appointments.length > 0) {
      const validAppointments = appointments
        .filter((s) => s.status !== 'cancelled')
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

      return validAppointments.slice(0, 4).map((apt) => {
        const startDate = new Date(apt.startTime);
        const timeStr = startDate.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return {
          id: apt.resourceId,
          name: apt.clientName || apt.employeeName || 'Cliente',
          service: apt.title || 'Servicio reservado',
          time: timeStr,
          status: apt.status || 'confirmed',
        };
      });
    }

    if (isDemo) {
      return DEMO_UPCOMING_APPOINTMENTS;
    }

    return [];
  }, [appointments, isDemo]);

  const metrics = useMemo(() => {
    if (appointments.length > 0) {
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      const today = new Date();
      const todayAppointments = appointments.filter(
        (s) =>
          isSameDay(new Date(s.startTime), today) && s.status !== 'cancelled'
      );

      const uniqueClients = new Set(
        appointments
          .map((s) => s.clientName || s.clientPhone || s.title)
          .filter(Boolean)
      ).size;

      const todayRevenue = todayAppointments
        .filter((s) => s.status === 'completed' || s.status === 'confirmed')
        .reduce((sum, s) => {
          if (!s.servicePrice) return sum + 250;
          const num = parseFloat(s.servicePrice.replace(/[^0-9.]/g, ''));
          return sum + (isNaN(num) ? 250 : num);
        }, 0);

      return {
        todayCount: todayAppointments.length,
        revenue:
          todayRevenue > 0 ? `$${todayRevenue.toLocaleString('es-MX')}` : '$0',
        clients: uniqueClients || todayAppointments.length,
      };
    }

    if (isDemo) {
      return { todayCount: 3, revenue: '$1,450', clients: 12 };
    }

    return { todayCount: 0, revenue: '$0', clients: 0 };
  }, [appointments, isDemo]);

  const getInitials = (name?: string) => {
    if (!name) return 'SL';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleShareLink = async () => {
    try {
      const slug = user?.businessName
        ? user.businessName.toLowerCase().replace(/\s+/g, '-')
        : 'central-barber';
      await Share.share({
        message: `Reserva tu cita en línea en Slotify: https://slotify.app/book/${slug}`,
      });
    } catch {
      // Ignored
    }
  };

  const businessTitle =
    user?.businessName || user?.fullName || 'Panel Slotify';

  return (
    <View style={[s.screen, { backgroundColor: colors.background.primary }]}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── CABECERA MINIMALISTA ─── */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={s.header}
          >
            <View style={s.headerLeft}>
              <View
                style={[
                  s.avatarRing,
                  {
                    borderColor: 'rgba(99, 102, 241, 0.45)',
                    backgroundColor: isDark ? '#14141A' : '#EEF2FF',
                  },
                ]}
              >
                <Text style={s.avatarText}>{getInitials(businessTitle)}</Text>
              </View>
              <View>
                <View style={s.roleRow}>
                  <View style={s.accentDot} />
                  <Text style={[s.greetingSmall, { color: colors.text.muted }]}>
                    ADMINISTRACIÓN
                  </Text>
                </View>
                <Text
                  style={[s.greetingName, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {businessTitle}
                </Text>
              </View>
            </View>

            <View style={s.headerActions}>
              <AnimatedPressable
                onPress={toggleAppMode}
                style={[
                  s.modePill,
                  {
                    backgroundColor: isDark ? '#14141A' : '#F4F4F5',
                    borderColor: isDark
                      ? 'rgba(129, 140, 248, 0.25)'
                      : 'rgba(99, 102, 241, 0.2)',
                  },
                ]}
              >
                <Feather name="repeat" size={13} color="#818CF8" />
                <Text style={s.modePillText}>Modo Cliente</Text>
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
                <Feather name="sliders" size={17} color={colors.text.primary} />
              </AnimatedPressable>
            </View>
          </Animated.View>

          {/* ─── TARJETA EJECUTIVA PRINCIPAL (HERO) ─── */}
          <Animated.View
            entering={FadeInDown.duration(450).delay(60).springify()}
            style={s.heroWrapper}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#15151E', '#0F0F14']
                  : ['#18181B', '#09090B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroCard}
            >
              <View style={s.heroTopRow}>
                <View style={s.liveBadge}>
                  <View style={s.liveDot} />
                  <Text style={s.liveBadgeText}>AGENDA DE HOY</Text>
                </View>
                <Feather name="activity" size={16} color="#818CF8" />
              </View>

              <Text style={s.heroMetricTitle}>
                {metrics.todayCount}{' '}
                {metrics.todayCount === 1 ? 'cita activa' : 'citas activas'}
              </Text>
              <Text style={s.heroSub}>
                {metrics.todayCount > 0
                  ? 'Operación en curso. Gestiona tus horarios o personaliza tu formulario.'
                  : 'Agenda disponible. Comparte tu enlace para recibir reservaciones.'}
              </Text>

              <View style={s.heroBtnRow}>
                <AnimatedPressable
                  style={s.heroPrimaryBtn}
                  onPress={() => router.push('/(main)/agenda' as any)}
                >
                  <Text style={s.heroPrimaryBtnText}>Ver Agenda</Text>
                  <Feather name="arrow-up-right" size={15} color="#09090B" />
                </AnimatedPressable>

                <AnimatedPressable
                  style={s.heroSecondaryBtn}
                  onPress={() => router.push('/(main)/form-builder' as any)}
                >
                  <Feather name="file-text" size={14} color="#FAFAFA" />
                  <Text style={s.heroSecondaryBtnText}>Formulario</Text>
                </AnimatedPressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ─── BARRA COMPACTA DE MÉTRICAS (3 COLUMNAS) ─── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(120).springify()}
            style={[
              s.kpiStrip,
              {
                backgroundColor: isDark ? '#121216' : '#FFFFFF',
                borderColor: isDark ? '#22222A' : '#E4E4E7',
              },
            ]}
          >
            <View style={s.kpiItem}>
              <View style={s.kpiHeader}>
                <Feather name="calendar" size={13} color="#818CF8" />
                <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                  Citas Hoy
                </Text>
              </View>
              <Text style={[s.kpiValue, { color: colors.text.primary }]}>
                {metrics.todayCount}
              </Text>
            </View>

            <View
              style={[
                s.kpiDivider,
                { backgroundColor: isDark ? '#22222A' : '#E4E4E7' },
              ]}
            />

            <View style={s.kpiItem}>
              <View style={s.kpiHeader}>
                <Feather name="trending-up" size={13} color="#10B981" />
                <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                  Estimado
                </Text>
              </View>
              <Text style={[s.kpiValue, { color: colors.text.primary }]}>
                {metrics.revenue}
              </Text>
            </View>

            <View
              style={[
                s.kpiDivider,
                { backgroundColor: isDark ? '#22222A' : '#E4E4E7' },
              ]}
            />

            <View style={s.kpiItem}>
              <View style={s.kpiHeader}>
                <Feather name="users" size={13} color="#A1A1AA" />
                <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                  Clientes
                </Text>
              </View>
              <Text style={[s.kpiValue, { color: colors.text.primary }]}>
                {metrics.clients}
              </Text>
            </View>
          </Animated.View>

          {/* ─── ACCIONES RÁPIDAS UNIFICADAS ─── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(180).springify()}
            style={s.quickActionsSection}
          >
            <View style={s.quickActionsGrid}>
              {[
                {
                  label: 'Nueva Cita',
                  icon: 'plus',
                  accent: '#818CF8',
                  onPress: () => router.push('/(main)/agenda' as any),
                },
                {
                  label: 'Formulario',
                  icon: 'layout',
                  accent: '#10B981',
                  onPress: () => router.push('/(main)/form-builder' as any),
                },
                {
                  label: 'Plantilla',
                  icon: 'layers',
                  accent: '#A1A1AA',
                  onPress: () => setMigrationModalVisible(true),
                },
                {
                  label: 'Compartir',
                  icon: 'share-2',
                  accent: '#A1A1AA',
                  onPress: handleShareLink,
                },
              ].map((item) => (
                <AnimatedPressable
                  key={item.label}
                  onPress={item.onPress}
                  style={[
                    s.actionButtonCard,
                    {
                      backgroundColor: isDark ? '#121216' : '#FFFFFF',
                      borderColor: isDark ? '#22222A' : '#E4E4E7',
                    },
                  ]}
                >
                  <View
                    style={[
                      s.actionIconCircle,
                      {
                        backgroundColor: isDark ? '#1A1A22' : '#F4F4F5',
                      },
                    ]}
                  >
                    <Feather
                      name={item.icon as any}
                      size={16}
                      color={item.accent}
                    />
                  </View>
                  <Text
                    style={[s.actionCardLabel, { color: colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </Animated.View>

          {/* ─── PRÓXIMAS CITAS ─── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(240).springify()}
          >
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                Próximas Citas
              </Text>
              <AnimatedPressable
                onPress={() => router.push('/(main)/agenda' as any)}
                style={s.linkBtn}
              >
                <Text style={s.seeAll}>Agenda completa</Text>
                <Feather name="chevron-right" size={14} color="#818CF8" />
              </AnimatedPressable>
            </View>

            {upcomingAppointmentsList.length > 0 ? (
              upcomingAppointmentsList.map((apt, idx) => {
                const isConfirmed = apt.status === 'confirmed';
                return (
                  <Animated.View
                    key={apt.id}
                    layout={LinearTransition.springify()}
                    entering={FadeInRight.duration(350).delay(260 + idx * 60)}
                  >
                    <AnimatedPressable
                      onPress={() => router.push('/(main)/agenda' as any)}
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
                          s.timePill,
                          {
                            backgroundColor: isDark ? '#1A1A22' : '#F4F4F5',
                          },
                        ]}
                      >
                        <Feather name="clock" size={12} color="#818CF8" />
                        <Text
                          style={[s.timePillText, { color: colors.text.primary }]}
                        >
                          {apt.time}
                        </Text>
                      </View>

                      <View style={s.aptInfo}>
                        <Text
                          style={[s.aptName, { color: colors.text.primary }]}
                          numberOfLines={1}
                        >
                          {apt.name}
                        </Text>
                        <Text
                          style={[s.aptService, { color: colors.text.muted }]}
                          numberOfLines={1}
                        >
                          {apt.service}
                        </Text>
                      </View>

                      <View style={s.statusPill}>
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
                            s.statusText,
                            {
                              color: isConfirmed ? '#10B981' : '#F59E0B',
                            },
                          ]}
                        >
                          {isConfirmed ? 'Confirmada' : 'Pendiente'}
                        </Text>
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
                    { backgroundColor: isDark ? '#1A1A22' : '#F4F4F5' },
                  ]}
                >
                  <Feather name="calendar" size={20} color="#818CF8" />
                </View>
                <Text
                  style={[s.emptyStateTitle, { color: colors.text.primary }]}
                >
                  Sin citas programadas
                </Text>
                <Text
                  style={[s.emptyStateSubtitle, { color: colors.text.muted }]}
                >
                  Agrega una cita en la agenda o comparte tu formulario.
                </Text>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>

      <TemplateMigrationModal
        visible={migrationModalVisible}
        onClose={() => setMigrationModalVisible(false)}
      />
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
    color: '#818CF8',
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
    backgroundColor: '#6366F1',
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
    color: '#818CF8',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Hero Card
  heroWrapper: { marginBottom: 16 },
  heroCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.22)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    color: '#A5B4FC',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  heroMetricTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FAFAFA',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13.5,
    color: '#A1A1AA',
    lineHeight: 19,
    marginBottom: 18,
  },
  heroBtnRow: {
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
    color: '#09090B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroSecondaryBtnText: {
    color: '#FAFAFA',
    fontSize: 13.5,
    fontWeight: '600',
  },

  // KPI Strip
  kpiStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  kpiDivider: {
    width: 1,
    height: 28,
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  actionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Upcoming Appointments
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
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#818CF8',
  },
  appointmentCard: {
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '700',
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  emptyStateCard: {
    borderRadius: 18,
    padding: 24,
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
    lineHeight: 18,
  },
});
