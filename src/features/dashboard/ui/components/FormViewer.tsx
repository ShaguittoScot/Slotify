import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  Layout,
  LinearTransition,
  FadeInDown
} from 'react-native-reanimated';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useAppTheme } from '@/shared/theme';
import { FormSchema, FormField } from '../screens/FormBuilderScreen';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface FormViewerProps {
  schema: FormSchema;
  onSubmit: (answers: Record<string, any>) => void;
  onCancel?: () => void;
}

export function FormViewer({ schema, onSubmit, onCancel }: FormViewerProps) {
  const { colors, isDark } = useAppTheme();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Para el modo 'interactive_slides'
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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

  // ─── Componentes de Renderizado de Campos ───
  const renderFieldInput = (field: FormField, isSlideMode: boolean) => {
    const value = answers[field.id];

    switch (field.type) {
      case 'short_text':
      case 'paragraph':
        return (
          <TextInput
            style={[
              styles.textInput,
              { 
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDark ? '#333' : '#E5E5E5',
                color: colors.text.primary,
                minHeight: field.type === 'paragraph' ? 100 : 50
              },
              isSlideMode && styles.textInputLarge
            ]}
            placeholder="Escribe tu respuesta aquí..."
            placeholderTextColor={colors.text.muted}
            multiline={field.type === 'paragraph'}
            value={value || ''}
            onChangeText={(text) => handleAnswer(field.id, text)}
          />
        );

      case 'single_choice':
      case 'multiple_choice':
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
                        ? (isDark ? `${schema.accentColor}30` : `${schema.accentColor}15`) 
                        : (isDark ? '#1E1E1E' : '#FFFFFF'),
                      borderColor: isSelected ? schema.accentColor : (isDark ? '#333' : '#E5E5E5')
                    },
                    isSlideMode && styles.optionCardLarge
                  ]}
                  onPress={() => {
                    if (isMulti) {
                      const curr = (value as string[]) || [];
                      const next = isSelected ? curr.filter(i => i !== opt) : [...curr, opt];
                      handleAnswer(field.id, next);
                    } else {
                      handleAnswer(field.id, opt);
                      // Auto-advance en Typeform para single choice
                      if (isSlideMode) setTimeout(handleNextSlide, 350);
                    }
                  }}
                >
                  <View style={[
                    styles.checkbox, 
                    { 
                      borderRadius: isMulti ? 6 : 12,
                      borderColor: isSelected ? schema.accentColor : colors.text.muted,
                      backgroundColor: isSelected ? schema.accentColor : 'transparent'
                    }
                  ]}>
                    {isSelected && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <Text style={[
                    styles.optionText, 
                    { color: isSelected ? schema.accentColor : colors.text.primary },
                    isSlideMode && styles.optionTextLarge
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'rating_stars':
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
                  name={(star <= rating ? "star" : "staro") as any} 
                  size={isSlideMode ? 44 : 32} 
                  color={star <= rating ? "#F59E0B" : colors.text.muted} 
                />
              </TouchableOpacity>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };


  // ═══════════════════════════════════════════════════════════
  // RENDER: ESTILO SLIDES (TYPEFORM)
  // ═══════════════════════════════════════════════════════════
  if (schema.presentationStyle === 'interactive_slides') {
    const currentField = schema.fields[currentSlideIndex];
    const progress = ((currentSlideIndex + 1) / schema.fields.length) * 100;

    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Barra de progreso superior */}
        <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
          <Animated.View 
            layout={LinearTransition} 
            style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: schema.accentColor }]} 
          />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.slideScrollContent} keyboardShouldPersistTaps="handled">
            
            <Animated.View
              key={currentField.id}
              entering={SlideInRight.duration(400).springify()}
              exiting={SlideOutLeft.duration(300)}
              style={styles.slideContent}
            >
              <Text style={[styles.slideQuestionNumber, { color: schema.accentColor }]}>
                {currentSlideIndex + 1} <Feather name="arrow-right" />
              </Text>
              <Text style={[styles.slideQuestionText, { color: colors.text.primary }]}>
                {currentField.question}
                {currentField.required && <Text style={{ color: colors.status.error }}> *</Text>}
              </Text>
              
              <View style={styles.slideInputWrapper}>
                {renderFieldInput(currentField, true)}
              </View>

            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* Controles de Navegación del Slide */}
        <View style={[styles.slideNavigation, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity 
            style={[styles.slideNavBtn, { opacity: currentSlideIndex === 0 ? 0.3 : 1 }]}
            onPress={handlePrevSlide}
            disabled={currentSlideIndex === 0}
          >
            <Feather name="chevron-up" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.slideMainBtn, { backgroundColor: schema.accentColor }]}
            onPress={handleNextSlide}
          >
            <Text style={styles.slideMainBtnText}>
              {currentSlideIndex === schema.fields.length - 1 ? 'Enviar Respuestas' : 'Siguiente'}
            </Text>
            <Feather name="check" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  // ═══════════════════════════════════════════════════════════
  // RENDER: ESTILO CLÁSICO SCROLL (GOOGLE FORMS)
  // ═══════════════════════════════════════════════════════════
  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.classicScrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Cabecera del Formulario */}
          <Animated.View 
            entering={FadeInDown.duration(400)}
            style={[styles.classicHeader, { backgroundColor: colors.background.primary, borderTopColor: schema.accentColor }]}
          >
            <Text style={[styles.classicTitle, { color: colors.text.primary }]}>{schema.title}</Text>
            {schema.description ? (
              <Text style={[styles.classicDesc, { color: colors.text.secondary }]}>{schema.description}</Text>
            ) : null}
          </Animated.View>

          {/* Lista de Campos */}
          {schema.fields.map((field, idx) => (
            <Animated.View 
              key={field.id}
              entering={FadeInDown.duration(400).delay(150 + (idx * 100))}
              style={[styles.classicFieldCard, { backgroundColor: colors.background.primary }]}
            >
              <Text style={[styles.classicFieldQuestion, { color: colors.text.primary }]}>
                {field.question}
                {field.required && <Text style={{ color: colors.status.error }}> *</Text>}
              </Text>
              
              <View style={styles.classicInputWrapper}>
                {renderFieldInput(field, false)}
              </View>
            </Animated.View>
          ))}

          {/* Botón de Enviar */}
          <Animated.View entering={FadeIn.delay(600)}>
            <TouchableOpacity 
              style={[styles.classicSubmitBtn, { backgroundColor: schema.accentColor }]}
              onPress={() => onSubmit(answers)}
              activeOpacity={0.8}
            >
              <Text style={styles.classicSubmitBtnText}>Enviar Formulario</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Elementos Comunes
  textInput: {
    borderWidth: 1,
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
    borderWidth: 1,
  },
  optionCardLarge: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  checkbox: {
    width: 24, height: 24, borderWidth: 2, marginRight: 12,
    alignItems: 'center', justifyContent: 'center'
  },
  optionText: { fontSize: 16, fontWeight: '500' },
  optionTextLarge: { fontSize: 18, fontWeight: '600' },
  
  starsContainer: { flexDirection: 'row', gap: 12, alignItems: 'center' },

  // ESTILO: Interactive Slides
  progressBarBg: { height: 4, width: '100%' },
  progressBarFill: { height: '100%' },
  slideScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  slideContent: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  slideQuestionNumber: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  slideQuestionText: { fontSize: 28, fontWeight: '800', lineHeight: 36, marginBottom: 32 },
  slideInputWrapper: { minHeight: 120 },
  slideNavigation: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', 
    paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 32, gap: 16 
  },
  slideNavBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(150,150,150,0.1)', alignItems: 'center', justifyContent: 'center' },
  slideMainBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, height: 50, borderRadius: 25, gap: 8 },
  slideMainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ESTILO: Classic Scroll
  classicScrollContent: { padding: 16, gap: 16 },
  classicHeader: {
    padding: 24, borderRadius: 16, borderTopWidth: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  classicTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  classicDesc: { fontSize: 15, lineHeight: 22 },
  classicFieldCard: {
    padding: 24, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  classicFieldQuestion: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  classicInputWrapper: { },
  classicSubmitBtn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  classicSubmitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
