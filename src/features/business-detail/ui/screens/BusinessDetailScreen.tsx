import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { useBusinessBrand } from '@/features/business-brand';

import { useBusinessDetail, detectSector } from '../../model';
import { BusinessCoverHero } from '../components/BusinessCoverHero';
import { BusinessAboutSection } from '../components/BusinessAboutSection';
import { BusinessServicesSection } from '../components/BusinessServicesSection';
import { BusinessStaffSection } from '../components/BusinessStaffSection';
import { BusinessGallerySection } from '../components/BusinessGallerySection';
import { BusinessLocationHoursSection } from '../components/BusinessLocationHoursSection';
import { BusinessBookingBottomBar } from '../components/BusinessBookingBottomBar';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

export function BusinessDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useAppTheme();

  const { business, isLoading, isNotFound, errorMessage, refetch } =
    useBusinessDetail(slug);

  const brand = useBusinessBrand(business);
  const accentColor = brand.primaryColor;

  const sector = useMemo(() => {
    return detectSector(business ?? undefined);
  }, [business]);

  const styles = useMemo(
    () => createBusinessDetailStyles(colors, accentColor),
    [colors, accentColor]
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/explore' as any);
    }
  };

  const handleBook = () => {
    if (business?.slug) {
      router.push(`/book/${business.slug}` as any);
    }
  };

  // ── ESTADO 1: CARGA INICIAL (SKELETON) ──
  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.floatingNavBar}>
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={19} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCover} />

          <View style={styles.skeletonCard}>
            <View style={styles.skeletonLineLong} />
            <View style={styles.skeletonLineShort} />
          </View>

          <View style={styles.skeletonCard}>
            <View style={styles.skeletonLineLong} />
            <View style={styles.skeletonLineShort} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── ESTADO 2: NEGOCIO NO ENCONTRADO (404) ──
  if (isNotFound) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.floatingNavBar}>
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={19} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.feedbackCenter}>
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackIconCircle}>
              <Feather name="alert-circle" size={30} color={colors.text.muted} />
            </View>
            <Text style={styles.feedbackTitle}>Establecimiento no encontrado</Text>
            <Text style={styles.feedbackDescription}>
              El negocio que buscas no existe o ya no se encuentra disponible
              públicamente en Slotify.
            </Text>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={handleBack}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Volver a explorar negocios"
            >
              <Feather
                name="arrow-left"
                size={16}
                color={colors.action.primaryText}
              />
              <Text style={styles.feedbackButtonText}>Volver a Explorar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── ESTADO 3: ERROR DE RED / INESPERADO ──
  if (errorMessage || !business) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.floatingNavBar}>
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={19} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.feedbackCenter}>
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackErrorIconCircle}>
              <Feather
                name="alert-triangle"
                size={28}
                color={colors.status.error}
              />
            </View>
            <Text style={styles.feedbackTitle}>Problema de conexión</Text>
            <Text style={styles.feedbackDescription}>
              {errorMessage || 'Ocurrió un error al cargar los datos del negocio.'}
            </Text>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={refetch}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Reintentar carga de negocio"
            >
              <Feather
                name="refresh-cw"
                size={16}
                color={colors.action.primaryText}
              />
              <Text style={styles.feedbackButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── ESTADO 4: PRESENTACIÓN COMERCIAL PÚBLICA ──
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 1. Portada con imagen, logotipo, nombre, categoría y ubicación */}
          <BusinessCoverHero
            business={business}
            sector={sector}
            accentColor={accentColor}
            onBack={handleBack}
          />

          {/* 2. Presentación y descripción del negocio */}
          <BusinessAboutSection
            business={business}
            sector={sector}
            accentColor={accentColor}
          />

          {/* 3. Catálogo de servicios, productos o menú según el sector */}
          <BusinessServicesSection
            services={business.services}
            sector={sector}
            accentColor={accentColor}
          />

          {/* 4. Profesionales / Staff (cuando corresponda por sector) */}
          <BusinessStaffSection
            business={business}
            sector={sector}
            accentColor={accentColor}
          />

          {/* 5. Galería de fotografías (según el sector) */}
          <BusinessGallerySection
            business={business}
            sector={sector}
            accentColor={accentColor}
          />

          {/* 6. Ubicación, horarios y contacto */}
          <BusinessLocationHoursSection
            business={business}
            sector={sector}
            accentColor={accentColor}
          />
        </ScrollView>

        {/* 7. Botón de acción para iniciar una reserva */}
        <BusinessBookingBottomBar
          business={business}
          sector={sector}
          accentColor={accentColor}
          onBook={handleBook}
        />
      </View>
    </SafeAreaView>
  );
}
