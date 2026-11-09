import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
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
  const category = business.category || 'Servicios Generales';
  const hasPhone = Boolean(business.phone && business.phone.trim().length > 0);
  const hasAdvance = typeof business.minAdvanceHours === 'number' && business.minAdvanceHours > 0;
  const services = business.services || [];
  const accentColor = isValidHexColor(business.brandColor)
    ? business.brandColor!
    : colors.action.primary;
  const hasValidLogo = Boolean(
    business.logoUrl && business.logoUrl.trim().length > 0 && !imageError
  );

  const styles = useMemo(
    () => createBusinessCardStyles(colors, accentColor),
    [colors, accentColor]
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onBook(business.slug)}
      activeOpacity={0.88}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Negocio ${business.name}, categoría ${category}. Toca para reservar`}
    >
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
          <View style={styles.badgeContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category}</Text>
            </View>
          </View>
        </View>
      </View>

      {services.length > 0 && (
        <View style={styles.servicesContainer}>
          <View style={styles.servicesHeaderRow}>
            <Text style={styles.servicesLabel}>Servicios destacados</Text>
            <Text style={styles.servicesNote}>Más al agendar</Text>
          </View>
          <View style={styles.servicesList}>
            {services.slice(0, 2).map((svc) => (
              <View
                key={svc.id}
                style={styles.serviceBadge}
                accessible={true}
                accessibilityLabel={`${svc.name}, precio ${Number(svc.price).toFixed(2)} pesos, duración ${svc.durationMinutes} minutos`}
              >
                <Text style={styles.serviceBadgeName} numberOfLines={1}>
                  {svc.name}
                </Text>
                <View style={styles.serviceBadgeMeta}>
                  <Text style={styles.serviceBadgePrice}>
                    ${Number(svc.price).toFixed(2)}
                  </Text>
                  <Text style={styles.serviceBadgeDuration}>
                    • {svc.durationMinutes} min
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {(hasPhone || hasAdvance) && (
        <View style={styles.metaContainer}>
          {hasPhone && (
            <View
              style={styles.metaItem}
              accessible={true}
              accessibilityLabel={`Teléfono: ${business.phone}`}
            >
              <Feather name="phone" size={12} color={colors.text.muted} />
              <Text style={styles.metaText}>{business.phone}</Text>
            </View>
          )}
          {hasAdvance && (
            <View
              style={styles.metaItem}
              accessible={true}
              accessibilityLabel={`Anticipación mínima: ${business.minAdvanceHours} horas`}
            >
              <Feather name="clock" size={12} color={colors.text.muted} />
              <Text style={styles.metaText}>
                Anticipación mín.: {business.minAdvanceHours}h
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.slugContainer}>
          <MaterialCommunityIcons
            name="web"
            size={13}
            color={colors.text.muted}
          />
          <Text style={styles.slugText} numberOfLines={1}>
            slotify.app/{business.slug}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => onBook(business.slug)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Reservar cita en ${business.name}`}
        >
          <Feather name="calendar" size={12} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>Reservar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
