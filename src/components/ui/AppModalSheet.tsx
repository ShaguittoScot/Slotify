import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/shared/theme';

export interface AppModalSheetProps {
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
  keyboardAvoiding?: boolean;
  animationType?: 'slide' | 'fade';
  sheetStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Contenedor modal inferior estandarizado con soporte uniforme para:
 * - Cierre al tocar el backdrop (respetando `dismissible`)
 * - Cierre por deslizamiento vertical sobre el indicador superior (`PanResponder`)
 * - Tokens del tema Obsidian con respaldos seguros para mocks parciales en pruebas
 */
export function AppModalSheet({
  visible,
  onClose,
  dismissible = true,
  keyboardAvoiding = false,
  animationType = 'slide',
  sheetStyle,
  children,
}: AppModalSheetProps) {
  const theme = useAppTheme();
  const isDark = theme?.isDark ?? false;
  const colors = theme?.colors;

  const backdropColor =
    colors?.background?.backdrop ?? 'rgba(0, 0, 0, 0.58)';
  const sheetBg =
    colors?.background?.secondary ?? (isDark ? '#141414' : '#FFFFFF');
  const borderColor =
    colors?.border?.main ?? (isDark ? '#262626' : '#E4E4E7');
  const handleColor =
    colors?.border?.strong ?? (isDark ? '#3F3F46' : '#D4D4D8');

  const dragY = useRef(new Animated.Value(0)).current;
  const dismissibleRef = useRef(dismissible);
  const onCloseRef = useRef(onClose);
  dismissibleRef.current = dismissible;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
    }
  }, [visible, dragY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => dismissibleRef.current,
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          dismissibleRef.current &&
          gesture.dy > 4 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_evt, gesture) => {
          if (!dismissibleRef.current) return;
          dragY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (
            dismissibleRef.current &&
            (gesture.dy > 60 || gesture.vy > 0.65)
          ) {
            onCloseRef.current();
            return;
          }
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY]
  );

  const handleRequestClose = () => {
    if (dismissibleRef.current) {
      onCloseRef.current();
    }
  };

  const containerBody = (
    <View style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar menú"
        accessible={false}
        style={[styles.backdrop, { backgroundColor: backdropColor }]}
        onPress={handleRequestClose}
      />

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: sheetBg,
            borderColor,
            transform: [{ translateY: dragY }],
          },
          sheetStyle,
        ]}
      >
        <View
          style={styles.handleWrap}
          {...(dismissible ? panResponder.panHandlers : {})}
        >
          <View style={[styles.handleBar, { backgroundColor: handleColor }]} />
        </View>
        {children}
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={handleRequestClose}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {containerBody}
        </KeyboardAvoidingView>
      ) : (
        containerBody
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 18,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 11,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});
