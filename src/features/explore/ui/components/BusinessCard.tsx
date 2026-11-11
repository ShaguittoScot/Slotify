import React, { useState, useMemo } from 'react';
import { View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import type { BusinessDto } from '../../types';
import { isValidHexColor } from '../../model';
import { createBusinessCardStyles } from '../styles/businessCard.styles';

interface BusinessCardProps {
  business: BusinessDto;
  onBook: (slug: string) => void;
}

export function BusinessCard({ business, onBook }: BusinessCardProps) {
  const { colors } = useAppTheme();
  const [imageError, setImageError] = useState(false);

  const initial = business.name ? business.name.charAt(0).toUpperCase() : 'S';
  const category = business.category || 'Servicios';
  const services = business.services || [];
  const accentColor = isValidHexColor(business.brandColor)
    ? business.brandColor!
    : '#6366F1';
  const hasValidLogo = Boolean(
    business.logoUrl && business.logoUrl.trim().length > 0 && !imageError
  );

  const styles = useMemo(
    () => createBusinessCardStyles(colors, accentColor),
    [colors, accentColor]
  );

  return (
    <Animated.View entering={FadeInDown.duration(380).springify()}>
      <AnimatedPressable
        style={styles.card}
        onPress={() => onBook(business.slug)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Negocio ${business.name}, categoría ${category}. Toca para reservar`}
      >
        {/* Cabecera limpia: Avatar + Nombre/Categoría + Acción */}
        <View style={styles.cardHeader}>
          {hasValidLogo ? (
            <Image
              source={{ uri: business.logoUrl! }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
              accessibilityLabel={`Logotipo de ${business.name}`}
            />
          ) : (
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}

          <View style={styles.businessInfo}>
            <Text style={styles.businessName} numberOfLines={1}>
              {business.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.categoryDot} />
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          </View>

          <View style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>Reservar</Text>
            <Feather name="arrow-up-right" size={13} color="#FFFFFF" />
          </View>
        </View>

        {/* Píldoras minimalistas de servicios (máx. 2 para evitar saturación) */}
        {services.length > 0 && (
          <View style={styles.servicesList}>
            {services.slice(0, 2).map((svc) => (
              <View key={svc.id} style={styles.serviceBadge}>
                <Text style={styles.serviceBadgeName} numberOfLines={1}>
                  {svc.name}
                </Text>
                <Text style={styles.serviceBadgePrice}>
                  ${Number(svc.price).toFixed(0)}
                </Text>
              </View>
            ))}
            {services.length > 2 && (
              <View style={styles.moreServicesBadge}>
                <Text style={styles.moreServicesText}>
                  +{services.length - 2}
                </Text>
              </View>
            )}
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}
