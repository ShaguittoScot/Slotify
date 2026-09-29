import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/shared/theme';
import { STORAGE_KEYS } from '@/shared/lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  iconName: string;
  iconFamily: 'feather' | 'material';
  badge: string;
  title: string;
  subtitle: string;
  accentColor: string;
  features: { icon: string; text: string }[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    iconName: 'compass',
    iconFamily: 'feather',
    badge: 'Descubrimiento Local',
    title: 'Tus negocios favoritos, a un solo toque',
    subtitle:
      'Encuentra barberías, spas, consultorios médicos, estéticas y profesionales verificados cerca de ti.',
    accentColor: '#6366F1',
    features: [
      { icon: 'star', text: 'Calificaciones y reseñas reales' },
      { icon: 'map-pin', text: 'Negocios y especialistas cercanos' },
      { icon: 'zap', text: 'Disponibilidad de turnos en vivo' },
    ],
  },
  {
    id: '2',
    iconName: 'calendar',
    iconFamily: 'feather',
    badge: 'Reserva Inmediata 24/7',
    title: 'Agenda en segundos sin llamadas ni esperas',
    subtitle:
      'Elige el servicio, selecciona a tu profesional de confianza y confirma tu horario exacto en tiempo real.',
    accentColor: '#10B981',
    features: [
      { icon: 'check-circle', text: 'Confirmación instantánea' },
      { icon: 'user-check', text: 'Selecciona a tu profesional' },
      { icon: 'dollar-sign', text: 'Precios y duraciones claras' },
    ],
  },
  {
    id: '3',
    iconName: 'bell',
    iconFamily: 'feather',
    badge: 'Recordatorios & Control',
    title: 'Cero olvidos y gestión sin complicaciones',
    subtitle:
      'Recibe notificaciones automáticas antes de tu cita y reagenda o cancela fácilmente si tus planes cambian.',
    accentColor: '#F59E0B',
    features: [
      { icon: 'bell', text: 'Recordatorios automáticos a tiempo' },
      { icon: 'calendar', text: 'Historial completo de tus citas' },
      { icon: 'refresh-cw', text: 'Reagenda con un solo toque' },
    ],
  },
];

const INTEREST_CATEGORIES = [
  { id: 'barberia', name: 'Barbería y Estilo', icon: 'scissors-cutting', color: '#6366F1' },
  { id: 'belleza', name: 'Salón y Estética', icon: 'face-woman-shimmer', color: '#EC4899' },
  { id: 'spa', name: 'Spa y Masajes', icon: 'spa', color: '#10B981' },
  { id: 'salud', name: 'Salud y Consultorios', icon: 'medical-bag', color: '#06B6D4' },
  { id: 'unas', name: 'Uñas y Pestañas', icon: 'hand-peace', color: '#8B5CF6' },
  { id: 'tatuajes', name: 'Tatuajes y Arte', icon: 'palette', color: '#F59E0B' },
];

