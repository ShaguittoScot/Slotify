import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { CalendarSlot } from '@/shared/types';
import { useAppTheme } from '@/shared/theme';

interface CalendarSlotCardProps {
  slot: CalendarSlot;
  onPress?: (slot: CalendarSlot) => void;
}

export const CalendarSlotCard: React.FC<CalendarSlotCardProps> = ({ slot, onPress }) => {
  const { colors, isDark } = useAppTheme();

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAppointment = slot.type === 'appointment';
  const isBlock = slot.type === 'block';
  const isCompleted = slot.status === 'completed';
  const isCancelled = slot.status === 'cancelled';

  // Determinación de superficies Glassmorphism y acentos
  const cardBg = isCompleted
    ? isDark
      ? 'rgba(16, 185, 129, 0.12)'
      : 'rgba(16, 185, 129, 0.06)'
    : isCancelled
    ? isDark
      ? 'rgba(239, 68, 68, 0.08)'
      : 'rgba(239, 68, 68, 0.04)'
    : isAppointment
    ? isDark
      ? 'rgba(99, 102, 241, 0.12)'
      : 'rgba(99, 102, 241, 0.06)'
    : isBlock
    ? isDark
      ? 'rgba(239, 68, 68, 0.12)'
      : 'rgba(239, 68, 68, 0.06)'
    : isDark
    ? 'rgba(255, 255, 255, 0.035)'
    : 'rgba(0, 0, 0, 0.03)';

  const borderColor = isCompleted
    ? isDark
      ? 'rgba(16, 185, 129, 0.28)'
      : 'rgba(16, 185, 129, 0.20)'
    : isCancelled
    ? isDark
      ? 'rgba(239, 68, 68, 0.25)'
      : 'rgba(239, 68, 68, 0.18)'
    : isAppointment
    ? isDark
      ? 'rgba(99, 102, 241, 0.28)'
      : 'rgba(99, 102, 241, 0.20)'
    : isBlock
    ? isDark
      ? 'rgba(239, 68, 68, 0.28)'
      : 'rgba(239, 68, 68, 0.20)'
    : isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.06)';

  const accentColor = isCompleted
    ? '#34D399'
    : isCancelled
    ? '#EF4444'
    : isAppointment
    ? '#818CF8'
    : isBlock
    ? '#F87171'
    : '#34D399';

  const badgeText = isCompleted
    ? 'COMPLETADA'
    : isCancelled
    ? 'CANCELADA'
    : isAppointment
    ? 'CONFIRMADA'
    : isBlock
    ? 'BLOQUEADO'
    : 'DISPONIBLE';

  const badgeBg = isCompleted
    ? isDark
      ? 'rgba(16, 185, 129, 0.22)'
      : 'rgba(16, 185, 129, 0.12)'
    : isCancelled || isBlock
    ? isDark
      ? 'rgba(239, 68, 68, 0.22)'
      : 'rgba(239, 68, 68, 0.12)'
    : isDark
    ? 'rgba(99, 102, 241, 0.22)'
    : 'rgba(99, 102, 241, 0.12)';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
        },
      ]}
      onPress={() => onPress?.(slot)}
      activeOpacity={0.75}
    >
      {/* Indicador de acento vertical estilizado */}
      <View style={[styles.accentIndicator, { backgroundColor: accentColor }]} />

      <View style={styles.cardContent}>
        {/* Encabezado: Horario en micro-píldora y Badge de estado */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.timePill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <Feather name="clock" size={11} color={accentColor} />
            <Text style={[styles.timeText, { color: colors.text.secondary }]}>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: badgeBg,
              },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: accentColor }]}>
              {badgeText}
            </Text>
          </View>
        </View>

        {/* Título de la Cita / Servicio */}
        <Text style={[styles.titleText, { color: colors.text.primary }]} numberOfLines={1}>
          {slot.title}
        </Text>

        {/* Información del Cliente o Motivo de Bloqueo */}
        {slot.clientName ? (
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Feather name="user" size={12} color={colors.text.muted} />
            </View>
            <Text style={[styles.infoText, { color: colors.text.secondary }]} numberOfLines={1}>
              {slot.clientName}
            </Text>
          </View>
        ) : null}

        {slot.blockReason ? (
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                },
              ]}
            >
              <MaterialCommunityIcons name="lock-outline" size={12} color="#F87171" />
            </View>
            <Text style={styles.blockReasonText} numberOfLines={1}>
              {slot.blockReason}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    marginVertical: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentIndicator: {
    width: 4,
    marginVertical: 12,
    marginLeft: 4,
    borderRadius: 2,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    gap: 5,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 1,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  blockReasonText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#FCA5A5',
  },
});
