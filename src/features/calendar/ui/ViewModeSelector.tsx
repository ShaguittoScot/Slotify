import React, { useEffect, useState, type ComponentProps } from 'react';
import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CalendarViewMode } from '@/shared/types';
import { useAppTheme } from '@/shared/theme';

interface ViewModeSelectorProps {
  currentMode: CalendarViewMode;
  onSelectMode: (mode: CalendarViewMode) => void;
}

type ModeIcon = ComponentProps<typeof Feather>['name'];

const MODES: { id: CalendarViewMode; label: string; icon: ModeIcon }[] = [
  { id: 'day', label: 'Día', icon: 'calendar' },
  { id: 'week', label: 'Semana', icon: 'grid' },
  { id: 'month', label: 'Mes', icon: 'layout' },
];

function ModeContent({ label, icon, color, focused }: {
  label: string;
  icon: ModeIcon;
  color: string;
  focused: boolean;
}) {
  return (
    <>
      <Feather name={icon} size={14} color={color} style={styles.icon} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[styles.tabText, { color, fontWeight: focused ? '700' : '500' }]}
      >
        {label}
      </Text>
    </>
  );
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const { isDark } = useAppTheme();
  const activeIndex = MODES.findIndex((item) => item.id === currentMode);
  const [trackWidth, setTrackWidth] = useState(0);
  const tabWidth = trackWidth / MODES.length;
  const indicatorIndex = useSharedValue(Math.max(0, activeIndex));
  const direction = I18nManager.isRTL ? -1 : 1;
  const indicatorColor = isDark ? '#383838' : '#171717';
  const inactiveColor = isDark ? '#8E8E8E' : '#737373';
  const showIndicator = activeIndex >= 0 && tabWidth > 0;

  useEffect(() => {
    if (activeIndex >= 0) {
      indicatorIndex.value = withTiming(activeIndex, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [activeIndex, indicatorIndex]);

  const indicatorPosition = useAnimatedStyle(() => ({
    transform: [{ translateX: direction * indicatorIndex.value * tabWidth }],
  }));

  const clippedLabelsPosition = useAnimatedStyle(() => ({
    transform: [{ translateX: -direction * indicatorIndex.value * tabWidth }],
  }));

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
      <View
        style={styles.track}
        onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}
      >
        {MODES.map((item) => {
          const isSelected = currentMode === item.id;
          const fallbackHighlight = isSelected && !showIndicator;
          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.tab,
                fallbackHighlight && [
                  styles.tabActive,
                  { backgroundColor: indicatorColor },
                ],
              ]}
              onPress={() => onSelectMode(item.id)}
              activeOpacity={0.75}
            >
              <ModeContent
                label={item.label}
                icon={item.icon}
                focused={isSelected}
                color={fallbackHighlight ? '#FFFFFF' : inactiveColor}
              />
            </TouchableOpacity>
          );
        })}

        {showIndicator && (
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.pill,
              styles.tabActive,
              { width: tabWidth, backgroundColor: indicatorColor },
              indicatorPosition,
            ]}
          >
            {/* Las etiquetas blancas quedan recortadas por la pastilla mientras se mueve. */}
            <View style={styles.pillClip}>
              <Animated.View
                style={[styles.clippedLabels, { width: trackWidth }, clippedLabelsPosition]}
              >
                {MODES.map((item) => (
                  <View key={item.id} style={styles.tab}>
                    <ModeContent
                      label={item.label}
                      icon={item.icon}
                      focused={item.id === currentMode}
                      color="#FFFFFF"
                    />
                  </View>
                ))}
              </Animated.View>
            </View>
          </Animated.View>
        )}
      </View>
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
  track: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
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
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    zIndex: 1,
    borderRadius: 19,
  },
  pillClip: {
    flex: 1,
    borderRadius: 19,
    overflow: 'hidden',
  },
  clippedLabels: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    flexDirection: 'row',
  },
  icon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
