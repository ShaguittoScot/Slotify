import React, { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import {
  getCalendarAmount,
  resolveSessionScopeKey,
} from '@/features/calendar/model';
import { fetchCalendarSlots } from '@/features/calendar/api';
import { resolveBusinessTimeZone } from '@/features/calendar/model/businessTime';
import type { CalendarResponse, CalendarSlot } from '@/shared/types';
import { dashboardCalendarRange, selectDashboardAppointments } from '../../model/appointments';
import {
  useClientsStore,
  buildUnifiedBusinessClients,
} from '@/features/clients/model';
import { useAppTheme } from '@/shared/theme';
import { TemplateMigrationModal } from '../components/TemplateMigrationModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EMPTY_SLOTS: CalendarSlot[] = [];

export function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { apiClients, manualClients, clientNotes, loadClients, currentScopeKey } =
    useClientsStore();
  const [migrationModalVisible, setMigrationModalVisible] = useState(false);
  const [calendar, setCalendar] = useState<{
    scopeKey: string;
    data?: CalendarResponse;
    failed?: boolean;
  }>();
  const [now, setNow] = useState(Date.now);
  const scopeKey = resolveSessionScopeKey(user);

  useFocusEffect(useCallback(() => {
    let active = true;
    const refresh = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      const { startDate, endDate } = dashboardCalendarRange(currentTime);
      fetchCalendarSlots(startDate, endDate).then(
        (data) => { if (active) setCalendar({ scopeKey, data }); },
        () => { if (active) setCalendar({ scopeKey, failed: true }); },
      );
    };
    refresh();
    void loadClients(scopeKey);
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [loadClients, scopeKey]));

  const currentCalendar = calendar?.scopeKey === scopeKey ? calendar : undefined;
  const calendarReady = currentCalendar?.data !== undefined;
  const calendarFailed = currentCalendar?.failed === true;
  const slots = currentCalendar?.data?.slots ?? EMPTY_SLOTS;
  const timeZone = resolveBusinessTimeZone(currentCalendar?.data?.timeZone);
  const { todayAppointments, upcoming } = useMemo(
    () => selectDashboardAppointments(slots, now, timeZone),
    [slots, now, timeZone],
  );
  const unifiedClientsCount = useMemo(
    () => currentScopeKey === scopeKey
      ? buildUnifiedBusinessClients(apiClients, manualClients, slots, clientNotes).length
      : 0,
    [apiClients, manualClients, slots, clientNotes, currentScopeKey, scopeKey],
  );
  const todayCompletedTotal = todayAppointments
    .filter((slot) => slot.status === 'completed')
    .reduce((sum, slot) => sum + Math.round((getCalendarAmount(slot) ?? 0) * 100), 0) / 100;
  const todayConfirmed = todayAppointments.filter((slot) => slot.status === 'confirmed').length;
  const stats = [
    { label: 'Citas Hoy', value: calendarReady ? String(todayAppointments.length) : '—', icon: 'calendar', color: '#6366F1' },
    { label: 'Clientes', value: String(unifiedClientsCount), icon: 'users', color: '#10B981' },
    {
      label: 'Pactado en completadas hoy',
      value: calendarReady ? todayCompletedTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : '—',
      icon: 'dollar-sign',
      color: '#F59E0B',
    },
    { label: 'Confirmadas hoy', value: calendarReady ? String(todayConfirmed) : '—', icon: 'clock', color: '#EC4899' },
  ];
  const heroSubtitle = calendarFailed
    ? 'No se pudo consultar la agenda.'
    : !calendarReady
    ? 'Consultando la agenda…'
    : todayAppointments.length === 0
    ? 'No tienes citas programadas para hoy.'
    : todayAppointments.length === 1 ? 'Tienes una cita programada para hoy.' : `Tienes ${todayAppointments.length} citas programadas para hoy.`;

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
              <View style={s.greeting}>
                <Text style={[s.greetingSmall, { color: colors.text.secondary }]}>
                  Panel de Negocio (Admin)
                </Text>
                <Text numberOfLines={2} style={[s.greetingName, { color: colors.text.primary }]}>
                  {user?.fullName || 'Mi Negocio'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Abrir Ajustes"
              style={[
                s.settingsButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
              onPress={() => router.navigate('/(main)/settings')}
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
                <Text style={s.heroSub}>{heroSubtitle}</Text>
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
            {stats.map((stat, idx) => (
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

              <TouchableOpacity
                style={[
                  s.actionChip,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
                onPress={() => setMigrationModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconBox, { backgroundColor: '#8B5CF615' }]}>
                  <Feather name="refresh-cw" size={18} color="#8B5CF6" />
                </View>
                <Text style={[s.actionLabel, { color: colors.text.primary }]}>Plantilla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.actionChip,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
                onPress={() => router.push('/(main)/form-builder' as any)}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconBox, { backgroundColor: '#F43F5E15' }]}>
                  <Feather name="edit-3" size={18} color="#F43F5E" />
                </View>
                <Text style={[s.actionLabel, { color: colors.text.primary }]}>Formulario</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>

          {/* ─── UPCOMING APPOINTMENTS ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>Próximas Citas</Text>
              <TouchableOpacity onPress={() => router.push('/(main)/agenda' as any)}>
                <Text style={[s.seeAll, { color: colors.action.primary }]}>Ver agenda</Text>
              </TouchableOpacity>
            </View>

            {upcoming.length > 0 ? (
              upcoming.map((apt, idx) => (
                <Animated.View
                  key={apt.resourceId}
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
                        {getInitials(apt.clientName)}
                      </Text>
                    </View>
                    <View style={s.aptInfo}>
                      <Text style={[s.aptName, { color: colors.text.primary }]}>{apt.clientName || 'Cliente'}</Text>
                      <Text style={[s.aptService, { color: colors.text.secondary }]}>
                        {apt.title}
                      </Text>
                    </View>
                  </View>

                  <View style={s.aptRight}>
                    <Text style={[s.aptTime, { color: colors.text.primary }]}>
                      {new Date(apt.startTime).toLocaleString('es-MX', {
                        timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                    <View style={[s.aptBadge, { backgroundColor: '#10B98120' }]}>
                      <Text style={[s.aptBadgeText, { color: isDark ? '#34D399' : '#047857' }]}>Confirmada</Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            ) : !calendarReady ? (
              <Text style={[s.emptyStateSubtitle, { color: colors.text.secondary }]}>
                {calendarFailed ? 'No se pudieron cargar las próximas citas.' : 'Cargando próximas citas…'}
              </Text>
            ) : (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={[
                  s.emptyStateCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <View
                  style={[
                    s.emptyIconCircle,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' },
                  ]}
                >
                  <Feather name="calendar" size={26} color={colors.text.muted} />
                </View>
                <Text style={[s.emptyStateTitle, { color: colors.text.primary }]}>
                  Sin citas próximas
                </Text>
                <Text style={[s.emptyStateSubtitle, { color: colors.text.secondary }]}>
                  Aquí aparecen tus próximas citas confirmadas.
                </Text>
                <View style={s.emptyActionsRow}>
                  <TouchableOpacity
                    style={[s.emptyActionBtn, { backgroundColor: colors.action.primary }]}
                    onPress={() => router.push('/(main)/agenda' as any)}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus-circle" size={15} color={colors.action.primaryText} />
                    <Text style={[s.emptyActionBtnText, { color: colors.action.primaryText }]}>
                      Crear Cita
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      s.emptyShareBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                        borderColor: colors.border.main,
                      },
                    ]}
                    onPress={handleShareLink}
                    activeOpacity={0.7}
                  >
                    <Feather name="share-2" size={15} color={colors.text.primary} />
                    <Text style={[s.emptyShareBtnText, { color: colors.text.primary }]}>
                      Compartir
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  greeting: { flex: 1, minWidth: 0 },
  greetingSmall: { fontSize: 13, fontWeight: '500' },
  greetingName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
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
  emptyStateCard: { borderRadius: 20, padding: 22, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyStateTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  emptyStateSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 18, paddingHorizontal: 16 },
  emptyActionsRow: { flexDirection: 'row', gap: 10 },
  emptyActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  emptyActionBtnText: { fontSize: 13, fontWeight: '700' },
  emptyShareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  emptyShareBtnText: { fontSize: 13, fontWeight: '600' },
});
