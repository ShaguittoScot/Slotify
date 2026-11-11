import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';
import { AnimatedPressable } from './ui/AnimatedPressable';

type TabsProps = React.ComponentProps<typeof Tabs>;
export type FloatingTabBarProps = NonNullable<TabsProps['tabBar']> extends (
  props: infer P
) => any
  ? P
  : any;

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  emitter,
  navigateToTab,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { appMode } = useAuthStore();

  const isBusiness = appMode === 'BUSINESS';
  const currentRouteOptions =
    descriptors[state.routes[state.index].key]?.options;
  const tabBarStyle = StyleSheet.flatten(
    currentRouteOptions?.tabBarStyle
  ) as any;

  if (tabBarStyle?.display === 'none') {
    return null;
  }

  const allowedRouteNames = isBusiness
    ? ['index', 'agenda', 'clients', 'settings']
    : ['explore', 'form-preview', 'index', 'settings'];

  const visibleRoutes = state.routes.filter((route: any) =>
    allowedRouteNames.includes(route.name)
  );

  const getTabConfig = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return {
          label: isBusiness ? 'Resumen' : 'Mis Citas',
          icon: (color: string) =>
            isBusiness ? (
              <Feather name="grid" size={17} color={color} />
            ) : (
              <Feather name="calendar" size={17} color={color} />
            ),
        };
      case 'agenda':
        return {
          label: 'Agenda',
          icon: (color: string) => (
            <Feather name="calendar" size={17} color={color} />
          ),
        };
      case 'clients':
        return {
          label: 'Clientes',
          icon: (color: string) => (
            <Feather name="users" size={17} color={color} />
          ),
        };
      case 'explore':
        return {
          label: 'Explorar',
          icon: (color: string) => (
            <Feather name="compass" size={17} color={color} />
          ),
        };
      case 'form-preview':
        return {
          label: 'Reservar',
          icon: (color: string) => (
            <Feather name="file-text" size={17} color={color} />
          ),
        };
      case 'settings':
        return {
          label: isBusiness ? 'Ajustes' : 'Perfil',
          icon: (color: string) =>
            isBusiness ? (
              <Feather name="sliders" size={17} color={color} />
            ) : (
              <Feather name="user" size={17} color={color} />
            ),
        };
      default:
        return {
          label: routeName,
          icon: (color: string) => (
            <Feather name="circle" size={17} color={color} />
          ),
        };
    }
  };

  const bottomMargin = Math.max(insets.bottom + 8, 18);
  const accentColor = isBusiness ? '#818CF8' : '#10B981';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: bottomMargin,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? 'rgba(15, 15, 20, 0.96)'
              : 'rgba(255, 255, 255, 0.96)',
            borderColor: isDark ? '#24242E' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {visibleRoutes.map((route: any) => {
          const originalIndex = state.routes.findIndex(
            (r: any) => r.key === route.key
          );
          const isFocused = state.index === originalIndex;
          const { label, icon } = getTabConfig(route.name);

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Animated.View
              key={route.key}
              layout={LinearTransition.springify()}
              style={{ flex: 1 }}
            >
              <AnimatedPressable
                scaleDown={0.93}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={[
                  styles.tabItem,
                  isFocused && [
                    styles.tabItemActive,
                    {
                      backgroundColor: isDark ? '#1D1D26' : '#18181B',
                      borderColor: isDark ? `${accentColor}40` : 'transparent',
                    },
                  ],
                ]}
              >
                <View style={styles.iconContainer}>
                  {icon(
                    isFocused
                      ? isDark
                        ? accentColor
                        : '#FFFFFF'
                      : isDark
                      ? '#71717A'
                      : '#737373'
                  )}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused
                        ? '#FAFAFA'
                        : isDark
                        ? '#71717A'
                        : '#737373',
                      fontWeight: isFocused ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </AnimatedPressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

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
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 440,
    height: 62,
    borderRadius: 24,
    paddingHorizontal: 5,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 22,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    gap: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11.5,
    letterSpacing: -0.2,
  },
});
