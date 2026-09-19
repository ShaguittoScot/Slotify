import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ── Mock Data ────────────────────────────────────────
const STATS = [
  { label: 'Citas Hoy', value: '3', icon: 'calendar' as const, color: '#C57747' },
  { label: 'Nuevos Clientes', value: '12', icon: 'person.fill.badge.plus' as const, color: '#6366F1' },
  { label: 'Ingresos Mes', value: '$8,450', icon: 'banknote' as const, color: '#10B981' },
  { label: 'Servicios', value: '5', icon: 'list.bullet.rectangle' as const, color: '#F59E0B' },
];

const QUICK_ACTIONS = [
  { label: 'Nueva Cita', icon: 'plus.circle.fill' as const },
  { label: 'Nuevo Cliente', icon: 'person.badge.plus' as const },
  { label: 'Mis Horarios', icon: 'clock.fill' as const },
  { label: 'Compartir', icon: 'square.and.arrow.up' as const },
];

const UPCOMING = [
  { name: 'María López', service: 'Corte de Cabello', time: '10:00 AM', status: 'confirmed' },
  { name: 'Carlos Méndez', service: 'Consulta General', time: '11:30 AM', status: 'pending' },
  { name: 'Ana Torres', service: 'Manicure Spa', time: '02:00 PM', status: 'confirmed' },
];

// ── Component ────────────────────────────────────────
export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.fullName || 'Usuario';

  return (
    <View style={s.screen}>
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── HEADER ─── */}
          <Animated.View entering={FadeIn.duration(500)} style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{getInitials(displayName)}</Text>
              </View>
              <View>
                <Text style={s.greetingSmall}>{getGreeting()}</Text>
                <Text style={s.greetingName}>{displayName}</Text>
              </View>
            </View>
            <TouchableOpacity style={s.bellBtn}>
              <SymbolView
                name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                size={20}
                tintColor="#374151"
              />
              <View style={s.bellBadge} />
            </TouchableOpacity>
          </Animated.View>

          {/* ─── HERO CARD ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <View style={s.heroCard}>
              {/* Gradient layers */}
              <View style={s.heroGradientBase} />
              <View style={s.heroGradientOverlay} />

              {/* Decorative circles */}
              <View style={s.heroCircle1} />
              <View style={s.heroCircle2} />

              <View style={s.heroContent}>
                <View style={s.heroBadge}>
                  <Text style={s.heroBadgeText}>Panel Principal</Text>
                </View>
                <Text style={s.heroTitle}>Tu negocio al día</Text>
                <Text style={s.heroSub}>
                  Tienes 3 citas programadas para hoy y 2 pendientes de confirmar.
                </Text>
                <TouchableOpacity style={s.heroBtn}>
                  <Text style={s.heroBtnText}>Ver Agenda</Text>
                  <SymbolView
                    name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
                    size={14}
                    tintColor="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* ─── STATS GRID ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={s.statsGrid}>
            {STATS.map((stat, idx) => (
              <View key={idx} style={s.statCard}>
                <View style={[s.statIconBox, { backgroundColor: stat.color + '15' }]}>
                  <SymbolView
                    name={{ ios: stat.icon, android: 'info', web: 'info' }}
                    size={18}
                    tintColor={stat.color}
                  />
                </View>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ─── QUICK ACTIONS ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)}>
            <Text style={s.sectionTitle}>Accesos Rápidos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.actionsRow}
            >
              {QUICK_ACTIONS.map((action, idx) => (
                <TouchableOpacity key={idx} style={s.actionChip} activeOpacity={0.7}>
                  <View style={s.actionIconBox}>
                    <SymbolView
                      name={{ ios: action.icon, android: 'add_circle', web: 'add_circle' }}
                      size={18}
                      tintColor="#C57747"
                    />
                  </View>
                  <Text style={s.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* ─── UPCOMING APPOINTMENTS ─── */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Próximas Citas</Text>
              <TouchableOpacity>
                <Text style={s.seeAll}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {UPCOMING.map((apt, idx) => (
              <Animated.View
                key={idx}
                entering={FadeInRight.duration(400).delay(450 + idx * 100)}
                style={s.appointmentCard}
              >
                <View style={s.aptLeft}>
                  <View style={s.aptAvatar}>
                    <Text style={s.aptAvatarText}>{getInitials(apt.name)}</Text>
                  </View>
                  <View style={s.aptInfo}>
                    <Text style={s.aptName}>{apt.name}</Text>
                    <Text style={s.aptService}>{apt.service}</Text>
                  </View>
                </View>
                <View style={s.aptRight}>
                  <Text style={s.aptTime}>{apt.time}</Text>
                  <View
                    style={[
                      s.aptBadge,
                      apt.status === 'confirmed' ? s.badgeConfirmed : s.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        s.aptBadgeText,
                        apt.status === 'confirmed'
                          ? s.badgeTextConfirmed
                          : s.badgeTextPending,
                      ]}
                    >
                      {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Bottom spacer for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  greetingSmall: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Hero
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'flex-end',
    backgroundColor: '#D4A574',
  },
  heroGradientBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E8956D',
    opacity: 0.7,
  },
  heroGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '70%',
    height: '70%',
    backgroundColor: '#F5C89A',
    opacity: 0.5,
    borderTopLeftRadius: 100,
  },
  heroCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroContent: {
    zIndex: 1,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },

  // Quick Actions
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  actionsRow: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 28,
  },
  actionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    minWidth: 100,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF4ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // Appointments
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    color: '#C57747',
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  aptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aptAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  aptInfo: {
    flex: 1,
  },
  aptName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  aptService: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  aptRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  aptTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  aptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  aptBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextConfirmed: {
    color: '#065F46',
  },
  badgeTextPending: {
    color: '#92400E',
  },
});
