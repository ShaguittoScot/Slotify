import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto } from '../../types';
import type { SectorConfig } from '../../model/sector';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessCoverHeroProps {
  business: BusinessDetailDto;
  sector: SectorConfig;
  accentColor: string;
  onBack: () => void;
}

export function BusinessCoverHero({
  business,
  sector,
  accentColor,
  onBack,
}: BusinessCoverHeroProps) {
  const { colors } = useAppTheme();
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const styles = createBusinessDetailStyles(colors, accentColor);

  const initial = business.name ? business.name.trim().charAt(0).toUpperCase() : 'S';
  const hasValidLogo = Boolean(
    business.logoUrl && business.logoUrl.trim().length > 0 && !logoError
  );
  const hasCoverImage = Boolean(
    business.coverImageUrl && business.coverImageUrl.trim().length > 0 && !coverError
  );

  const handleShare = async () => {
    try {
      const shareUrl = `https://slotify.app/${business.slug || ''}`;
      await Share.share({
        title: business.name,
        message: `Visita ${business.name} en Slotify: ${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // Ignorar si el usuario cancela
    }
  };

  const locationDisplay =
    business.address?.trim() ||
    business.city?.trim() ||
    (business.timeZone ? business.timeZone.replace('_', ' ') : 'Ubicación disponible');

  return (
    <View>
      {/* ── 1. PORTADA / HERO BANNER ── */}
      <View style={styles.coverContainer}>
        {hasCoverImage ? (
          <Image
            source={{ uri: business.coverImageUrl! }}
            style={styles.coverImage}
            resizeMode="cover"
            onError={() => setCoverError(true)}
          />
        ) : (
          <View style={styles.coverFallback}>
            <MaterialCommunityIcons
              name={(sector.badgeIcon as any) || 'storefront'}
              size={54}
              color="rgba(255, 255, 255, 0.25)"
            />
          </View>
        )}

        <View style={styles.coverOverlay} />

        {/* Botones flotantes: Regresar y Compartir */}
        <View style={styles.floatingNavBar}>
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={onBack}
            activeOpacity={0.75}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regresar a la pantalla anterior"
          >
            <Feather name="arrow-left" size={19} color={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={handleShare}
            activeOpacity={0.75}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Compartir perfil del establecimiento"
          >
            <Feather name="share-2" size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. TARJETA DE IDENTIDAD DEL NEGOCIO (SUPERPUESTA) ── */}
      <View style={styles.identityCard}>
        <View style={styles.identityHeaderRow}>
          {hasValidLogo ? (
            <Image
              source={{ uri: business.logoUrl! }}
              style={styles.logoImage}
              resizeMode="cover"
              onError={() => setLogoError(true)}
              accessible={true}
              accessibilityLabel={`Logotipo de ${business.name}`}
            />
          ) : (
            <View
              style={styles.logoBox}
              accessible={true}
              accessibilityLabel={`Inicial de ${business.name}`}
            >
              <Text style={styles.logoText}>{initial}</Text>
            </View>
          )}

          <View style={styles.identityMainInfo}>
            <Text style={styles.businessName} numberOfLines={2}>
              {business.name}
            </Text>

            <View style={styles.badgesRow}>
              {/* Píldora del sector */}
              <View style={styles.sectorPill}>
                <Feather
                  name={(sector.badgeIcon as any) || 'tag'}
                  size={12}
                  color={colors.isDark ? '#A5B4FC' : accentColor}
                />
                <Text style={styles.sectorPillText}>
                  {business.category?.trim() || sector.label}
                </Text>
              </View>

              {/* Badge de verificación */}
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={12} color="#10B981" />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fila de Ubicación */}
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={accentColor} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationDisplay}
          </Text>
          {business.rating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Feather name="star" size={13} color="#F59E0B" />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '700',
                  color: colors.text.primary,
                }}
              >
                {business.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
