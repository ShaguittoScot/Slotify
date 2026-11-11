import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { DEFAULT_BUSINESS_TIME_ZONE } from '@/features/calendar/model/businessTime';
import type { BusinessClient } from '../../types';

interface ClientCardProps {
  client: BusinessClient;
  timeZone?: string;
  onPress: (client: BusinessClient) => void;
}

export function getClientInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function formatShortDate(isoDate?: string | null, timeZone = DEFAULT_BUSINESS_TIME_ZONE): string {
  if (!isoDate) return 'Sin citas previas';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 'Sin citas previas';
  return d.toLocaleDateString('es-MX', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ClientCard({ client, onPress, timeZone }: ClientCardProps) {
  const { colors, isDark } = useAppTheme();

  const hasUpcoming = Boolean(client.nextVisitAt);
  const isFrequent = client.totalVisits >= 2;

  const badgeConfig = client.archivedAt
    ? {
        label: 'Archivado',
        bg: colors.background.primary,
        text: colors.text.secondary,
        dot: colors.text.muted,
      }
    : hasUpcoming
    ? {
        label: 'Próxima cita',
        bg: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ECFDF5',
        text: isDark ? '#34D399' : '#059669',
        dot: '#10B981',
      }
    : isFrequent
    ? {
        label: 'Frecuente',
        bg: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
        text: isDark ? '#818CF8' : '#4F46E5',
        dot: '#6366F1',
      }
    : {
        label: client.totalVisits === 1 ? '1 visita' : 'Nuevo',
        bg: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB',
        text: isDark ? '#FBBF24' : '#D97706',
        dot: '#F59E0B',
      };

  const contactLine =
    client.phone ||
    client.email ||
    'Sin teléfono o correo registrado';

  const dateSummary = client.nextVisitAt
    ? `Próx: ${formatShortDate(client.nextVisitAt, timeZone)}`
    : client.lastVisitAt
    ? `Última: ${formatShortDate(client.lastVisitAt, timeZone)}`
    : `Alta: ${formatShortDate(client.createdAt, timeZone)}`;

  return (
    <TouchableOpacity
      testID={`client-card-${client.id}`}
      activeOpacity={0.78}
      onPress={() => onPress(client)}
      style={[
        s.card,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.main,
        },
      ]}
    >
      <View style={s.topRow}>
        {/* Avatar con iniciales */}
        <View
          style={[
            s.avatar,
            {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
              borderColor: isDark ? 'rgba(99, 102, 241, 0.32)' : '#C7D2FE',
            },
          ]}
        >
          <Text style={[s.avatarText, { color: isDark ? '#818CF8' : '#4F46E5' }]}>
            {getClientInitials(client.fullName)}
          </Text>
        </View>

        {/* Información principal */}
        <View style={s.mainInfo}>
          <View style={s.nameRow}>
            <Text
              style={[s.nameText, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {client.fullName}
            </Text>

            <View style={[s.badge, { backgroundColor: badgeConfig.bg }]}>
              <View style={[s.badgeDot, { backgroundColor: badgeConfig.dot }]} />
              <Text style={[s.badgeText, { color: badgeConfig.text }]}>
                {badgeConfig.label}
              </Text>
            </View>
          </View>

          <View style={s.contactRow}>
            <Feather
              name={client.phone ? 'phone' : client.email ? 'mail' : 'info'}
              size={12}
              color={colors.text.muted}
            />
            <Text
              style={[s.contactText, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {contactLine}
            </Text>
          </View>

          {client.notes ? (
            <View style={s.notePreviewRow}>
              <Feather name="file-text" size={11} color={colors.text.muted} />
              <Text
                style={[s.notePreviewText, { color: colors.text.muted }]}
                numberOfLines={1}
              >
                {client.notes}
              </Text>
            </View>
          ) : null}
        </View>

        <Feather name="chevron-right" size={18} color={colors.text.muted} />
      </View>

      {/* Fila inferior de métricas */}
      <View
        style={[
          s.metricsRow,
          { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' },
        ]}
      >
        <View style={s.metricItem}>
          <Feather name="calendar" size={12} color="#6366F1" />
          <Text style={[s.metricText, { color: colors.text.secondary }]}>
            {client.totalVisits} {client.totalVisits === 1 ? 'cita' : 'citas'}
          </Text>
        </View>

        <View style={s.metricItem}>
          <Feather name="dollar-sign" size={12} color="#10B981" />
          <Text style={[s.metricText, { color: colors.text.secondary }]}>
            ${client.totalSpent.toLocaleString('es-MX')}
          </Text>
        </View>

        <View style={s.metricItemRight}>
          <Feather name="clock" size={12} color={colors.text.muted} />
          <Text
            style={[s.metricDateText, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {dateSummary}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  mainInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  nameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  notePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  notePreviewText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
    gap: 14,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricItemRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  metricDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

