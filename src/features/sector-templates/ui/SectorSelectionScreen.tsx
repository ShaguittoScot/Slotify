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

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 130 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header con entrada suave */}
          <Animated.View
            entering={FadeInDown.delay(40).springify().damping(16)}
            style={styles.header}
          >
            <View style={styles.kickerBadge}>
              <Text style={styles.kickerText}>ONBOARDING MODULAR</Text>
            </View>
            <Text style={styles.heading}>
              Elige el giro de tu negocio
            </Text>
            <Text style={styles.subheading}>
              Personalizaremos tu catálogo de servicios, tiempos y módulos con base en tu sector comercial.
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

          {/* Banner Dinámico Frosted Glass con morphing elástico al alternar sector */}
          {selectedCategory && (
            <Animated.View
              key={`info-${selectedCategory.id}`}
              entering={FadeInDown.springify().damping(14).stiffness(160)}
              style={[
                styles.infoCard,
                isCustomCanvas ? styles.infoCardCustom : styles.infoCardSuggested,
                webDockGlass,
              ]}
            >
              <View
                style={[
                  styles.infoIconBox,
                  isCustomCanvas ? styles.infoIconCustom : styles.infoIconSuggested,
                ]}
              >
                <SymbolView
                  name={
                    isCustomCanvas
                      ? { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }
                      : { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }
                  }
                  size={18}
                  tintColor={isCustomCanvas ? '#34D399' : '#818CF8'}
                />
              </View>
              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.infoTitle,
                    isCustomCanvas ? styles.infoTitleCustom : styles.infoTitleSuggested,
                  ]}
                >
                  {isCustomCanvas ? 'Modo Lienzo Libre Activado' : `${selectedCategory.name} seleccionado`}
                </Text>
                <Text style={styles.infoDescription}>
                  {isCustomCanvas
                    ? 'Comenzarás con una estructura modular limpia. Tú decides qué módulos habilitar.'
                    : `Verás opciones de plantillas y servicios optimizados para ${selectedCategory.tagline}.`}
                </Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Dock Flotante Inferior con FluidButton */}
        <View style={[styles.bottomDock, webDockGlass]}>
          <FluidButton
            testID="continue-sector-button"
            label={isCustomCanvas ? 'Continuar con Lienzo Libre' : 'Continuar al Catálogo'}
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
    backgroundColor: '#06080F',
  },
  responsiveShell: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#090D18',
    position: 'relative',
    minHeight: '100%',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderLeftColor: 'rgba(255, 255, 255, 0.08)',
      borderRightColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 0 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.12)',
    } as any),
  },

  // Top Bar
  topBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(9, 13, 24, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#818CF8',
    letterSpacing: 1.2,
  },
  stepTrack: {
    width: 72,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  stepProgress: {
    width: 24,
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  topBarPlaceholder: {
    width: 44,
  },

  // Contenido con Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    zIndex: 1,
  },

  // Header
  header: {
    marginBottom: 26,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
    borderLeftColor: 'rgba(99, 102, 241, 0.3)',
    borderRightColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A5B4FC',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#94A3B8',
  },

  // Loading
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginTop: 20,
    gap: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoCardSuggested: {
    borderLeftColor: 'rgba(99, 102, 241, 0.5)',
  },
  infoCardCustom: {
    borderLeftColor: 'rgba(16, 185, 129, 0.5)',
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoIconSuggested: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  infoIconCustom: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoTitleSuggested: {
    color: '#A5B4FC',
  },
  infoTitleCustom: {
    color: '#34D399',
  },
  infoDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: '#94A3B8',
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
    backgroundColor: 'rgba(9, 13, 24, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 10,
  },
});
