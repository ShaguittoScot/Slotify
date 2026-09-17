import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalendarStore } from '../model';
import { CalendarHeader } from './CalendarHeader';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import type { CalendarSlot } from '@/shared/types';
import { useAppTheme } from '@/shared/theme';

export const CalendarView: React.FC = () => {
  const { colors } = useAppTheme();
  const {
    viewMode,
    selectedDate,
    slots,
    isLoading,
    setViewMode,
    setSelectedDate,
    goToToday,
    navigateForward,
    navigateBackward,
    loadSlots,
  } = useCalendarStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSlots();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSlots();
    setRefreshing(false);
  };

  const handleSlotPress = (slot: CalendarSlot) => {
    const timeFormatted = `${new Date(slot.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${new Date(slot.endTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    Alert.alert(
      slot.title,
      `${timeFormatted}\n${
        slot.clientName ? `Cliente: ${slot.clientName}\n` : ''
      }${slot.blockReason ? `Motivo: ${slot.blockReason}\n` : ''}Estado: ${
        slot.status
      }`,
      [{ text: 'Cerrar', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, { backgroundColor: colors.background.secondary }]}
    >
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Encabezado del calendario con controles multiformato */}
        <CalendarHeader
          selectedDate={selectedDate}
          viewMode={viewMode}
          onPrev={navigateBackward}
          onNext={navigateForward}
          onToday={goToToday}
          onSelectMode={setViewMode}
        />

        {/* Indicador de carga */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.action.primary} />
          </View>
        ) : (
          <View style={styles.viewContainer}>
            {viewMode === 'day' && (
              <DayView
                selectedDate={selectedDate}
                slots={slots}
                onSelectSlot={handleSlotPress}
              />
            )}

            {viewMode === 'week' && (
              <WeekView
                selectedDate={selectedDate}
                slots={slots}
                onSelectDate={setSelectedDate}
                onSelectSlot={handleSlotPress}
              />
            )}

            {viewMode === 'month' && (
              <MonthView
                selectedDate={selectedDate}
                slots={slots}
                onSelectDate={setSelectedDate}
                onSelectSlot={handleSlotPress}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  viewContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