export const ConsumerOnboardingScreen = () => {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['barberia', 'belleza']);
  const flatListRef = useRef<FlatList>(null);

  const totalSteps = SLIDES.length + 1; // 3 slides + 1 paso de intereses

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONSUMER_ONBOARDING_COMPLETE, 'true');
      if (selectedInterests.length > 0) {
        await AsyncStorage.setItem('consumerInterests', JSON.stringify(selectedInterests));
      }
    } catch (e) {
      console.warn('Error saving consumer onboarding state:', e);
    }
    router.replace('/(main)/explore' as any);
  };

  const handleNext = () => {
    if (currentIndex < totalSteps - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
    } else {
      handleFinish();
    }
  };

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIdx >= 0 && newIdx < totalSteps) {
      setCurrentIndex(newIdx);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* ─── TOP BAR (Paginación y Botón Omitir) ─── */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={[styles.brandBadge, { backgroundColor: colors.action.primary + '18' }]}>
            <Feather name="zap" size={14} color={colors.action.primary} />
            <Text style={[styles.brandText, { color: colors.action.primary }]}>Slotify Client</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.skipBtn, { backgroundColor: colors.background.secondary }]}
          onPress={handleFinish}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipText, { color: colors.text.secondary }]}>Omitir</Text>
          <Feather name="chevron-right" size={14} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* ─── CONTENIDO EN CARRUSEL ─── */}
      <FlatList
        ref={flatListRef}
        data={[...SLIDES, { id: 'interests' } as any]}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item, index }) => {
          // PASO 4: SELECCIÓN DE INTERESES
          if (item.id === 'interests') {
            return (
              <View style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.interestsScroll}>
                  <Animated.View entering={FadeInDown.duration(400)} style={styles.interestsHeader}>
                    <View style={[styles.heroIconBox, { backgroundColor: '#8B5CF618' }]}>
                      <Feather name="heart" size={32} color="#8B5CF6" />
                    </View>
                    <View style={styles.badgeWrapper}>
                      <Text style={[styles.slideBadge, { color: '#8B5CF6', backgroundColor: '#8B5CF615' }]}>
                        Personaliza tu Experiencia
                      </Text>
                    </View>
                    <Text style={[styles.slideTitle, { color: colors.text.primary }]}>
                      ¿Qué servicios buscas con más frecuencia?
                    </Text>
                    <Text style={[styles.slideSubtitle, { color: colors.text.secondary }]}>
                      Selecciona una o más categorías para ordenar y personalizar tu explorador de citas.
                    </Text>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.interestsGrid}>
                    {INTEREST_CATEGORIES.map((cat) => {
                      const isSelected = selectedInterests.includes(cat.id);
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.interestChip,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? 'rgba(99, 102, 241, 0.2)'
                                  : 'rgba(99, 102, 241, 0.1)'
                                : colors.background.secondary,
                              borderColor: isSelected ? colors.action.primary : colors.border.main,
                            },
                          ]}
                          onPress={() => toggleInterest(cat.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.interestIconCircle,
                              { backgroundColor: isSelected ? cat.color + '25' : colors.background.tertiary },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={cat.icon as any}
                              size={20}
                              color={isSelected ? cat.color : colors.text.muted}
                            />
                          </View>
                          <Text
                            style={[
                              styles.interestChipText,
                              {
                                color: isSelected ? colors.text.primary : colors.text.secondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {cat.name}
                          </Text>
                          {isSelected && (
                            <View style={[styles.checkDot, { backgroundColor: colors.action.primary }]}>
                              <Feather name="check" size={10} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </Animated.View>
                </ScrollView>
              </View>
            );
          }

          // PASOS 1, 2 y 3: SLIDES DE VALOR
          const slide = item as Slide;
          return (
            <View style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.slideScrollContent}>
                {/* Hero Icon con resplandor */}
                <Animated.View
                  entering={FadeInDown.duration(400)}
                  style={[styles.heroIconWrapper, { backgroundColor: slide.accentColor + '12' }]}
                >
                  <View style={[styles.heroIconInner, { backgroundColor: slide.accentColor + '20' }]}>
                    <Feather name={slide.iconName as any} size={36} color={slide.accentColor} />
                  </View>
                </Animated.View>

                {/* Badge de contexto */}
                <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.badgeWrapper}>
                  <Text style={[styles.slideBadge, { color: slide.accentColor, backgroundColor: slide.accentColor + '18' }]}>
                    {slide.badge}
                  </Text>
                </Animated.View>

                {/* Título y Subtítulo */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                  <Text style={[styles.slideTitle, { color: colors.text.primary }]}>{slide.title}</Text>
                  <Text style={[styles.slideSubtitle, { color: colors.text.secondary }]}>{slide.subtitle}</Text>
                </Animated.View>

                {/* Lista de Características clave */}
                <Animated.View entering={FadeInDown.duration(550).delay(300)} style={styles.featuresList}>
                  {slide.features.map((feat, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.featureItem,
                        {
                          backgroundColor: colors.background.secondary,
                          borderColor: colors.border.main,
                        },
                      ]}
                    >
                      <View style={[styles.featureIconBox, { backgroundColor: slide.accentColor + '18' }]}>
                        <Feather name={feat.icon as any} size={15} color={slide.accentColor} />
                      </View>
                      <Text style={[styles.featureText, { color: colors.text.primary }]}>{feat.text}</Text>
                    </View>
                  ))}
                </Animated.View>
              </ScrollView>
            </View>
          );
        }}
      />

      {/* ─── FOOTER CONTROLS (Dots + Botón Principal) ─── */}
      <View style={[styles.footer, { backgroundColor: colors.background.primary }]}>
        {/* Indicador de Dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: colors.action.primary }]
                    : [styles.inactiveDot, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }],
                ]}
              />
            );
          })}
        </View>

        {/* Botón Principal */}
        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: colors.action.primary }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.mainBtnText, { color: colors.action.primaryText }]}>
            {currentIndex === totalSteps - 1 ? 'Comenzar a Explorar 🚀' : 'Continuar'}
          </Text>
          <Feather
            name={currentIndex === totalSteps - 1 ? 'arrow-right' : 'chevron-right'}
            size={18}
            color={colors.action.primaryText}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  brandText: { fontSize: 13, fontWeight: '700' },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skipText: { fontSize: 13, fontWeight: '600' },
  slideContainer: { flex: 1 },
  slideScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: { marginBottom: 12, alignItems: 'center' },
  slideBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  featuresList: { width: '100%', gap: 10 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 13, fontWeight: '600', flex: 1 },
  interestsScroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
  },
  interestsHeader: { alignItems: 'center', marginBottom: 16 },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  interestsGrid: { width: '100%', gap: 10 },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  interestIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestChipText: { fontSize: 14, flex: 1 },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 16,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  activeDot: { width: 22 },
  inactiveDot: { width: 6 },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
  },
  mainBtnText: { fontSize: 16, fontWeight: '700' },
});
