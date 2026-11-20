import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';

import { useBusinessDetail, isValidHexColor } from '../../model';
import { BusinessDetailHeader } from '../components/BusinessDetailHeader';
import { BusinessInfoSection } from '../components/BusinessInfoSection';
import { BusinessServicesSection } from '../components/BusinessServicesSection';
import { createBusinessDetailStyles } from '../styles/businessDetail.styles';

export function BusinessDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useAppTheme();

  const { business, isLoading, isNotFound, errorMessage, refetch } =
    useBusinessDetail(slug);

  const accentColor = useMemo(() => {
    if (business && isValidHexColor(business.brandColor)) {
      return business.brandColor!;
    }
    return colors.action.primary;
  }, [business, colors]);

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
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Cargando negocio...</Text>
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonHeaderCard}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonHeaderLines}>
              <View style={styles.skeletonLineTitle} />
              <View style={styles.skeletonLinePill} />
              <View style={styles.skeletonLineSlug} />
            </View>
          </View>

          <View style={styles.skeletonInfoBox}>
            <View style={styles.skeletonBarLong} />
            <View style={styles.skeletonBarShort} />
          </View>

          <View style={styles.skeletonInfoBox}>
            <View style={styles.skeletonBarLong} />
            <View style={styles.skeletonBarShort} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── ESTADO 2: NEGOCIO NO ENCONTRADO (404) ──
  if (isNotFound) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>No encontrado</Text>
          <View style={styles.navSpacer} />
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
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Feather name="arrow-left" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Error de conexión</Text>
          <View style={styles.navSpacer} />
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

  // ── ESTADO 4: INFORMACIÓN CARGADA EXITOSAMENTE ──
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.screenContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <BusinessDetailHeader
            business={business}
            accentColor={accentColor}
            onBack={handleBack}
          />

          <BusinessInfoSection
            business={business}
            accentColor={accentColor}
          />

          <BusinessServicesSection
            services={business.services}
            accentColor={accentColor}
          />
        </ScrollView>

        {/* Botón de acción principal fijo al pie */}
        <View style={styles.bottomBarContainer}>
          <TouchableOpacity
            style={styles.bookCtaButton}
            onPress={handleBook}
            activeOpacity={0.85}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Reservar cita en ${business.name}`}
          >
            <Feather name="calendar" size={18} color="#FFFFFF" />
            <Text style={styles.bookCtaText}>Reservar cita</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
