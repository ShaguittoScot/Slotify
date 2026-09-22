import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  visible,
  message,
  type = 'success',
  duration = 2600,
  onDismiss,
}) => {
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle' as const,
          color: '#10B981',
          bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
          border: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: '#EF4444',
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.10)',
          border: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
        };
      case 'warning':
        return {
          icon: 'alert-triangle' as const,
          color: '#F59E0B',
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.10)',
          border: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)',
        };
      case 'info':
      default:
        return {
          icon: 'info' as const,
          color: '#818CF8',
          bg: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.10)',
          border: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.25)',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <View style={styles.outerWrapper} pointerEvents="none">
      <Animated.View
        entering={FadeInDown.duration(260)}
        exiting={FadeOutUp.duration(180)}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#181A26' : '#FFFFFF',
            borderColor: config.border,
            shadowColor: config.color,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
          <Feather name={config.icon} size={16} color={config.color} />
        </View>
        <Text style={[styles.messageText, { color: colors.text.primary }]} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    top: Platform.select({ ios: 54, android: 46, default: 46 }),
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    gap: 10,
    maxWidth: 420,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
});
