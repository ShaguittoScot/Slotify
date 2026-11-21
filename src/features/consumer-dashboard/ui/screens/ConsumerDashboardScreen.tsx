import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import Animated, {
  FadeInDown,
  FadeInRight,
  LinearTransition,
} from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';
import { useAppTheme } from '@/shared/theme';
import { apiClient } from '@/shared/lib/api';
import { API_ENDPOINTS } from '@/shared/lib/constants';
import { supabase } from '@/shared/lib/supabase';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import {
  loadConsumerAppointmentsLocally,
  ConsumerBookedAppointment,
} from '@/features/dashboard/model/formBranding';

interface ConsumerAppointmentDto {
  id: string;
  businessName: string;
  businessSlug: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  agreedTotal: number;
}

interface AppointmentItem {
  id: string;
  business: string;
  businessSlug?: string;
  service: string;
  date: string;
  time: string;
  status: string;
  total?: number;
}

function formatAppointmentSchedule(startIso: string) {
  const dateObj = new Date(startIso);
  if (!Number.isFinite(dateObj.getTime())) {
    return { date: 'Próxima', time: '--:--' };
  }
  const now = new Date();
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear();

  const date = isToday
    ? 'Hoy'
    : isTomorrow
    ? 'Mañana'
    : dateObj.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

  const time = dateObj.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return { date, time };
}

