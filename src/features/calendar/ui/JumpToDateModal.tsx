import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface JumpToDateModalProps {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const JumpToDateModal: React.FC<JumpToDateModalProps> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const { colors, isDark } = useAppTheme();

  // Estado para el mes y año que se está explorando en el mini-calendario
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  // Actualiza el mes visible cuando se abre o cambia la fecha seleccionada
  React.useEffect(() => {
    if (visible) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [visible, selectedDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePickDate = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    onSelectDate(newDate);
    onClose();
  };

  // Atajos rápidos
  const handleQuickJump = (type: 'today' | 'tomorrow' | 'week' | 'monthEnd') => {
    const now = new Date();
    let target = new Date();

    if (type === 'today') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (type === 'tomorrow') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (type === 'week') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    } else if (type === 'monthEnd') {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    onSelectDate(target);
    onClose();
  };

  // Generación de la grilla de días del mes
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Domingo

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const isCurrentMonthSelected =
    selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header del Modal */}
          <View style={styles.modalHeader}>
            <View style={styles.titleGroup}>
              <Feather name="calendar" size={17} color="#818CF8" style={{ marginRight: 6 }} />
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Saltar a Fecha
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* Fila de Atajos Rápidos */}
          <View style={styles.quickShortcuts}>
            <TouchableOpacity
              style={[
                styles.quickPill,
                {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.14)' : 'rgba(99, 102, 241, 0.08)',
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.30)' : 'rgba(99, 102, 241, 0.20)',
                },
              ]}
              onPress={() => handleQuickJump('today')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickPillTextActive}>Hoy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
              onPress={() => handleQuickJump('tomorrow')}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickPillText, { color: colors.text.secondary }]}>Mañana</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
              onPress={() => handleQuickJump('week')}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickPillText, { color: colors.text.secondary }]}>+7 días</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
              onPress={() => handleQuickJump('monthEnd')}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickPillText, { color: colors.text.secondary }]}>Fin de mes</Text>
            </TouchableOpacity>
          </View>

          {/* Navegador de Mes / Año */}
          <View
            style={[
              styles.monthNavigator,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
              <Feather name="chevron-left" size={18} color={colors.text.primary} />
            </TouchableOpacity>

            <Text style={[styles.monthLabel, { color: colors.text.primary }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
              <Feather name="chevron-right" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Cabecera de Días de la Semana */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_HEADERS.map((w, idx) => (
              <Text
                key={idx}
                style={[
                  styles.weekdayText,
                  { color: idx === 0 || idx === 6 ? '#818CF8' : colors.text.muted },
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* Matriz de Días del Mes */}
          <View style={styles.daysMatrix}>
            {daysGrid.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
              }

              const isSelectedDay = isCurrentMonthSelected && selectedDate.getDate() === day;
              const isTodayDay = isCurrentMonthToday && today.getDate() === day;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelectedDay && styles.dayCellSelected,
                    isTodayDay && !isSelectedDay && {
                      borderColor: '#818CF8',
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handlePickDate(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.text.primary },
                      isSelectedDay && styles.dayTextSelected,
                      isTodayDay && !isSelectedDay && { color: '#818CF8', fontWeight: '700' },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  closeBtn: {
    padding: 4,
  },
  quickShortcuts: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  quickPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPillText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  quickPillTextActive: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#818CF8',
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  daysMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: '#6366F1',
  },
  dayText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
});
