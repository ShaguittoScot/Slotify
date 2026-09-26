import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CalendarSlot } from '@/shared/types';
import { CalendarSlotCard } from './CalendarSlotCard';
import { useAppTheme } from '@/shared/theme';

interface DayViewProps {
  selectedDate: Date;
  slots: CalendarSlot[];
  onSelectSlot?: (slot: CalendarSlot) => void;
  onEmptySlotPress?: (hour: number) => void;
}

type FilterStatus = 'all' | 'pending' | 'completed' | 'confirmed' | 'block';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 a 21:00

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  slots,
  onSelectSlot,
  onEmptySlotPress,
}) => {
  const { colors, isDark } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  // Compara si dos fechas corresponden al mismo día local (inmune a offsets UTC)
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Filtra los slots que corresponden a la fecha seleccionada
  const daySlots = useMemo(() => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.startTime);
      return isSameDay(slotDate, selectedDate);
    });
  }, [slots, selectedDate]);

  // Conteo de elementos para los chips de filtro
  const counts = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let confirmed = 0;
    let block = 0;

    daySlots.forEach((s) => {
      if (s.type === 'block') {
        block++;
      } else if (s.type === 'appointment') {
        if (s.status === 'pending') pending++;
        else if (s.status === 'completed') completed++;
        else if (s.status === 'confirmed') confirmed++;
      }
    });

    return {
      all: daySlots.length,
      pending,
      completed,
      confirmed,
      block,
    };
  }, [daySlots]);

  // Slots visibles tras aplicar el filtro de estado seleccionado
  const filteredDaySlots = useMemo(() => {
    if (activeFilter === 'all') return daySlots;
    if (activeFilter === 'block') return daySlots.filter((s) => s.type === 'block');
    return daySlots.filter((s) => s.type === 'appointment' && s.status === activeFilter);
  }, [daySlots, activeFilter]);

  // Agrupa slots visibles por hora de inicio
  const slotsByHour: Record<number, CalendarSlot[]> = {};
  filteredDaySlots.forEach((slot) => {
    const hour = new Date(slot.startTime).getHours();
    if (!slotsByHour[hour]) slotsByHour[hour] = [];
    slotsByHour[hour].push(slot);
  });

  const isToday = isSameDay(new Date(), selectedDate);
  const currentHour = new Date().getHours();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Barra Horizontal de Filtros Rápidos (Recomendación 2) */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {/* Chip: Todas */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'all'
                ? {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.18)',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  },
            ]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === 'all' ? colors.text.primary : colors.text.muted },
                activeFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              Todas ({counts.all})
            </Text>
          </TouchableOpacity>

          {/* Chip: Pendientes */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'pending'
                ? {
                    backgroundColor: 'rgba(245, 158, 11, 0.18)',
                    borderColor: '#F59E0B',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  },
            ]}
            onPress={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === 'pending' ? '#F59E0B' : colors.text.muted },
                activeFilter === 'pending' && styles.filterChipTextActive,
              ]}
            >
              Pendientes ({counts.pending})
            </Text>
          </TouchableOpacity>

          {/* Chip: Cobradas */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'completed'
                ? {
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    borderColor: '#10B981',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  },
            ]}
            onPress={() => setActiveFilter(activeFilter === 'completed' ? 'all' : 'completed')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: '#10B981' }]} />
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === 'completed' ? '#10B981' : colors.text.muted },
                activeFilter === 'completed' && styles.filterChipTextActive,
              ]}
            >
              Cobradas ({counts.completed})
            </Text>
          </TouchableOpacity>

          {/* Chip: Confirmadas */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'confirmed'
                ? {
                    backgroundColor: 'rgba(99, 102, 241, 0.18)',
                    borderColor: '#818CF8',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  },
            ]}
            onPress={() => setActiveFilter(activeFilter === 'confirmed' ? 'all' : 'confirmed')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: '#818CF8' }]} />
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === 'confirmed' ? '#818CF8' : colors.text.muted },
                activeFilter === 'confirmed' && styles.filterChipTextActive,
              ]}
            >
              Confirmadas ({counts.confirmed})
            </Text>
          </TouchableOpacity>

          {/* Chip: Bloqueos */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'block'
                ? {
                    backgroundColor: 'rgba(239, 68, 68, 0.18)',
                    borderColor: '#EF4444',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  },
            ]}
            onPress={() => setActiveFilter(activeFilter === 'block' ? 'all' : 'block')}
            activeOpacity={0.7}
          >
            <View style={[styles.filterDot, { backgroundColor: '#EF4444' }]} />
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === 'block' ? '#EF4444' : colors.text.muted },
                activeFilter === 'block' && styles.filterChipTextActive,
              ]}
            >
              Bloqueos ({counts.block})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Banner de filtro activo (si no es 'all') */}
      {activeFilter !== 'all' && (
        <View
          style={[
            styles.activeFilterBanner,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Text style={[styles.activeFilterText, { color: colors.text.secondary }]}>
            Mostrando {filteredDaySlots.length} de {daySlots.length} elementos
          </Text>
          <TouchableOpacity onPress={() => setActiveFilter('all')}>
            <Text style={styles.clearFilterLink}>Ver todas</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grilla Horaria */}
      {filteredDaySlots.length === 0 && activeFilter !== 'all' ? (
        <View style={styles.emptyFilterState}>
          <Feather
            name="filter"
            size={32}
            color={colors.text.muted}
            style={{ opacity: 0.5, marginBottom: 8 }}
          />
          <Text style={[styles.emptyFilterTitle, { color: colors.text.primary }]}>
            No hay registros con este filtro
          </Text>
          <Text style={[styles.emptyFilterDesc, { color: colors.text.muted }]}>
            No hay citas ni bloques en este estado para la fecha seleccionada.
          </Text>
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={styles.resetFilterBtnText}>Restablecer a Todas</Text>
          </TouchableOpacity>
        </View>
      ) : (
        HOURS.map((hour) => {
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
                ) : activeFilter === 'all' ? (
                  <TouchableOpacity
                    style={[
                      styles.emptySlotTouch,
                      {
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)',
                      },
                    ]}
                    onPress={() => onEmptySlotPress?.(hour)}
                    activeOpacity={0.65}
                  >
                    <View style={styles.tapPromptRow}>
                      <Feather name="plus" size={11} color={colors.text.muted} style={{ opacity: 0.6 }} />
                      <Text style={[styles.tapPromptText, { color: colors.text.muted }]}>
                        Disponible • Toca para agendar
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={{ height: 28 }} />
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 130, // Margen de seguridad amplio para la barra de navegación flotante
    paddingHorizontal: 16,
  },
  filterBarContainer: {
    marginBottom: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  filterChipTextActive: {
    fontFamily: 'Inter_600SemiBold',
  },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  activeFilterText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  clearFilterLink: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#818CF8',
  },
  emptyFilterState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyFilterTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  emptyFilterDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: '#818CF8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#818CF8',
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
  emptySlotTouch: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  tapPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tapPromptText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});

