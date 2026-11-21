import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto } from '../../types';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessDetailHeaderProps {
  business: BusinessDetailDto;
  accentColor: string;
  onBack: () => void;
}

export function BusinessDetailHeader({
  business,
  accentColor,
  onBack,
}: BusinessDetailHeaderProps) {
  const { colors } = useAppTheme();
  const [imageError, setImageError] = useState(false);
  const styles = createBusinessDetailStyles(colors, accentColor);

  const initial = business.name ? business.name.trim().charAt(0).toUpperCase() : 'S';
  const category = business.category?.trim() || 'Servicios Generales';
  const hasValidLogo = Boolean(
    business.logoUrl && business.logoUrl.trim().length > 0 && !imageError
  );

  return (
    <View>
      {/* Barra de navegación superior con botón atrás */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Regresar a la pantalla anterior"
        >
          <Feather name="arrow-left" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {business.name}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      {/* Tarjeta principal del negocio */}
      <View style={styles.headerCard}>
        <View style={styles.headerMainRow}>
          {hasValidLogo ? (
            <Image
              source={{ uri: business.logoUrl! }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
              accessible={true}
              accessibilityLabel={`Logotipo de ${business.name}`}
            />
          ) : (
            <View
              style={styles.avatarBox}
              accessible={true}
              accessibilityLabel={`Inicial de ${business.name}`}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}

          <View style={styles.headerTitleContainer}>
            <Text style={styles.businessName} numberOfLines={2}>
              {business.name}
            </Text>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          </View>
        </View>

        {business.slug ? (
          <View style={styles.slugRow}>
            <MaterialCommunityIcons
              name="web"
              size={14}
              color={colors.text.muted}
            />
            <Text style={styles.slugText} numberOfLines={1}>
              slotify.app/{business.slug}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
