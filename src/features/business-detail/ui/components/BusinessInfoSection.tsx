import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto } from '../../types';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessInfoSectionProps {
  business: BusinessDetailDto;
  accentColor: string;
}

export function BusinessInfoSection({
  business,
  accentColor,
}: BusinessInfoSectionProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessDetailStyles(colors, accentColor);

  const hasPhone = Boolean(business.phone && business.phone.trim().length > 0);
  const hasMinAdvance =
    typeof business.minAdvanceHours === 'number' && business.minAdvanceHours > 0;
  const hasMaxAdvance =
    typeof business.maxAdvanceDays === 'number' && business.maxAdvanceDays > 0;
  const hasTimeZone = Boolean(business.timeZone && business.timeZone.trim().length > 0);

  // Si no hay datos disponibles que mostrar, no renderizamos la sección para evitar cajas vacías
  if (!hasPhone && !hasMinAdvance && !hasMaxAdvance && !hasTimeZone) {
    return null;
  }

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Información de atención</Text>

      {hasPhone && (
        <View
          style={styles.infoRow}
          accessible={true}
          accessibilityLabel={`Teléfono de contacto: ${business.phone}`}
        >
          <View style={styles.infoIconBox}>
            <Feather name="phone" size={16} color={colors.text.secondary} />
          </View>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{business.phone}</Text>
          </View>
        </View>
      )}

      {hasMinAdvance && (
        <View
          style={styles.infoRow}
          accessible={true}
          accessibilityLabel={`Anticipación mínima para reservar: ${business.minAdvanceHours} horas`}
        >
          <View style={styles.infoIconBox}>
            <Feather name="clock" size={16} color={colors.text.secondary} />
          </View>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoLabel}>Anticipación mínima</Text>
            <Text style={styles.infoValue}>
              {business.minAdvanceHours}{' '}
              {business.minAdvanceHours === 1 ? 'hora antes' : 'horas antes'}
            </Text>
          </View>
        </View>
      )}

      {hasMaxAdvance && (
        <View
          style={styles.infoRow}
          accessible={true}
          accessibilityLabel={`Ventana de reserva: hasta ${business.maxAdvanceDays} días de anticipación`}
        >
          <View style={styles.infoIconBox}>
            <Feather name="calendar" size={16} color={colors.text.secondary} />
          </View>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoLabel}>Agenda abierta</Text>
            <Text style={styles.infoValue}>
              Hasta con {business.maxAdvanceDays}{' '}
              {business.maxAdvanceDays === 1 ? 'día' : 'días'} de anticipación
            </Text>
          </View>
        </View>
      )}

      {hasTimeZone && (
        <View
          style={styles.infoRow}
          accessible={true}
          accessibilityLabel={`Zona horaria del negocio: ${business.timeZone}`}
        >
          <View style={styles.infoIconBox}>
            <Feather name="globe" size={16} color={colors.text.secondary} />
          </View>
          <View style={styles.infoTextCol}>
            <Text style={styles.infoLabel}>Zona horaria</Text>
            <Text style={styles.infoValue}>{business.timeZone}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
