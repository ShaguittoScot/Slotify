import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { CalendarViewMode } from '@/shared/types';
import { ViewModeSelector } from './ViewModeSelector';
import { useAppTheme, ThemeSettingsModal } from '@/shared/theme';

interface CalendarHeaderProps {
  selectedDate: Date;
  viewMode: CalendarViewMode;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelectMode: (mode: CalendarViewMode) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  selectedDate,
  viewMode,
  onPrev,
  onNext,
  onToday,
  onSelectMode,
}) => {
  const { colors, isDark, themeMode } = useAppTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const formatTitle = () => {
    const day = selectedDate.getDate();
    const month = MONTH_NAMES[selectedDate.getMonth()];
    const dayOfWeek = DAY_NAMES[selectedDate.getDay()];

    if (viewMode === 'day') {
      return `${dayOfWeek}, ${day} ${month}`;
    }

    if (viewMode === 'week') {
      const d = new Date(selectedDate);
      const dayIdx = d.getDay();
      const diff = d.getDate() - dayIdx + (dayIdx === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startMonth = MONTH_NAMES[start.getMonth()];
      const endMonth = MONTH_NAMES[end.getMonth()];

      if (startMonth === endMonth) {
        return `${start.getDate()} - ${end.getDate()} ${startMonth}`;
      }
      return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth}`;
    }

    return `${month} ${selectedDate.getFullYear()}`;
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') return 'smartphone';
    return isDark ? 'moon' : 'sun';
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark
            ? 'rgba(26, 26, 26, 0.90)'
            : 'rgba(255, 255, 255, 0.94)',
          borderBottomColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      {/* Fila 1: Tipografía elegante de fecha y barra unificada de acciones */}
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          <Text style={[styles.titleText, { color: colors.text.primary }]}>
            {formatTitle()}
          </Text>
          <Text style={[styles.yearSubtitle, { color: colors.text.muted }]}>
            {selectedDate.getFullYear()}
          </Text>
        </View>

        <View style={styles.navControls}>
          {/* Botón de apariencia / tema */}
          <TouchableOpacity
            style={[
              styles.actionPillBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
            onPress={() => setShowThemeModal(true)}
            activeOpacity={0.7}
          >
            <Feather name={getThemeIcon()} size={15} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Botón "Hoy" en píldora */}
          <TouchableOpacity
            style={[
              styles.todayPill,
              {
                backgroundColor: isDark
                  ? 'rgba(99, 102, 241, 0.16)'
                  : 'rgba(99, 102, 241, 0.10)',
                borderColor: isDark
                  ? 'rgba(99, 102, 241, 0.35)'
                  : 'rgba(99, 102, 241, 0.25)',
              },
            ]}
            onPress={onToday}
            activeOpacity={0.7}
          >
            <Text style={styles.todayPillText}>Hoy</Text>
          </TouchableOpacity>

          {/* Cápsula combinada de navegación < > */}
          <View
            style={[
              styles.chevronGroup,
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
            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={onPrev}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={17} color={colors.text.primary} />
            </TouchableOpacity>
            <View
              style={[
                styles.chevronDivider,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            />
            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={onNext}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={17} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Fila 2: Segmented Control / Píldora de Modos de Vista */}
      <View style={styles.selectorWrapper}>
        <ViewModeSelector currentMode={viewMode} onSelectMode={onSelectMode} />
      </View>

      {/* Modal de Ajustes de Apariencia */}
      <ThemeSettingsModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  yearSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818CF8',
  },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 2,
  },
  chevronBtn: {
    width: 30,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronDivider: {
    width: 1,
    height: 16,
  },
  selectorWrapper: {
    marginTop: 2,
  },
});
