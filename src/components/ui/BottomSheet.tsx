import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Text,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({ visible, onClose, children, title }: BottomSheetProps) {
  const { colors, isDark } = useAppTheme();
  const dragY = useRef(new RNAnimated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) dragY.setValue(0);
  }, [visible, dragY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_evt, gesture) => {
          dragY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy > 60 || gesture.vy > 0.65) {
            onCloseRef.current();
            return;
          }
          RNAnimated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },
      }),
    [dragY]
  );

  if (!visible) return null;

  const sheetBg = colors?.background?.secondary ?? (isDark ? '#141414' : '#FFFFFF');
  const borderColor = colors?.border?.main ?? (isDark ? '#262626' : '#E4E4E7');
  const handleColor = colors?.border?.strong ?? (isDark ? '#3F3F46' : '#D4D4D8');
  const titleColor = colors?.text?.primary ?? (isDark ? '#FAFAFA' : '#09090B');
  const closeBg = colors?.background?.primary ?? (isDark ? '#09090B' : '#FAFAFA');
  const closeIconColor = colors?.text?.secondary ?? (isDark ? '#A1A1AA' : '#52525B');
  const backdropColor = colors?.background?.backdrop ?? 'rgba(0, 0, 0, 0.5)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(200)}
            style={[styles.backdrop, { backgroundColor: backdropColor }]}
          />
        </TouchableWithoutFeedback>

        <RNAnimated.View
          style={[
            styles.sheetDragWrap,
            { transform: [{ translateY: dragY }] },
          ]}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(18).stiffness(150)}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.sheet,
              { backgroundColor: sheetBg, borderColor },
            ]}
          >
            <View style={styles.handleContainer} {...panResponder.panHandlers}>
              <View style={[styles.handle, { backgroundColor: handleColor }]} />
            </View>

            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.closeBtn, { backgroundColor: closeBg, borderColor }]}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar panel"
                >
                  <Feather name="x" size={18} color={closeIconColor} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.content}>
              {children}
            </View>
          </Animated.View>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetDragWrap: {
    width: '100%',
    maxHeight: '90%',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: -4,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },
});
