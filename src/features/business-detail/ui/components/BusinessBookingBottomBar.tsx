import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto } from '../../types';
import type { SectorConfig } from '../../model/sector';
import { formatPrice } from '../../model';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessBookingBottomBarProps {
  business: BusinessDetailDto;
  sector: SectorConfig;
  accentColor: string;
  onBook: () => void;
}

export function BusinessBookingBottomBar({
  business,
  sector,
  accentColor,
  onBook,
}: BusinessBookingBottomBarProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessDetailStyles(colors, accentColor);

  const activeServices = (business.services || []).filter((s) => s.isActive !== false);
  const minPrice =
    activeServices.length > 0
      ? Math.min(...activeServices.map((s) => Number(s.price) || 0))
      : null;

  return (
    <View style={styles.bottomBarContainer}>
      <View style={styles.bottomBarSummaryCol}>
        <Text style={styles.bottomBarSummaryLabel}>
          {sector.type === 'restaurant' ? 'Mesa / Turno' : 'Disponibilidad'}
        </Text>
        <Text style={styles.bottomBarPriceHint} numberOfLines={1}>
          {minPrice !== null && minPrice > 0
            ? `Desde ${formatPrice(minPrice)}`
            : 'Reserva online 24/7'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.bookCtaButton}
        onPress={onBook}
        activeOpacity={0.85}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${sector.ctaText} en ${business.name}`}
      >
        <Feather name={(sector.ctaIcon as any) || 'calendar'} size={17} color="#FFFFFF" />
        <Text style={styles.bookCtaText}>{sector.ctaText}</Text>
      </TouchableOpacity>
    </View>
  );
}
