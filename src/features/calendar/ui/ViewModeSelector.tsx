import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { CalendarViewMode } from '@/shared/types';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface ViewModeSelectorProps {
  currentMode: CalendarViewMode;
  onSelectMode: (mode: CalendarViewMode) => void;
}

const MODES: { id: CalendarViewMode; label: string; icon: string }[] = [
  { id: 'day', label: 'Día', icon: 'calendar' },
  { id: 'week', label: 'Semana', icon: 'grid' },
  { id: 'month', label: 'Mes', icon: 'layout' },
];

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(42, 42, 42, 0.65)'
            : 'rgba(0, 0, 0, 0.05)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      {MODES.map((item) => {
        const isSelected = currentMode === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.tab,
              isSelected && [
                styles.tabActive,
                {
                  backgroundColor: isDark ? '#383838' : '#171717',
                },
              ],
            ]}
            onPress={() => onSelectMode(item.id)}
            activeOpacity={0.75}
          >
            <Feather
              name={item.icon as any}
              size={14}
              color={isSelected ? '#FFFFFF' : isDark ? '#8E8E8E' : '#737373'}
              style={styles.icon}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: isSelected ? '#FFFFFF' : isDark ? '#8E8E8E' : '#737373',
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    gap: 6,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
