import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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

  // Configuración de metadatos por ruta adaptada al rol activo
  const getTabConfig = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return {
          label: appMode === 'CONSUMER' ? 'Mis Citas' : 'Agenda',
          icon: (color: string) => <Feather name="calendar" size={19} color={color} />,
        };
      case 'explore':
        return {
          label: 'Explorar',
          icon: (color: string) => (
            <MaterialCommunityIcons name="compass-outline" size={20} color={color} />
          ),
        };
      case 'settings':
        return {
          label: appMode === 'CONSUMER' ? 'Mi Perfil' : 'Ajustes',
          icon: (color: string) =>
            appMode === 'CONSUMER' ? (
              <Feather name="user" size={19} color={color} />
            ) : (
              <Feather name="settings" size={19} color={color} />
            ),
        };
      default:
        return {
          label: routeName,
          icon: (color: string) => <Feather name="circle" size={19} color={color} />,
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
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
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
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 6,
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
    paddingHorizontal: 8,
    marginHorizontal: 3,
    gap: 6,
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
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
