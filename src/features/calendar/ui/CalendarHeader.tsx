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
  onAddPress?: () => void;
  onSearchPress?: () => void;
  onTitleDatePress?: () => void;
  appointmentCount?: number;
  blockCount?: number;
  completedCount?: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic'
];

const DAY_NAMES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const DAY_NAMES_SHORT = [
  'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  selectedDate,
  viewMode,
  onPrev,
  onNext,
  onToday,
  onSelectMode,
  onAddPress,
  onSearchPress,
  onTitleDatePress,
  appointmentCount,
  blockCount,
  completedCount,
}) => {
  const { colors, isDark, themeMode } = useAppTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);

  const formatTitle = () => {
    const day = selectedDate.getDate();
    const month = MONTH_NAMES[selectedDate.getMonth()];
    const monthShort = MONTH_NAMES_SHORT[selectedDate.getMonth()];
    const dayOfWeekShort = DAY_NAMES_SHORT[selectedDate.getDay()];

    if (viewMode === 'day') {
      return `${dayOfWeekShort}, ${day} ${monthShort}`;
    }

    if (viewMode === 'week') {
      const d = new Date(selectedDate);
      const dayIdx = d.getDay();
      const diff = d.getDate() - dayIdx + (dayIdx === 0 ? -6 : 1);
      const start = new Date(d.setDate(diff));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startMonthShort = MONTH_NAMES_SHORT[start.getMonth()];
      const endMonthShort = MONTH_NAMES_SHORT[end.getMonth()];

      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${startMonthShort}`;
      }
      return `${start.getDate()} ${startMonthShort} - ${end.getDate()} ${endMonthShort}`;
    }

    return `${month} ${selectedDate.getFullYear()}`;
  };

  const getThemeIcon = () => {
    if (themeMode === 'system') return 'smartphone';
    return isDark ? 'moon' : 'sun';
  };

  const hasMetrics = appointmentCount !== undefined || blockCount !== undefined;
  const showAdminRow = Boolean(onAddPress || hasMetrics);

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
      {/* Fila 1: Título de la fecha espacioso y controles de navegación */}
      <View style={styles.topRow}>
        {/* Título de fecha táctil (Recomendación 3: Saltar a fecha) */}
        <TouchableOpacity
          style={styles.titleWrapper}
          onPress={onTitleDatePress}
          activeOpacity={onTitleDatePress ? 0.65 : 1}
          disabled={!onTitleDatePress}
        >
          <View style={styles.titleRow}>
            <Text
              style={[styles.titleText, { color: colors.text.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatTitle()}
            </Text>
            {onTitleDatePress && (
              <Feather
                name="calendar"
                size={14}
                color="#818CF8"
                style={{ marginLeft: 6, opacity: 0.85 }}
              />
            )}
          </View>
          {viewMode !== 'month' && (
            <Text style={[styles.yearSubtitle, { color: colors.text.muted }]}>
              {selectedDate.getFullYear()} • Toca para saltar de fecha
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.navControls}>
          {/* Botón de búsqueda rápida (Recomendación 1) */}
          {onSearchPress && (
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
              onPress={onSearchPress}
              activeOpacity={0.7}
            >
              <Feather name="search" size={15} color={colors.text.primary} />
            </TouchableOpacity>
          )}

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
        </View>
      </View>

      {/* Fila 2: Segmented Control / Píldora de Modos de Vista */}
      <View style={styles.selectorWrapper}>
        <ViewModeSelector currentMode={viewMode} onSelectMode={onSelectMode} />
      </View>

      {/* Fila 3: Fila de administración con métricas y botón "+ Agendar" */}
      {showAdminRow && (
        <View style={styles.adminRow}>
          {hasMetrics ? (
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <View style={[styles.metricDot, { backgroundColor: '#818CF8' }]} />
                <Text style={[styles.metricText, { color: colors.text.secondary }]}>
                  {appointmentCount || 0} {appointmentCount === 1 ? 'cita' : 'citas'}
                </Text>
              </View>

              {completedCount !== undefined && completedCount > 0 && (
                <View style={styles.metricItem}>
                  <View style={[styles.metricDot, { backgroundColor: '#34D399' }]} />
                  <Text style={[styles.metricText, { color: '#34D399', fontFamily: 'Inter_600SemiBold' }]}>
                    {completedCount} {completedCount === 1 ? 'cobrada' : 'cobradas'}
                  </Text>
                </View>
              )}

              <View style={styles.metricItem}>
                <View style={[styles.metricDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.metricText, { color: colors.text.secondary }]}>
                  {blockCount || 0} {blockCount === 1 ? 'bloqueo' : 'bloqueos'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {/* Botón "+ Agendar" */}
          {onAddPress && (
            <TouchableOpacity
              style={styles.addPillBtn}
              onPress={onAddPress}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addPillText}>Agendar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.3,
  },
  yearSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionPillBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPill: {
    borderWidth: 1,
    paddingHorizontal: 9,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPillText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#818CF8',
  },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 2,
  },
  chevronBtn: {
    width: 26,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronDivider: {
    width: 1,
    height: 14,
  },
  selectorWrapper: {
    marginTop: 2,
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  addPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  addPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
  },
});
