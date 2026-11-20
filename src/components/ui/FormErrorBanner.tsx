import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { NormalizedError } from '@/shared/lib/errorUtils';

interface FormErrorBannerProps {
  /** Error a mostrar: puede ser un objeto NormalizedError o una cadena */
  error?: NormalizedError | string | null;
  /** Callback opcional para cerrar/descartar el mensaje de error */
  onDismiss?: () => void;
  /** Callback opcional para permitir reintentar la acción */
  onRetry?: () => void;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
}

export const FormErrorBanner: React.FC<FormErrorBannerProps> = ({
  error,
  onDismiss,
  onRetry,
  style,
}) => {
  const { colors, isDark } = useAppTheme();

  if (!error) return null;

  const isNormalized = typeof error === 'object' && 'message' in error;
  const title = isNormalized && error.title ? error.title : 'No se pudo guardar la información';
  const message = isNormalized ? error.message : error;
  const fieldErrors = isNormalized ? error.fieldErrors : undefined;

  // Paleta de colores de error accesible con alto contraste
  const errorBg = isDark ? '#2D1214' : '#FEE2E2';
  const errorBorder = isDark ? '#7F1D1D' : '#FCA5A5';
  const errorIconColor = isDark ? '#F87171' : '#DC2626';
  const errorTitleColor = isDark ? '#FECACA' : '#991B1B';
  const errorTextColor = isDark ? '#FCA5A5' : '#B91C1C';
  const actionTextColor = isDark ? '#F87171' : '#B91C1C';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: errorBg,
          borderColor: errorBorder,
        },
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Feather name="alert-circle" size={18} color={errorIconColor} />
        </View>

        <View style={styles.textContainer}>
          {title ? (
            <Text style={[styles.title, { color: errorTitleColor }]}>{title}</Text>
          ) : null}
          <Text style={[styles.message, { color: errorTextColor }]}>{message}</Text>

          {/* Lista de errores por campo si vienen en el payload */}
          {fieldErrors && Object.keys(fieldErrors).length > 0 ? (
            <View style={styles.fieldList}>
              {Object.entries(fieldErrors).map(([field, errText]) => (
                <View key={field} style={styles.fieldItem}>
                  <Text style={[styles.bullet, { color: errorTextColor }]}>•</Text>
                  <Text style={[styles.fieldItemText, { color: errorTextColor }]}>
                    {errText}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {onRetry ? (
            <TouchableOpacity
              onPress={onRetry}
              style={styles.retryBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Reintentar acción"
            >
              <Feather name="refresh-cw" size={13} color={actionTextColor} style={styles.retryIcon} />
              <Text style={[styles.retryText, { color: actionTextColor }]}>Reintentar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {onDismiss ? (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar mensaje de error"
          >
            <Feather name="x" size={16} color={errorIconColor} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginTop: 2,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  fieldList: {
    marginTop: 6,
    paddingLeft: 4,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bullet: {
    fontSize: 14,
    marginRight: 6,
  },
  fieldItemText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 3,
  },
  retryIcon: {
    marginRight: 5,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  closeBtn: {
    marginLeft: 8,
    padding: 2,
  },
});
