import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAppTheme } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/model';

type TabsProps = React.ComponentProps<typeof Tabs>;
export type FloatingTabBarProps = NonNullable<TabsProps['tabBar']> extends (
  props: infer P
) => any
  ? P
  : any;

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { appMode } = useAuthStore();

  const isBusiness = appMode === 'BUSINESS';

  // Configuración de rutas visibles según el rol del usuario
  const allowedRouteNames = isBusiness
    ? ['index', 'agenda', 'clients', 'settings']
    : ['explore', 'index', 'settings'];

  const visibleRoutes = state.routes.filter((route: any) =>
    allowedRouteNames.includes(route.name)
  );

  const getTabConfig = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return {
          label: isBusiness ? 'Inicio' : 'Mis Citas',
          icon: (color: string) =>
            isBusiness ? (
              <Feather name="home" size={18} color={color} />
            ) : (
              <Feather name="calendar" size={18} color={color} />
            ),
        };
      case 'agenda':
        return {
          label: 'Agenda',
          icon: (color: string) => <Feather name="calendar" size={18} color={color} />,
        };
      case 'clients':
        return {
          label: 'Clientes',
          icon: (color: string) => <Feather name="users" size={18} color={color} />,
        };
      case 'explore':
        return {
          label: 'Explorar',
          icon: (color: string) => <Feather name="compass" size={18} color={color} />,
        };
      case 'settings':
        return {
          label: isBusiness ? 'Ajustes' : 'Mi Perfil',
          icon: (color: string) =>
            isBusiness ? (
              <Feather name="settings" size={18} color={color} />
            ) : (
              <Feather name="user" size={18} color={color} />
            ),
        };
      default:
        return {
          label: routeName,
          icon: (color: string) => <Feather name="circle" size={18} color={color} />,
        };
    }
  };

  const bottomMargin = Math.max(insets.bottom + 10, 20);

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
              ? 'rgba(26, 26, 26, 0.94)'
              : 'rgba(255, 255, 255, 0.96)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {visibleRoutes.map((route: any) => {
          const originalIndex = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === originalIndex;
          const { label, icon } = getTabConfig(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel}
              testID={descriptors[route.key]?.options?.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabItem,
                isFocused && [
                  styles.tabItemActive,
                  {
                    backgroundColor: isDark ? '#383838' : '#171717',
                  },
                ],
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {icon(
                  isFocused
                    ? '#FFFFFF'
                    : isDark
                    ? '#8E8E8E'
                    : '#737373'
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused
                      ? '#FFFFFF'
                      : isDark
                      ? '#8E8E8E'
                      : '#737373',
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
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
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    gap: 5,
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
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
