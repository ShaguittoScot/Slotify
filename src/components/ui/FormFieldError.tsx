import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

interface FormFieldErrorProps {
  /** Mensaje de error para el campo específico */
  error?: string | null;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({ error, style }) => {
  const { isDark } = useAppTheme();

  if (!error) return null;

  const errorColor = isDark ? '#F87171' : '#DC2626';

  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <Feather name="alert-circle" size={12} color={errorColor} style={styles.icon} />
      <Text style={[styles.text, { color: errorColor }]}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});
