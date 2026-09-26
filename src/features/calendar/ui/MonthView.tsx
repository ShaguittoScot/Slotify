import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { CalendarSlot } from '@/shared/types';
import { CalendarSlotCard } from './CalendarSlotCard';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface MonthViewProps {
  selectedDate: Date;
  slots: CalendarSlot[];
  onSelectDate: (date: Date) => void;
  onSelectSlot?: (slot: CalendarSlot) => void;
}

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  slots,
  onSelectDate,
  onSelectSlot,
}) => {
  const { colors, isDark } = useAppTheme();
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  // Genera la cuadrícula de días del mes actual con los paddings iniciales y finales
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Ajuste para que Lunes sea 0
    let startDayIdx = firstDay.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Días del mes anterior
    for (let i = startDayIdx - 1; i >= 0; i--) {
      const prev = new Date(currentYear, currentMonth, -i);
      days.push({ date: prev, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(currentYear, currentMonth, i), isCurrentMonth: true });
    }

    // Completar última fila
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(currentYear, currentMonth + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Cuadrícula Flotante del Mes */}
      <View
        style={[
          styles.monthIslandCard,
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
        {/* Cabecera de días de la semana */}
        <View style={styles.weekHeader}>
          {WEEK_DAYS.map((name, idx) => (
            <Text key={idx} style={[styles.weekHeaderText, { color: colors.text.muted }]}>
              {name}
            </Text>
          ))}
        </View>

        {/* Días en cuadrícula */}
        <View style={styles.gridContainer}>
          {calendarGrid.map((item, idx) => {
            const isSelected = isSameDay(item.date, selectedDate);
            const isToday = isSameDay(item.date, new Date());
            const hasSlots = slots.some((s) => isSameDay(new Date(s.startTime), item.date));

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  isSelected && [
                    styles.dayCellSelected,
                    {
                      backgroundColor: isDark ? '#383838' : '#171717',
                    },
                  ],
                  isToday && !isSelected && [
                    styles.dayCellToday,
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
                onPress={() => onSelectDate(item.date)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.dayCellText,
                    { color: colors.text.primary },
                    !item.isCurrentMonth && { color: colors.border.strong, opacity: 0.5 },
                    isSelected && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                >
                  {item.date.getDate()}
                </Text>

                {/* Micro indicador de citas */}
                <View
                  style={[
                    styles.slotDot,
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

      {/* Detalle de citas del día seleccionado */}
      <View style={styles.dayDetailContainer}>
        <View style={styles.detailHeader}>
          <Text style={[styles.detailTitle, { color: colors.text.primary }]}>
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
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
              styles.emptyDetailCard,
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
            <Feather name="check-circle" size={20} color={colors.status.success} />
            <Text style={[styles.emptyDetailText, { color: colors.text.secondary }]}>
              Sin actividades registradas para este día
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130, // Margen de seguridad para la barra de navegación flotante
  },
  monthIslandCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    width: 38,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginVertical: 2,
  },
  dayCellSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  slotDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  dayDetailContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    textTransform: 'capitalize',
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
  emptyDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginTop: 4,
  },
  emptyDetailText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
