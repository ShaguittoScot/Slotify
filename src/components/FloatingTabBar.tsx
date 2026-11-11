import { useEffect, useState, type ComponentProps } from 'react';
import {
  I18nManager,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';

type TabIcon = ComponentProps<typeof Feather>['name'];

const TAB_GUTTER = 2;
const BUSINESS_TABS = ['index', 'agenda', 'clients', 'settings'];
const CONSUMER_TABS = ['explore', 'index', 'settings'];

function getTabConfig(name: string, isBusiness: boolean): { label: string; icon: TabIcon } {
  switch (name) {
    case 'index':
      return isBusiness ? { label: 'Inicio', icon: 'home' } : { label: 'Mis Citas', icon: 'calendar' };
    case 'agenda':
      return { label: 'Agenda', icon: 'calendar' };
    case 'clients':
      return { label: 'Clientes', icon: 'users' };
    case 'explore':
      return { label: 'Explorar', icon: 'compass' };
    case 'settings':
      return isBusiness ? { label: 'Ajustes', icon: 'settings' } : { label: 'Mi Perfil', icon: 'user' };
    default:
      return { label: name, icon: 'circle' };
  }
}

function TabContent({ label, icon, color, focused }: {
  label: string;
  icon: TabIcon;
  color: string;
  focused: boolean;
}) {
  return (
    <>
      <Feather name={icon} size={18} color={color} />
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}
        style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '500' }]}>
        {label}
      </Text>
    </>
  );
}

export function FloatingTabBar(props: BottomTabBarProps) {
  const { state, descriptors, insets } = props;
  const { isDark } = useAppTheme();
  const appMode = useAuthStore((session) => session.appMode);
  const options = descriptors[state.routes[state.index].key]?.options;
  if (StyleSheet.flatten(options?.tabBarStyle)?.display === 'none') return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom + 10, 20) }]}>
      <View style={[styles.container, {
        backgroundColor: isDark ? 'rgba(26, 26, 26, 0.94)' : 'rgba(255, 255, 255, 0.96)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      }]}>
        <TabTrack key={appMode} {...props} isBusiness={appMode === 'BUSINESS'} isDark={isDark} />
      </View>
    </View>
  );
}

function TabTrack({ state, descriptors, emitter, navigateToTab, isBusiness, isDark }: BottomTabBarProps & {
  isBusiness: boolean;
  isDark: boolean;
}) {
  const routes = state.routes.filter(({ name }) => (isBusiness ? BUSINESS_TABS : CONSUMER_TABS).includes(name));
  const activeKey = state.routes[state.index].key;
  const activeIndex = routes.findIndex(({ key }) => key === activeKey);
  const [trackWidth, setTrackWidth] = useState(0);
  const tabWidth = routes.length > 0 ? trackWidth / routes.length : 0;
  const indicatorWidth = tabWidth - TAB_GUTTER * 2;
  const indicatorIndex = useSharedValue(Math.max(0, activeIndex));
  const direction = I18nManager.isRTL ? -1 : 1;
  const indicatorColor = isDark ? '#383838' : '#171717';
  const showIndicator = activeIndex >= 0 && indicatorWidth > 0;

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
    transform: [{ translateX: -direction * (TAB_GUTTER + indicatorIndex.value * tabWidth) }],
  }));

  return (
    <View style={styles.track} onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}>
      {routes.map((route) => {
        const focused = route.key === activeKey;
        const fallbackHighlight = focused && !showIndicator;
        const tab = getTabConfig(route.name, isBusiness);
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel ?? tab.label}
            testID={descriptors[route.key]?.options?.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            style={[styles.tabItem, fallbackHighlight && [styles.pillShadow, { backgroundColor: indicatorColor }]]}
            activeOpacity={0.7}
          >
            <TabContent {...tab} focused={focused} color={fallbackHighlight ? '#FFFFFF' : isDark ? '#8E8E8E' : '#737373'} />
          </TouchableOpacity>
        );
      })}

      {showIndicator && (
        <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={[styles.pill, styles.pillShadow, { width: indicatorWidth, backgroundColor: indicatorColor }, indicatorPosition]}>
          {/* Las etiquetas blancas quedan recortadas por la pastilla mientras se mueve. */}
          <View style={styles.pillClip}>
            <Animated.View style={[styles.clippedLabels, { width: trackWidth }, clippedLabelsPosition]}>
              {routes.map((route) => (
                <View key={route.key} style={styles.tabItem}>
                  <TabContent {...getTabConfig(route.name, isBusiness)} focused={route.key === activeKey} color="#FFFFFF" />
                </View>
              ))}
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 4,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginHorizontal: TAB_GUTTER,
    gap: 5,
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: TAB_GUTTER,
    zIndex: 1,
    borderRadius: 24,
  },
  pillShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pillClip: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  clippedLabels: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    flexDirection: 'row',
  },
  tabLabel: {
    flexShrink: 1,
    fontSize: 11.5,
    letterSpacing: -0.2,
  },
});
