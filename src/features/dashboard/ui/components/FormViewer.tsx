import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  LinearTransition,
  FadeInDown,
} from 'react-native-reanimated';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { FormSchema, FormField } from '../screens/FormBuilderScreen';
import { LinearGradient } from 'expo-linear-gradient';

// Mock de servicios de Barbería para visualizar en el constructor/preview.
// En producción, esto vendrá del Backend (Business.CustomFormConfig o Business.Services).
const MOCK_SERVICES = [
  { id: 's1', name: 'Corte Clásico', price: 200, duration: 30 },
  { id: 's2', name: 'Arreglo de Barba', price: 150, duration: 20 },
  { id: 's3', name: 'Corte + Barba', price: 300, duration: 50 },
  { id: 's4', name: 'Facial Exprés', price: 180, duration: 25 },
];

interface FormViewerProps {
  schema: FormSchema;
  onSubmit: (answers: Record<string, any>) => void;
  onCancel?: () => void;
}

export function FormViewer({ schema, onSubmit }: FormViewerProps) {
  const { colors, isDark } = useAppTheme();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Para el modo 'interactive_slides'
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const primaryColor = schema.accentColor || '#6366F1';
  const secondaryColor = schema.secondaryColor || primaryColor;
  const businessName = schema.businessName || 'Establecimiento Verificado';

  const getInitials = (name: string) => {
    const clean = (name || 'SN').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const handleAnswer = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < schema.fields.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      onSubmit(answers);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  // ─── Cabecera de Identidad de Marca Reutilizable ───
  const renderBrandIdentityBanner = (compact = false) => (
    <LinearGradient
      colors={[primaryColor, secondaryColor]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.brandBanner,
        compact && styles.brandBannerCompact,
      ]}
    >
      <View style={styles.brandBannerRow}>
        <View
          style={[
            styles.brandLogoContainer,
            compact && styles.brandLogoContainerCompact,
          ]}
        >
          {schema.logoUrl ? (
            <Image
              source={{ uri: schema.logoUrl }}
              style={styles.brandLogoImage}
              resizeMode="cover"
              testID="public-form-logo"
            />
          ) : (
            <Text
              style={[
                styles.brandInitials,
                compact && { fontSize: 15 },
              ]}
            >
              {getInitials(businessName)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={11} color="#FFFFFF" />
            <Text style={styles.verifiedBadgeText}>RESERVA OFICIAL</Text>
          </View>
          <Text
            style={[
              styles.brandBusinessName,
              compact && { fontSize: 16 },
            ]}
            numberOfLines={1}
          >
            {businessName}
          </Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.brandFormMeta}>
          <Text style={styles.brandFormTitle}>{schema.title}</Text>
          {schema.description ? (
            <Text style={styles.brandFormDescription}>{schema.description}</Text>
          ) : null}
        </View>
      )}
    </LinearGradient>
  );

  // ─── Componentes de Renderizado de Campos ───
  const renderFieldInput = (field: FormField, isSlideMode: boolean) => {
    const value = answers[field.id];

    if (field.type === 'service_catalog') {
      const selectedServiceIds = (value as string[]) || [];
      const catalog = MOCK_SERVICES;

      return (
        <View style={styles.optionsContainer}>
          {catalog.map((srv) => {
            const isSelected = selectedServiceIds.includes(srv.id);

            return (
              <TouchableOpacity
                key={srv.id}
                activeOpacity={0.7}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? `${primaryColor}30`
                        : `${primaryColor}15`
                      : isDark
                      ? '#1E1E1E'
                      : '#FFFFFF',
                    borderColor: isSelected
                      ? primaryColor
                      : isDark
                      ? '#333'
                      : '#E5E5E5',
                    justifyContent: 'space-between',
                  },
                  isSlideMode && styles.optionCardLarge,
                ]}
                onPress={() => {
                  const next = isSelected
                    ? selectedServiceIds.filter((id) => id !== srv.id)
                    : [...selectedServiceIds, srv.id];
                  handleAnswer(field.id, next);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderRadius: 6,
                        borderColor: isSelected ? primaryColor : colors.text.muted,
                        backgroundColor: isSelected ? primaryColor : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? primaryColor : colors.text.primary },
                        isSlideMode && styles.optionTextLarge,
                      ]}
                    >
                      {srv.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.text.muted,
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      <Feather name="clock" size={12} /> {srv.duration} min
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.pricePill,
                    {
                      backgroundColor: isSelected
                        ? secondaryColor
                        : isDark
                        ? '#2A2A2A'
                        : '#F4F4F5',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: isSelected ? '#FFFFFF' : colors.text.primary,
                    }}
                  >
                    ${srv.price.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    switch (field.type) {
      case 'short_text':
      case 'paragraph':
        return (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: value ? primaryColor : isDark ? '#333' : '#E5E5E5',
                color: colors.text.primary,
                minHeight: field.type === 'paragraph' ? 100 : 50,
              },
              isSlideMode && styles.textInputLarge,
            ]}
            placeholder="Escribe tu respuesta aquí..."
            placeholderTextColor={colors.text.muted}
            multiline={field.type === 'paragraph'}
            value={value || ''}
            onChangeText={(text) => handleAnswer(field.id, text)}
          />
        );

      case 'single_choice':
      case 'multiple_choice': {
        const isMulti = field.type === 'multiple_choice';
        return (
          <View style={styles.optionsContainer}>
            {field.options?.map((opt, idx) => {
              const isSelected = isMulti
                ? (value as string[])?.includes(opt)
                : value === opt;

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? `${primaryColor}30`
                          : `${primaryColor}15`
                        : isDark
                        ? '#1E1E1E'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? primaryColor
                        : isDark
                        ? '#333'
                        : '#E5E5E5',
                    },
                    isSlideMode && styles.optionCardLarge,
                  ]}
                  onPress={() => {
                    if (isMulti) {
                      const curr = (value as string[]) || [];
                      const next = isSelected
                        ? curr.filter((i) => i !== opt)
                        : [...curr, opt];
                      handleAnswer(field.id, next);
                    } else {
                      handleAnswer(field.id, opt);
                      if (isSlideMode) setTimeout(handleNextSlide, 350);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderRadius: isMulti ? 6 : 12,
                        borderColor: isSelected ? primaryColor : colors.text.muted,
                        backgroundColor: isSelected ? primaryColor : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? primaryColor : colors.text.primary },
                      isSlideMode && styles.optionTextLarge,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }

      case 'rating_stars': {
        const rating = value || 0;
        return (
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  handleAnswer(field.id, star);
                  if (isSlideMode) setTimeout(handleNextSlide, 400);
                }}
              >
                <AntDesign
                  name={(star <= rating ? 'star' : 'staro') as any}
                  size={isSlideMode ? 44 : 32}
                  color={star <= rating ? secondaryColor : colors.text.muted}
                />
              </TouchableOpacity>
            ))}
          </View>
        );
      }

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO DE SUMATORIAS
  // ═══════════════════════════════════════════════════════════
  const hasServiceCatalog = schema.fields.some(
    (f) => f.type === 'service_catalog'
  );
  let totalPrice = 0;
  let totalDuration = 0;

  if (hasServiceCatalog) {
    const serviceField = schema.fields.find((f) => f.type === 'service_catalog');
    if (serviceField) {
      const selectedIds = (answers[serviceField.id] as string[]) || [];
      selectedIds.forEach((id) => {
        const srv = MOCK_SERVICES.find((c) => c.id === id);
        if (srv) {
          totalPrice += srv.price;
          totalDuration += srv.duration;
        }
      });
    }
  }

  // Componente de barra inferior pegajosa
  const SummaryBar = () => {
    if (!hasServiceCatalog || totalPrice === 0) return null;
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          styles.summaryBar,
          {
            backgroundColor: isDark ? '#111' : '#FFF',
            borderTopColor: primaryColor,
          },
        ]}
      >
        <View>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 13,
              fontWeight: '500',
            }}
          >
            Total a pagar
          </Text>
          <Text
            style={{
              color: primaryColor,
              fontSize: 20,
              fontWeight: '800',
            }}
          >
            ${totalPrice.toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 13,
              fontWeight: '500',
            }}
          >
            Tiempo estimado
          </Text>
          <Text
            style={{
              color: secondaryColor,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {totalDuration} min
          </Text>
        </View>
      </Animated.View>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER: ESTILO SLIDES (TYPEFORM)
  // ═══════════════════════════════════════════════════════════
  if (schema.presentationStyle === 'interactive_slides') {
    const currentField = schema.fields[currentSlideIndex];
    const progress =
      schema.fields.length > 0
        ? ((currentSlideIndex + 1) / schema.fields.length) * 100
        : 100;

    return (
      <View
        style={[styles.container, { backgroundColor: colors.background.primary }]}
      >
        {/* Cabecera corporativa compacta */}
        <View style={styles.slidesBrandWrapper}>
          {renderBrandIdentityBanner(true)}
        </View>

        {/* Barra de progreso superior con colores corporativos */}
        <View
          style={[
            styles.progressBarBg,
            { backgroundColor: isDark ? '#333' : '#E5E5E5' },
          ]}
        >
          <Animated.View
            layout={LinearTransition}
            style={[
              styles.progressBarFill,
              { width: `${progress}%`, backgroundColor: primaryColor },
            ]}
          />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.slideScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {currentField && (
              <Animated.View
                key={currentField.id}
                entering={SlideInRight.duration(400).springify()}
                exiting={SlideOutLeft.duration(300)}
                style={styles.slideContent}
              >
                <View
                  style={[
                    styles.slideNumberBadge,
                    { backgroundColor: `${secondaryColor}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.slideQuestionNumber,
                      { color: primaryColor },
                    ]}
                  >
                    Paso {currentSlideIndex + 1} de {schema.fields.length}{' '}
                    <Feather name="arrow-right" />
                  </Text>
                </View>

                <Text
                  style={[
                    styles.slideQuestionText,
                    { color: colors.text.primary },
                  ]}
                >
                  {currentField.question}
                  {currentField.required && (
                    <Text style={{ color: colors.status.error }}> *</Text>
                  )}
                </Text>

                <View style={styles.slideInputWrapper}>
                  {renderFieldInput(currentField, true)}
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Controles de Navegación del Slide */}
        <View
          style={[
            styles.slideNavigation,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.slideNavBtn,
              { opacity: currentSlideIndex === 0 ? 0.3 : 1 },
            ]}
            onPress={handlePrevSlide}
            disabled={currentSlideIndex === 0}
          >
            <Feather name="chevron-up" size={28} color={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.slideMainBtnWrapper}
            onPress={handleNextSlide}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[primaryColor, secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.slideMainBtn}
            >
              <Text style={styles.slideMainBtnText}>
                {currentSlideIndex === schema.fields.length - 1
                  ? 'Confirmar Reserva'
                  : 'Siguiente'}
              </Text>
              <Feather name="check" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <SummaryBar />
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: ESTILO CLÁSICO SCROLL (GOOGLE FORMS)
  // ═══════════════════════════════════════════════════════════
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.classicScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera del Formulario con Identidad de Marca (Logotipo y Colores Corporativos) */}
          <Animated.View entering={FadeInDown.duration(400)}>
            {renderBrandIdentityBanner(false)}
          </Animated.View>

          {/* Lista de Campos */}
          {schema.fields.map((field, idx) => (
            <Animated.View
              key={field.id}
              entering={FadeInDown.duration(400).delay(150 + idx * 100)}
              style={[
                styles.classicFieldCard,
                {
                  backgroundColor: colors.background.primary,
                  borderLeftColor: idx % 2 === 0 ? primaryColor : secondaryColor,
                  borderLeftWidth: 4,
                },
              ]}
            >
              <Text
                style={[
                  styles.classicFieldQuestion,
                  { color: colors.text.primary },
                ]}
              >
                {field.question}
                {field.required && (
                  <Text style={{ color: colors.status.error }}> *</Text>
                )}
              </Text>

              <View style={styles.classicInputWrapper}>
                {renderFieldInput(field, false)}
              </View>
            </Animated.View>
          ))}

          {/* Botón de Enviar con Degradado Corporativo */}
          <Animated.View entering={FadeIn.delay(500)}>
            <TouchableOpacity
              style={styles.classicSubmitBtnWrapper}
              onPress={() => onSubmit(answers)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[primaryColor, secondaryColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.classicSubmitBtn}
              >
                <Text style={styles.classicSubmitBtnText}>
                  Confirmar Reservación
                </Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <SummaryBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Cabecera de Identidad Corporativa
  brandBanner: {
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  brandBannerCompact: {
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogoContainerCompact: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
  },
  brandInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  brandBusinessName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  brandFormMeta: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  brandFormTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  brandFormDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  slidesBrandWrapper: {
    width: '100%',
  },

  // Elementos Comunes
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  textInputLarge: {
    fontSize: 20,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionCardLarge: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { fontSize: 16, fontWeight: '500' },
  optionTextLarge: { fontSize: 18, fontWeight: '600' },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  starsContainer: { flexDirection: 'row', gap: 12, alignItems: 'center' },

  // ESTILO: Interactive Slides
  progressBarBg: { height: 5, width: '100%' },
  progressBarFill: { height: '100%' },
  slideScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  slideContent: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  slideNumberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 14,
  },
  slideQuestionNumber: { fontSize: 14, fontWeight: '700' },
  slideQuestionText: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 32,
  },
  slideInputWrapper: { minHeight: 120 },
  slideNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 16,
  },
  slideNavBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideMainBtnWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  slideMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 25,
    gap: 8,
  },
  slideMainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ESTILO: Classic Scroll
  classicScrollContent: { padding: 16, gap: 16 },
  classicFieldCard: {
    padding: 22,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  classicFieldQuestion: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  classicInputWrapper: {},
  classicSubmitBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  classicSubmitBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  classicSubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Resumen / Sumatoria
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
});
