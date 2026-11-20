import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailServiceDto } from '../../types';
import { formatPrice } from '../../model';
import { createBusinessServiceStyles } from '../styles/businessService.styles';

interface BusinessServiceCardProps {
  service: BusinessDetailServiceDto;
  accentColor: string;
}

export function BusinessServiceCard({
  service,
  accentColor,
}: BusinessServiceCardProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessServiceStyles(colors, accentColor);

  const hasDescription = Boolean(
    service.description && service.description.trim().length > 0
  );
  const hasBuffer =
    typeof service.bufferTimeMinutes === 'number' && service.bufferTimeMinutes > 0;

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Servicio ${service.name}, precio ${formatPrice(service.price)}, duración ${service.durationMinutes} minutos`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.priceTag}>{formatPrice(service.price)}</Text>
      </View>

      {hasDescription && (
        <Text style={styles.serviceDescription}>{service.description}</Text>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.durationBadge}>
          <Feather name="clock" size={13} color={colors.text.muted} />
          <Text style={styles.durationText}>{service.durationMinutes} min</Text>
        </View>

        {hasBuffer && (
          <Text style={styles.bufferText}>
            (+{service.bufferTimeMinutes} min preparación)
          </Text>
        )}
      </View>
    </View>
  );
}
