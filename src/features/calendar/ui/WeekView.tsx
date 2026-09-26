import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { CalendarSlot } from '@/shared/types';
import { CalendarSlotCard } from './CalendarSlotCard';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface WeekViewProps {
  selectedDate: Date;
  slots: CalendarSlot[];
  onSelectDate: (date: Date) => void;
  onSelectSlot?: (slot: CalendarSlot) => void;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const WeekView: React.FC<WeekViewProps> = ({
  selectedDate,
  slots,
  onSelectDate,
  onSelectSlot,
}) => {
  const { colors, isDark } = useAppTheme();

  // Genera los 7 días de la semana actual (Lunes a Domingo)
  const weekDays = useMemo(() => {
    const d = new Date(selectedDate);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }, [selectedDate]);

  // Compara si dos fechas corresponden al mismo día local (inmune a offsets UTC)
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Slots del día seleccionado
  const activeDaySlots = slots.filter((s) => {
    const slotDate = new Date(s.startTime);
    return isSameDay(slotDate, selectedDate);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Isla Flotante: Selector de los 7 días de la semana */}
      <View
        style={[
          styles.weekIslandContainer,
          {
            backgroundColor: isDark
              ? 'rgba(26, 26, 26, 0.85)'
              : 'rgba(255, 255, 255, 0.90)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.daysRow}>
          {weekDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasSlots = slots.some((s) => isSameDay(new Date(s.startTime), day));

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayChip,
                  isSelected && [
                    styles.dayChipSelected,
                    {
                      backgroundColor: isDark ? '#383838' : '#171717',
                    },
                  ],
                  isToday && !isSelected && [
                    styles.dayChipToday,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 102, 241, 0.14)'
                        : 'rgba(99, 102, 241, 0.08)',
                      borderColor: isDark
                        ? 'rgba(99, 102, 241, 0.35)'
                        : 'rgba(99, 102, 241, 0.25)',
                    },
                  ],
                ]}
                onPress={() => onSelectDate(day)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.dayNameText,
                    { color: isSelected ? '#FFFFFF' : isDark ? '#8E8E8E' : '#737373' },
                  ]}
                >
                  {DAY_LABELS[idx]}
                </Text>
                <Text
                  style={[
                    styles.dayNumberText,
                    { color: isSelected ? '#FFFFFF' : colors.text.primary },
                    isSelected && styles.dayNumberTextSelected,
                  ]}
                >
                  {day.getDate()}
                </Text>

                {/* Punto indicador de citas */}
                <View
                  style={[
                    styles.dotIndicator,
                    hasSlots && {
                      backgroundColor: isSelected ? '#818CF8' : colors.text.muted,
                    },
                    !hasSlots && { backgroundColor: 'transparent' },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Agenda del día seleccionado */}
      <ScrollView
        style={styles.slotsScroll}
        contentContainerStyle={styles.slotsScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
            Agenda del Día
          </Text>
          <View
            style={[
              styles.countPill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <Text style={[styles.countPillText, { color: colors.text.secondary }]}>
              {activeDaySlots.length} {activeDaySlots.length === 1 ? 'cita' : 'citas'}
            </Text>
          </View>
        </View>

        {activeDaySlots.length > 0 ? (
          activeDaySlots.map((slot) => (
            <CalendarSlotCard key={slot.resourceId} slot={slot} onPress={onSelectSlot} />
          ))
        ) : (
          <View
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: isDark
                  ? 'rgba(26, 26, 26, 0.6)'
                  : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.03)',
                },
              ]}
            >
              <Feather name="calendar" size={26} color={colors.text.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              Sin citas programadas
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Este día tiene su agenda libre y disponible para nuevas reservaciones.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekIslandContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    width: 44,
    height: 60,
  },
  dayChipSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  dayChipToday: {
    borderWidth: 1,
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  dayNumberText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  dayNumberTextSelected: {
    fontWeight: '800',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  slotsScroll: {
    flex: 1,
  },
  slotsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 130, // Espacio libre amplio para la barra flotante inferior
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
