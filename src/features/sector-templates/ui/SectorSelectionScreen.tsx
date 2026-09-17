/**
 * US-006: SectorSelectionScreen
 * 
 * Pantalla principal con estética Glassmorphism UI Premium y animaciones fluidas (Spring Physics):
 * - Orbes de iluminación ambiental cromática (AmbientGlowOrbs) con deriva orbital continua
 * - Transición de resorte reactiva al cambiar de giro comercial en el banner dinámico
 * - Botón de acción táctil FluidButton con halo de respiración y física de resorte
 * - Superficies de cristal esmerilado con backdrop-filter: blur(20px)
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FluidButton } from '@/components/ui/FluidButton';
import { useSectorTemplateStore } from '../model';
import { saveBusinessSectorSelection } from '../api';
import { SectorTemplateSelector } from './SectorTemplateSelector';
import type { SectorCategory } from '../types';

interface SectorSelectionScreenProps {
  onContinueNavigation?: (selectedCategory: SectorCategory) => void;
}

export const SectorSelectionScreen: React.FC<SectorSelectionScreenProps> = ({
  onContinueNavigation,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    categories,
    selectedCategory,
    isCustomCanvas,
    isLoading,
    selectCategoryById,
    loadTemplates,
  } = useSectorTemplateStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelectCategory = (category: SectorCategory) => {
    selectCategoryById(category.id);
  };

  const handleContinue = () => {
    if (!selectedCategory) return;

    // Persiste la selección de giro en el backend de forma optimista (fire-and-forget).
    // El businessId será reemplazado por el ID real del backend una vez que el
    // flujo de autenticación/registro esté completo (Paso 03 del onboarding).
    saveBusinessSectorSelection({
      businessId: 'onboarding-pending',
      sectorTemplateId: selectedCategory.id,
      isCustomCanvas: selectedCategory.isCustomCanvas,
    }).catch(() => {
      // Ignorado intencionalmente: el catálogo canónico local es la fuente de verdad
      // durante el onboarding. La persistencia final ocurre al completar el registro.
    });

    if (onContinueNavigation) {
      onContinueNavigation(selectedCategory);
      return;
    }

    router.push({
      pathname: '/(onboarding)/templates' as any,
      params: {
        sectorId: selectedCategory.id.toString(),
        sectorKey: selectedCategory.key,
        isCustom: selectedCategory.isCustomCanvas ? 'true' : 'false',
      },
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  const webDockGlass = Platform.OS === 'web' ? ({
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as any) : {};

  return (
    <View style={styles.outerScreen}>
      {/* Contenedor centralizado responsivo */}
      <View style={styles.responsiveShell}>
        {/* Barra Superior con Progreso y Safe Area para evitar colisión con Notch */}
        <View style={[styles.topBar, { paddingTop: insets.top, height: 56 + insets.top }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Regresar"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
            onPress={handleBack}
          >
            <SymbolView
              name={{ ios: 'chevron.backward', android: 'arrow_back', web: 'arrow_back' }}
              size={18}
              tintColor="#E2E8F0"
            />
          </TouchableOpacity>

          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>PASO 01 / 03</Text>
            <View style={styles.stepTrack}>
              <View style={styles.stepProgress} />
            </View>
          </View>

          <View style={styles.topBarPlaceholder} />
        </View>

        <View style={styles.mainContent}>
          {/* Hero Header Minimalista */}
          <Animated.View
            entering={FadeInDown.delay(40).springify().damping(16)}
            style={styles.header}
          >
            <Text style={styles.heading}>
              ¿Cuál es tu giro comercial?
            </Text>
            <Text style={styles.subheading}>
              Configuraremos tu entorno de trabajo en base a tu sector.
            </Text>
          </Animated.View>

          {/* Lista de Giros Comerciales con render instantáneo */}
          {isLoading && categories.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>
                Cargando sectores disponibles...
              </Text>
            </View>
          ) : (
            <SectorTemplateSelector
              categories={categories}
              selectedCategoryId={selectedCategory?.id ?? null}
              onSelectCategory={handleSelectCategory}
            />
          )}

        </View>

        {/* Dock Flotante Inferior con FluidButton */}
        <View style={[styles.bottomDock, webDockGlass]}>
          <FluidButton
            testID="continue-sector-button"
            label={
              selectedCategory 
                ? (isCustomCanvas ? 'Continuar con Lienzo Libre' : `Continuar con ${selectedCategory.name}`) 
                : 'Selecciona una opción'
            }
            disabled={!selectedCategory}
            variant={isCustomCanvas ? 'emerald' : 'primary'}
            onPress={handleContinue}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  responsiveShell: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    minHeight: '100%',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderLeftColor: '#E3E5E6',
      borderRightColor: '#E3E5E6',
      boxShadow: '0 0 40px rgba(0, 0, 0, 0.05)',
    } as any),
  },

  // Top Bar
  topBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E5E6',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E3E5E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    alignItems: 'center',
    gap: 5,
  },
  stepText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#3F5B58',
    letterSpacing: 1.2,
  },
  stepTrack: {
    width: 72,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E3E5E6',
    overflow: 'hidden',
  },
  stepProgress: {
    width: 24,
    height: '100%',
    backgroundColor: '#3F5B58',
    borderRadius: 2,
  },
  topBarPlaceholder: {
    width: 44,
  },

  // Contenido Principal
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
    zIndex: 1,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#2D3250',
    marginBottom: 6,
    lineHeight: 32,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: '#AAACAD',
  },

  // Loading
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#AAACAD',
  },



  // Bottom Dock
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.select({ ios: 32, default: 18 }),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E3E5E6',
    zIndex: 10,
  },
});
