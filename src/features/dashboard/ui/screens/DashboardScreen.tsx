import React, { useEffect, useMemo, useState } from 'react';
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
import { useCalendarStore } from '@/features/calendar/model';
import { useAppTheme } from '@/shared/theme';
import { TemplateMigrationModal } from '../components/TemplateMigrationModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEMO_UPCOMING_APPOINTMENTS = [
  { id: '1', name: 'Carlos Mendoza', service: 'Corte de Cabello & Barba', time: '10:00 AM', status: 'confirmed' },
  { id: '2', name: 'Laura Gómez', service: 'Tinte & Peinado', time: '11:30 AM', status: 'confirmed' },
  { id: '3', name: 'Roberto Díaz', service: 'Tratamiento Capilar', time: '02:00 PM', status: 'pending' },
  { id: '4', name: 'Andrea Ruiz', service: 'Manicura Spa', time: '04:15 PM', status: 'confirmed' },
];

export function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { slots, loadSlots } = useCalendarStore();
  const [migrationModalVisible, setMigrationModalVisible] = useState(false);

  useEffect(() => {
    loadSlots();
  }, []);

  const isDemo =
    user?.email === 'demo@slotify.com' || user?.email === 'admin@slotify.com';

  const appointments = useMemo(() => {
    return slots.filter((s) => s.type === 'appointment');
  }, [slots]);

  // Lista de citas para mostrar en "Próximas Citas"
  const upcomingAppointmentsList = useMemo(() => {
    if (appointments.length > 0) {
      const validAppointments = appointments
        .filter((s) => s.status !== 'cancelled')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return validAppointments.slice(0, 5).map((apt) => {
        const startDate = new Date(apt.startTime);
        const timeStr = startDate.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return {
          id: apt.resourceId,
          name: apt.clientName || 'Cliente',
          service: apt.title || 'Servicio agendado',
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

  // Cálculo dinámico de métricas del negocio
  const stats = useMemo(() => {
    if (appointments.length > 0) {
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      const today = new Date();
      const todayAppointments = appointments.filter(
        (s) => isSameDay(new Date(s.startTime), today) && s.status !== 'cancelled'
      );

      const uniqueClients = new Set(
        appointments.map((s) => s.clientName || s.clientPhone).filter(Boolean)
      ).size;

      const todayRevenue = todayAppointments
        .filter((s) => s.status === 'completed' || s.status === 'confirmed')
        .reduce((sum, s) => {
          if (!s.servicePrice) return sum;
          const num = parseFloat(s.servicePrice.replace(/[^0-9.]/g, ''));
          return sum + (isNaN(num) ? 0 : num);
        }, 0);

      const pendingCount = appointments.filter((s) => s.status === 'pending').length;

      return [
        {
          label: 'Citas Hoy',
          value: String(todayAppointments.length),
          icon: 'calendar',
          color: '#6366F1',
        },
        {
          label: 'Clientes',
          value: String(uniqueClients),
          icon: 'users',
          color: '#10B981',
        },
        {
          label: 'Ingresos Hoy',
          value: todayRevenue > 0 ? `$${todayRevenue.toLocaleString('es-MX')}` : '$0',
          icon: 'dollar-sign',
          color: '#F59E0B',
        },
        {
          label: 'Pendientes',
          value: String(pendingCount),
          icon: 'clock',
          color: '#EC4899',
        },
      ];
    }

    if (isDemo) {
      return [
        { label: 'Citas Hoy', value: '3', icon: 'calendar', color: '#6366F1' },
        { label: 'Clientes', value: '12', icon: 'users', color: '#10B981' },
        { label: 'Ingresos Hoy', value: '$1,450', icon: 'dollar-sign', color: '#F59E0B' },
        { label: 'Pendientes', value: '2', icon: 'clock', color: '#EC4899' },
      ];
    }

    return [
      { label: 'Citas Hoy', value: '0', icon: 'calendar', color: '#6366F1' },
      { label: 'Clientes', value: '0', icon: 'users', color: '#10B981' },
      { label: 'Ingresos Hoy', value: '$0', icon: 'dollar-sign', color: '#F59E0B' },
      { label: 'Pendientes', value: '0', icon: 'clock', color: '#EC4899' },
    ];
  }, [appointments, isDemo]);

  const heroSubtitle = useMemo(() => {
    if (appointments.length > 0) {
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
      const todayCount = appointments.filter(
        (s) => isSameDay(new Date(s.startTime), new Date()) && s.status !== 'cancelled'
      ).length;
      const pendingCount = appointments.filter((s) => s.status === 'pending').length;

      if (todayCount === 0) {
        return 'No tienes citas programadas para hoy. ¡Comparte tu enlace o crea una cita!';
      }
      return `Tienes ${todayCount} ${todayCount === 1 ? 'cita programada' : 'citas programadas'} para hoy${
        pendingCount > 0 ? ` y ${pendingCount} pendiente(s)` : ''
      }.`;
    }

    if (isDemo) {
      return 'Tienes 3 citas programadas para hoy y 2 pendientes de confirmar.';
    }

    return 'Aún no tienes citas registradas. Comparte tu link para que tus clientes comiencen a agendar.';
  }, [appointments, isDemo]);





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

            {upcomingAppointmentsList.length > 0 ? (
              upcomingAppointmentsList.map((apt, idx) => (
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
                          : apt.status === 'completed'
                          ? { backgroundColor: '#6366F120' }
                          : { backgroundColor: '#F59E0B20' },
                      ]}
                    >
                      <Text
                        style={[
                          s.aptBadgeText,
                          apt.status === 'confirmed'
                            ? { color: '#10B981' }
                            : apt.status === 'completed'
                            ? { color: '#6366F1' }
                            : { color: '#F59E0B' },
                        ]}
                      >
                        {apt.status === 'confirmed'
                          ? 'Confirmada'
                          : apt.status === 'completed'
                          ? 'Completada'
                          : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))
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
                  Aún no tienes citas registradas
                </Text>
                <Text style={[s.emptyStateSubtitle, { color: colors.text.secondary }]}>
                  Las citas que agenden tus clientes o agregues desde la agenda aparecerán aquí.
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