export function ConsumerDashboardScreen() {
  const router = useRouter();
  const { colors, isDark, visualTheme } = useAppTheme();
  const clientAccent = visualTheme === 'obsidian' ? '#10B981' : colors.text.accent;
  const { user, toggleAppMode } = useAuthStore();
  const [serverAppointments, setServerAppointments] = useState<ConsumerAppointmentDto[]>([]);
  const [localBookings, setLocalBookings] = useState<ConsumerBookedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const hasBusinessAccess = Boolean(
    user && (
      user.role === 'DUENO' ||
      user.role === 'EMPLEADO' ||
      (user.businessId && !user.businessId.startsWith('demo'))
    )
  );

  const loadConsumerAppointments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [{ data: sessionData }, localSaved] = await Promise.all([
        supabase.auth.getSession(),
        loadConsumerAppointmentsLocally(),
      ]);

      const verifiedLocal = localSaved.filter(
        (b) => b.id && !b.id.startsWith('apt-') && !b.id.startsWith('demo')
      );
      setLocalBookings(verifiedLocal);

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setHasSession(false);
        setServerAppointments([]);
        return;
      }

      setHasSession(true);
      const res = await apiClient.get<{ data: ConsumerAppointmentDto[] }>(
        API_ENDPOINTS.CONSUMER.APPOINTMENTS,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setServerAppointments(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (error) {
      const msg = isAxiosError<{ error?: string; message?: string }>(error)
        ? error.response?.data?.error ||
          error.response?.data?.message ||
          'No se pudieron cargar tus citas.'
        : 'No se pudieron cargar tus citas.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConsumerAppointments();
  }, [loadConsumerAppointments]);

  useFocusEffect(
    useCallback(() => {
      void loadConsumerAppointments();
    }, [loadConsumerAppointments])
  );

  const appointmentsList: AppointmentItem[] = useMemo(() => {
    if (hasSession) {
      return serverAppointments.map((apt) => {
        const { date, time } = formatAppointmentSchedule(apt.startTime);
        return {
          id: apt.id,
          business: apt.businessName,
          businessSlug: apt.businessSlug,
          service: apt.title || 'Cita programada',
          date,
          time,
          status: apt.status || 'confirmed',
          total: apt.agreedTotal,
        };
      });
    }

    return localBookings.map((b) => ({
      id: b.id,
      business: b.businessName,
      businessSlug: b.businessSlug,
      service: b.serviceNames.join(' + '),
      date: b.dateLabel,
      time: b.timeLabel,
      status: b.status || 'confirmed',
      total: b.totalPrice,
    }));
  }, [hasSession, serverAppointments, localBookings]);

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
          refreshControl={
            <RefreshControl
              refreshing={isLoading && appointmentsList.length > 0}
              onRefresh={() => void loadConsumerAppointments()}
              tintColor={clientAccent}
              colors={[clientAccent]}
            />
          }
        >
          {/* ─── CABECERA CLIENTE ─── */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={s.header}
          >
            <View style={s.headerLeft}>
              <View
                style={[
                  s.avatarRing,
                  {
                    borderColor: `${clientAccent}60`,
                    backgroundColor: `${clientAccent}15`,
                  },
                ]}
              >
                <Text style={[s.avatarText, { color: clientAccent }]}>
                  {getInitials(user?.fullName)}
                </Text>
              </View>
              <View>
                <View style={s.roleRow}>
                  <View style={[s.accentDot, { backgroundColor: clientAccent }]} />
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
              {hasBusinessAccess && (
                <AnimatedPressable
                  onPress={toggleAppMode}
                  style={[
                    s.modePill,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.light,
                    },
                  ]}
                >
                  <Feather name="repeat" size={13} color={clientAccent} />
                  <Text style={[s.modePillText, { color: colors.text.secondary }]}>
                    Modo Admin
                  </Text>
                </AnimatedPressable>
              )}

              <AnimatedPressable
                style={[
                  s.iconBtn,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                  },
                ]}
                onPress={() => router.push('/(main)/settings' as any)}
              >
                <Feather name="user" size={17} color={colors.text.primary} />
              </AnimatedPressable>
            </View>
          </Animated.View>

          {/* ─── BANNER COMPACTO DE ACCIÓN (BUSCAR Y RESERVAR) ─── */}
          <Animated.View
            entering={FadeInDown.duration(450).delay(60).springify()}
            style={s.heroWrapper}
          >
            <View
              style={[
                s.quickActionCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.main,
                },
              ]}
            >
              <View style={s.quickActionLeft}>
                <View
                  style={[
                    s.quickActionIconBox,
                    {
                      backgroundColor: `${clientAccent}15`,
                    },
                  ]}
                >
                  <Feather name="compass" size={20} color={clientAccent} />
                </View>
                <View style={s.quickActionText}>
                  <Text style={[s.quickActionTitle, { color: colors.text.primary }]}>
                    Explora y reserva
                  </Text>
                  <Text style={[s.quickActionSubtitle, { color: colors.text.muted }]}>
                    Encuentra negocios y agenda tu próxima cita
                  </Text>
                </View>
              </View>

              <AnimatedPressable
                style={[
                  s.exploreBtn,
                  {
                    backgroundColor: colors.action.primary,
                  },
                ]}
                onPress={() => router.push('/(main)/explore' as any)}
              >
                <Text style={[s.exploreBtnText, { color: colors.action.primaryText }]}>
                  Explorar
                </Text>
                <Feather name="arrow-right" size={14} color={colors.action.primaryText} />
              </AnimatedPressable>
            </View>
          </Animated.View>

          {/* ─── MIS CITAS PROGRAMADAS ─── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(120).springify()}
          >
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>
                Mis Citas
              </Text>
              <AnimatedPressable
                onPress={() => router.push('/(main)/explore' as any)}
                style={s.newBookingLink}
              >
                <Feather name="plus" size={14} color={clientAccent} />
                <Text style={[s.seeAll, { color: clientAccent }]}>Nueva</Text>
              </AnimatedPressable>
            </View>

            {isLoading && appointmentsList.length === 0 ? (
              <View
                style={[
                  s.emptyStateCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={clientAccent} style={{ marginBottom: 10 }} />
                <Text style={[s.emptyStateSubtitle, { color: colors.text.muted }]}>
                  Sincronizando tus citas...
                </Text>
              </View>
            ) : errorMessage ? (
              <View
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
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2' },
                  ]}
                >
                  <Feather name="alert-circle" size={20} color={colors.status.error || '#EF4444'} />
                </View>
                <Text style={[s.emptyStateTitle, { color: colors.text.primary }]}>
                  No pudimos cargar tus citas
                </Text>
                <Text style={[s.emptyStateSubtitle, { color: colors.text.muted }]}>
                  {errorMessage}
                </Text>
                <AnimatedPressable
                  onPress={() => void loadConsumerAppointments()}
                  style={[
                    s.retryBtn,
                    { backgroundColor: colors.action.primary },
                  ]}
                >
                  <Text
                    style={[
                      s.retryBtnText,
                      { color: colors.action.primaryText },
                    ]}
                  >
                    Reintentar
                  </Text>
                </AnimatedPressable>
              </View>
            ) : appointmentsList.length > 0 ? (
              appointmentsList.map((apt, idx) => {
                const isConfirmed = apt.status === 'confirmed';
                return (
                  <Animated.View
                    key={apt.id}
                    layout={LinearTransition.springify()}
                    entering={FadeInRight.duration(350).delay(150 + idx * 50)}
                  >
                    <AnimatedPressable
                      onPress={() => setSelectedAppointment(apt)}
                      style={[
                        s.appointmentCard,
                        {
                          backgroundColor: colors.background.secondary,
                          borderColor: colors.border.main,
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.aptIconBox,
                          {
                            backgroundColor: isDark
                              ? colors.background.tertiary
                              : colors.background.primary,
                          },
                        ]}
                      >
                        <Feather name="calendar" size={16} color={clientAccent} />
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
                                  ? colors.status.success
                                  : colors.status.warning,
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
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.main,
                  },
                ]}
              >
                <View
                  style={[
                    s.emptyIconCircle,
                    {
                      backgroundColor: isDark
                        ? colors.background.tertiary
                        : colors.background.primary,
                    },
                  ]}
                >
                  <Feather name="calendar" size={20} color={clientAccent} />
                </View>
                <Text
                  style={[s.emptyStateTitle, { color: colors.text.primary }]}
                >
                  Sin citas programadas
                </Text>
                <Text
                  style={[s.emptyStateSubtitle, { color: colors.text.muted }]}
                >
                  Explora establecimientos y agenda tu próxima cita con facilidad.
                </Text>
                <AnimatedPressable
                  onPress={() => router.push('/(main)/explore' as any)}
                  style={[
                    s.emptyCtaBtn,
                    { backgroundColor: colors.action.primary },
                  ]}
                >
                  <Feather name="compass" size={15} color={colors.action.primaryText} />
                  <Text
                    style={[
                      s.emptyCtaBtnText,
                      { color: colors.action.primaryText },
                    ]}
                  >
                    Explorar negocios
                  </Text>
                </AnimatedPressable>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ─── MODAL DETALLE DE CITA ─── */}
      <Modal
        visible={Boolean(selectedAppointment)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAppointment(null)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setSelectedAppointment(null)}
        >
          <Pressable
            style={[
              s.modalContent,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.main,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalHeader}>
              <View style={s.modalTitleRow}>
                <View
                  style={[
                    s.modalIconBox,
                    {
                      backgroundColor: `${clientAccent}15`,
                    },
                  ]}
                >
                  <Feather name="calendar" size={18} color={clientAccent} />
                </View>
                <Text style={[s.modalTitle, { color: colors.text.primary }]}>
                  Detalle de la Cita
                </Text>
              </View>
              <AnimatedPressable
                onPress={() => setSelectedAppointment(null)}
                style={[
                  s.modalCloseBtn,
                  { backgroundColor: isDark ? colors.background.tertiary : colors.background.primary },
                ]}
              >
                <Feather name="x" size={16} color={colors.text.secondary} />
              </AnimatedPressable>
            </View>

            {selectedAppointment && (
              <View style={s.modalBody}>
                <View style={s.modalField}>
                  <Text style={[s.modalLabel, { color: colors.text.muted }]}>
                    Establecimiento
                  </Text>
                  <Text style={[s.modalValueBold, { color: colors.text.primary }]}>
                    {selectedAppointment.business}
                  </Text>
                </View>

                <View style={s.modalField}>
                  <Text style={[s.modalLabel, { color: colors.text.muted }]}>
                    Servicio(s)
                  </Text>
                  <Text style={[s.modalValue, { color: colors.text.primary }]}>
                    {selectedAppointment.service}
                  </Text>
                </View>

                <View style={s.modalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalLabel, { color: colors.text.muted }]}>
                      Fecha
                    </Text>
                    <Text style={[s.modalValue, { color: colors.text.primary }]}>
                      {selectedAppointment.date}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalLabel, { color: colors.text.muted }]}>
                      Horario
                    </Text>
                    <Text style={[s.modalValue, { color: colors.text.primary }]}>
                      {selectedAppointment.time}
                    </Text>
                  </View>
                </View>

                <View style={s.modalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.modalLabel, { color: colors.text.muted }]}>
                      Estado
                    </Text>
                    <View style={s.modalStatusBadge}>
                      <View
                        style={[
                          s.statusDot,
                          {
                            backgroundColor:
                              selectedAppointment.status === 'confirmed'
                                ? colors.status.success
                                : colors.status.warning,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          s.modalStatusText,
                          {
                            color:
                              selectedAppointment.status === 'confirmed'
                                ? colors.status.success
                                : colors.status.warning,
                          },
                        ]}
                      >
                        {selectedAppointment.status === 'confirmed'
                          ? 'Confirmada'
                          : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                  {typeof selectedAppointment.total === 'number' && selectedAppointment.total > 0 && (
                    <View style={{ flex: 1 }}>
                      <Text style={[s.modalLabel, { color: colors.text.muted }]}>
                        Total acordado
                      </Text>
                      <Text style={[s.modalValueBold, { color: colors.text.primary }]}>
                        ${selectedAppointment.total.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={s.modalActions}>
                  {selectedAppointment.businessSlug ? (
                    <AnimatedPressable
                      onPress={() => {
                        const slug = selectedAppointment.businessSlug;
                        setSelectedAppointment(null);
                        router.push(`/business/${slug}` as any);
                      }}
                      style={[
                        s.modalBusinessBtn,
                        {
                          backgroundColor: colors.action.primary,
                        },
                      ]}
                    >
                      <Feather name="external-link" size={14} color={colors.action.primaryText} />
                      <Text style={[s.modalBusinessBtnText, { color: colors.action.primaryText }]}>
                        Ver negocio
                      </Text>
                    </AnimatedPressable>
                  ) : null}
                  <AnimatedPressable
                    onPress={() => setSelectedAppointment(null)}
                    style={[
                      s.modalCloseActionBtn,
                      {
                        backgroundColor: isDark ? colors.background.tertiary : colors.background.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                  >
                    <Text style={[s.modalCloseActionBtnText, { color: colors.text.primary }]}>
                      Cerrar
                    </Text>
                  </AnimatedPressable>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Quick Action Card (Replaces oversized hero)
  heroWrapper: {
    marginBottom: 20,
  },
  quickActionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quickActionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    flex: 1,
    gap: 2,
  },
  quickActionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 14,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCtaBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal Detalle
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 14,
  },
  modalField: {
    gap: 3,
  },
  modalLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalValueBold: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  modalBusinessBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalBusinessBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalCloseActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCloseActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
