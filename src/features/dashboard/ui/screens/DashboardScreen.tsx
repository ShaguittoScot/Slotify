import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  LinearTransition,
} from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import {
  useCalendarStore,
  getCalendarAmount,
  resolveSessionScopeKey,
} from '@/features/calendar/model';
import { fetchCalendarSlots } from '@/features/calendar/api';
import { resolveBusinessTimeZone } from '@/features/calendar/model/businessTime';
import type { CalendarResponse, CalendarSlot } from '@/shared/types';
import {
  dashboardCalendarRange,
  selectDashboardAppointments,
} from '../../model/appointments';
import {
  useClientsStore,
  buildUnifiedBusinessClients,
} from '@/features/clients/model';
import { useAppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { TemplateMigrationModal } from '../components/TemplateMigrationModal';

const EMPTY_SLOTS: CalendarSlot[] = [];

export function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, toggleAppMode } = useAuthStore();
  const { slots: storeSlots, loadSlots } = useCalendarStore();
  const {
    apiClients,
    manualClients,
    clientNotes,
    loadClients,
    currentScopeKey,
  } = useClientsStore();
  const [migrationModalVisible, setMigrationModalVisible] = useState(false);
  const [calendar, setCalendar] = useState<{
    scopeKey: string;
    data?: CalendarResponse;
    failed?: boolean;
  }>();
  const [now, setNow] = useState(Date.now);
  const scopeKey = resolveSessionScopeKey(user);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = () => {
        const currentTime = Date.now();
        setNow(currentTime);
        const { startDate, endDate } = dashboardCalendarRange(currentTime);
        fetchCalendarSlots(startDate, endDate).then(
          (data) => {
            if (active) setCalendar({ scopeKey, data });
          },
          () => {
            if (active) setCalendar({ scopeKey, failed: true });
          }
        );
      };
      refresh();
      void loadClients(scopeKey);
      void loadSlots(scopeKey);
      const timer = setInterval(() => setNow(Date.now()), 60_000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [loadClients, loadSlots, scopeKey])
  );

  const currentCalendar =
    calendar?.scopeKey === scopeKey ? calendar : undefined;
  const calendarReady = currentCalendar?.data !== undefined;
  const calendarFailed = currentCalendar?.failed === true;
  const slots = useMemo(() => {
    const apiSlots = currentCalendar?.data?.slots ?? EMPTY_SLOTS;
    if (apiSlots.length > 0) return apiSlots;
    return storeSlots.length > 0 ? storeSlots : EMPTY_SLOTS;
  }, [currentCalendar?.data?.slots, storeSlots]);

  const timeZone = resolveBusinessTimeZone(currentCalendar?.data?.timeZone);

  const { todayAppointments, upcoming } = useMemo(
    () => selectDashboardAppointments(slots, now, timeZone),
    [slots, now, timeZone]
  );

  const unifiedClientsCount = useMemo(
    () =>
      currentScopeKey === scopeKey
        ? buildUnifiedBusinessClients(
            apiClients,
            manualClients,
            slots,
            clientNotes
          ).length
        : 0,
    [apiClients, manualClients, slots, clientNotes, currentScopeKey, scopeKey]
  );

  const todayCompletedTotal =
    todayAppointments
      .filter((slot) => slot.status === 'completed' || slot.status === 'confirmed')
      .reduce(
        (sum, slot) => sum + Math.round((getCalendarAmount(slot) ?? 0) * 100),
        0
      ) / 100;

  const getInitials = (name?: string) => {
    if (!name) return 'SL';
    const parts = name.trim().split(/\s+/);
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

  const heroSubtitle = calendarFailed && slots.length === 0
    ? 'No se pudo consultar la agenda en este momento.'
    : !calendarReady && slots.length === 0
    ? 'Sincronizando tu agenda del día…'
    : todayAppointments.length === 0
    ? 'Agenda disponible. Comparte tu enlace o registra una cita para hoy.'
    : 'Operación en curso. Gestiona tus horarios, clientes o personaliza tu formulario.';

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
              <View style={{ flex: 1, minWidth: 0 }}>
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
                accessibilityRole="button"
                accessibilityLabel="Abrir Ajustes"
                style={[
                  s.iconBtn,
                  {
                    backgroundColor: isDark ? '#141418' : '#F4F4F5',
                    borderColor: isDark ? '#24242C' : '#E4E4E7',
                  },
                ]}
                onPress={() => router.navigate('/(main)/settings')}
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
                {todayAppointments.length}{' '}
                {todayAppointments.length === 1 ? 'cita activa' : 'citas activas'}
              </Text>
              <Text style={s.heroSub}>{heroSubtitle}</Text>

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
                {calendarReady || slots.length > 0
                  ? String(todayAppointments.length)
                  : '—'}
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
                {calendarReady || slots.length > 0
                  ? `$${todayCompletedTotal.toLocaleString('es-MX')}`
                  : '—'}
              </Text>
            </View>

            <View
              style={[
                s.kpiDivider,
                { backgroundColor: isDark ? '#22222A' : '#E4E4E7' },
              ]}
            />

            <AnimatedPressable
              style={s.kpiItem}
              onPress={() => router.push('/(main)/clients' as any)}
            >
              <View style={s.kpiHeader}>
                <Feather name="users" size={13} color="#A1A1AA" />
                <Text style={[s.kpiLabel, { color: colors.text.muted }]}>
                  Clientes
                </Text>
              </View>
              <Text style={[s.kpiValue, { color: colors.text.primary }]}>
                {unifiedClientsCount}
              </Text>
            </AnimatedPressable>
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
                  label: 'Clientes',
                  icon: 'users',
                  accent: '#10B981',
                  onPress: () => router.push('/(main)/clients' as any),
                },
                {
                  label: 'Formulario',
                  icon: 'layout',
                  accent: '#818CF8',
                  onPress: () => router.push('/(main)/form-builder' as any),
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

            {upcoming.length > 0 ? (
              upcoming.map((apt, idx) => {
                const isConfirmed = apt.status === 'confirmed';
                const formattedTime = new Date(apt.startTime).toLocaleString(
                  'es-MX',
                  {
                    timeZone,
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );
                return (
                  <Animated.View
                    key={apt.resourceId}
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
                          {formattedTime}
                        </Text>
                      </View>

                      <View style={s.aptInfo}>
                        <Text
                          style={[s.aptName, { color: colors.text.primary }]}
                          numberOfLines={1}
                        >
                          {apt.clientName || 'Cliente'}
                        </Text>
                        <Text
                          style={[s.aptService, { color: colors.text.muted }]}
                          numberOfLines={1}
                        >
                          {apt.title || 'Servicio reservado'}
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
            ) : !calendarReady && slots.length === 0 ? (
              <View
                style={[
                  s.emptyStateCard,
                  {
                    backgroundColor: isDark ? '#121216' : '#FFFFFF',
                    borderColor: isDark ? '#22222A' : '#E4E4E7',
                  },
                ]}
              >
                <Text
                  style={[s.emptyStateSubtitle, { color: colors.text.muted }]}
                >
                  {calendarFailed
                    ? 'No se pudieron cargar las próximas citas.'
                    : 'Cargando próximas citas…'}
                </Text>
              </View>
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
                  Sin citas próximas
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
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
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
