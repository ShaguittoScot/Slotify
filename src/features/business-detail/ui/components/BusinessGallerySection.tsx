import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import type { BusinessDetailDto, BusinessGalleryItem } from '../../types';
import type { SectorConfig } from '../../model/sector';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

interface BusinessGallerySectionProps {
  business: BusinessDetailDto;
  sector: SectorConfig;
  accentColor: string;
}

export function BusinessGallerySection({
  business,
  sector,
  accentColor,
}: BusinessGallerySectionProps) {
  const { colors } = useAppTheme();
  const styles = createBusinessDetailStyles(colors, accentColor);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Normalizar lista de galería
  const rawGallery = business.gallery && business.gallery.length > 0
    ? business.gallery
    : sector.defaultGallery;

  const galleryItems: BusinessGalleryItem[] = rawGallery.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: `gal-${idx}`, imageUrl: item, title: `Foto ${idx + 1}` };
    }
    return item;
  });

  if (galleryItems.length === 0) {
    return null;
  }

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{sector.galleryTitle}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {galleryItems.length} {galleryItems.length === 1 ? 'imagen' : 'imágenes'}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>{sector.gallerySubtitle}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryScrollContent}
      >
        {galleryItems.map((item) => {
          const isFailed = failedImages[item.id];

          return (
            <View key={item.id} style={styles.galleryCard}>
              {!isFailed ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                  onError={() => handleImageError(item.id)}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.background.tertiary,
                  }}
                >
                  <Feather name="image" size={24} color={colors.text.muted} />
                </View>
              )}

              {item.title ? (
                <View style={styles.galleryOverlay}>
                  <Text style={styles.galleryCaption} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
