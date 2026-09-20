import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { CalendarSlot } from '@/shared/types';
import { CalendarSlotCard } from './CalendarSlotCard';
import { useAppTheme } from '@/shared/theme';

interface DayViewProps {
  selectedDate: Date;
  slots: CalendarSlot[];
  onSelectSlot?: (slot: CalendarSlot) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 a 21:00

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  slots,
  onSelectSlot,
}) => {
  const { colors, isDark } = useAppTheme();

  // Filtra los slots que corresponden a la fecha seleccionada
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const daySlots = slots.filter((slot) => {
    const slotDateStr = slot.startTime.split('T')[0];
    return slotDateStr === selectedDateStr;
  });

  // Agrupa slots por hora de inicio
  const slotsByHour: Record<number, CalendarSlot[]> = {};
  daySlots.forEach((slot) => {
    const hour = new Date(slot.startTime).getHours();
    if (!slotsByHour[hour]) slotsByHour[hour] = [];
    slotsByHour[hour].push(slot);
  });

  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const currentHour = new Date().getHours();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {HOURS.map((hour) => {
        const hourSlots = slotsByHour[hour] || [];
        const isCurrentTimeRow = isToday && currentHour === hour;

        return (
          <View key={hour} style={styles.hourRow}>
            {/* Columna de la hora con indicador de hora actual */}
            <View style={styles.hourLabelCol}>
              <View style={styles.timeLabelWrapper}>
                {isCurrentTimeRow && <View style={styles.currentHourDot} />}
                <Text
                  style={[
                    styles.hourText,
                    { color: colors.text.muted },
                    isCurrentTimeRow && {
                      color: '#818CF8',
                      fontWeight: '800',
                    },
                  ]}
                >
                  {String(hour).padStart(2, '0')}:00
                </Text>
              </View>
            </View>

            {/* Contenido de la franja horaria */}
            <View style={styles.slotCol}>
              <View
                style={[
                  styles.gridLine,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              />

              {hourSlots.length > 0 ? (
                hourSlots.map((slot) => (
                  <CalendarSlotCard
                    key={slot.resourceId}
                    slot={slot}
                    onPress={onSelectSlot}
                  />
                ))
              ) : (
                <View style={styles.emptySlotGap} />
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100, // Margen de seguridad para la barra de navegación flotante
    paddingHorizontal: 16,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 68,
    marginBottom: 6,
  },
  hourLabelCol: {
    width: 56,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  timeLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentHourDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#818CF8',
  },
  hourText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  slotCol: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 0,
  },
  emptySlotGap: {
    height: 42,
  },
});
